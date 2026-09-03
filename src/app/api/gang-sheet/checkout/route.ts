import { NextRequest, NextResponse } from "next/server";

const DEFAULT_WOO_HOST = "https://cmykprint.shop";
const CART_TOKEN_COOKIE = "cmyk_cart_token";
const CHECKOUT_SECRET = process.env.CMYK_ARTWORK_UPLOAD_SECRET;
const STORE_URL = process.env.NEXT_PUBLIC_WC_URL || DEFAULT_WOO_HOST;

const GANG_SHEET_METADATA_KEYS = new Set([
  "gs_design_id",
  "product_type",
  "uploaded_file",
  "print_ready",
  "gang_sheet_height",
  "sheet_weight",
  "sheet_weight_unit",
  "gs_image_count",
  "gs_image_services",
  "gs_image_service_ids",
  "design_name",
]);

type WooCartItem = {
  key: string;
  id: number;
  type: string;
  quantity: number;
  name: string;
  permalink?: string;
  variation?: Array<{
    raw_attribute?: string;
    attribute?: string;
    value?: string;
  }>;
  item_data?: Array<{
    name?: string;
    key?: string;
    value?: string;
    display?: string;
  }>;
  extensions?: Record<string, unknown>;
};

type WooCart = {
  items?: WooCartItem[];
};

function normalizeMetadataKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseJsonFromText(text: string) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (char !== "{" && char !== "[") {
        continue;
      }

      try {
        return JSON.parse(text.slice(index));
      } catch {
        continue;
      }
    }
  }

  return null;
}

function getStoreUrl(path: string) {
  return new URL(path, new URL(STORE_URL));
}

function getRequestCookieHeader(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";

  return cookie
    .split(";")
    .map((entry) => entry.trim())
    .filter((entry) => entry && !entry.startsWith(`${CART_TOKEN_COOKIE}=`))
    .join("; ");
}

function getGangSheetMetadata(item: WooCartItem) {
  const metadata =
    (item.extensions?.["cmyk-gang-sheet"] as { metadata?: unknown } | undefined)
      ?.metadata || {};
  const data: Record<string, string> = {};

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return data;
  }

  Object.entries(metadata as Record<string, unknown>).forEach(([key, entry]) => {
    const safeKey = normalizeMetadataKey(key);
    if (!GANG_SHEET_METADATA_KEYS.has(safeKey)) {
      return;
    }

    const value =
      entry && typeof entry === "object" && "value" in entry
        ? (entry as { value?: unknown }).value
        : entry;
    const safeValue =
      value && typeof value === "object" ? JSON.stringify(value) : String(value || "");

    if (safeValue) {
      data[safeKey] = safeValue;
    }
  });

  return data;
}

function isGangSheetItem(item: WooCartItem, expectedProductType: string) {
  const gangSheetData = getGangSheetMetadata(item);
  if (
    expectedProductType &&
    gangSheetData.product_type &&
    gangSheetData.product_type !== expectedProductType
  ) {
    return false;
  }

  if (Object.keys(gangSheetData).length > 0) {
    return true;
  }

  return (item.item_data || []).some((entry) =>
    `${entry.name || entry.key || ""} ${entry.value || ""} ${entry.display || ""}`
      .toLowerCase()
      .includes("gang"),
  );
}

function getVariationAttributes(item: WooCartItem) {
  return (item.variation || []).reduce<Record<string, string>>((attributes, entry) => {
    const key = entry.raw_attribute || entry.attribute || "";
    const value = entry.value || "";

    if (key && value) {
      attributes[key] = value;
    }

    return attributes;
  }, {});
}

function getVariationMetadata(item: WooCartItem) {
  return Object.entries(getVariationAttributes(item)).map(([name, value]) => ({
    name,
    value,
  }));
}

function buildErrorRedirect(request: NextRequest, message: string) {
  const url = new URL("/cart", request.url);
  url.searchParams.set("gang_sheet_checkout_error", message);
  return NextResponse.redirect(url);
}

async function fetchWooCart(request: NextRequest) {
  const headers = new Headers();
  const cookie = getRequestCookieHeader(request);

  if (cookie) {
    headers.set("Cookie", cookie);
  }

  const response = await fetch(getStoreUrl("/wp-json/wc/store/v1/cart"), {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`WooCommerce cart verification failed with status ${response.status}.`);
  }

  const cart = parseJsonFromText(await response.text());
  if (!cart) {
    throw new Error("WooCommerce cart verification returned invalid JSON.");
  }

  return cart as WooCart;
}

async function createCheckoutHandoff(payload: unknown) {
  if (!CHECKOUT_SECRET) {
    throw new Error("Checkout handoff secret is not configured.");
  }

  const response = await fetch(getStoreUrl("/wp-json/cmyk/v1/checkout-handoff"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CMYK-Artwork-Secret": CHECKOUT_SECRET,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = parseJsonFromText(await response.text()) || {};

  if (!response.ok) {
    throw new Error(
      body?.message ||
        body?.error ||
        `WooCommerce checkout handoff failed with status ${response.status}.`,
    );
  }

  return body as { checkout_ref?: string; checkout_url?: string };
}

function checkoutUrlFromRef(checkoutRef: string) {
  const url = getStoreUrl("/checkout/");
  url.searchParams.set("cmyk_checkout_ref", checkoutRef);
  return url;
}

export async function GET(request: NextRequest) {
  try {
    const expectedProductId = Number(
      request.nextUrl.searchParams.get("product_id") || 0,
    );
    const expectedProductType = request.nextUrl.searchParams.get("product_type") || "";

    if (!expectedProductId) {
      return buildErrorRedirect(request, "Missing Gang Sheet product.");
    }

    const cart = await fetchWooCart(request);
    const gangSheetItems = (cart.items || []).filter((item) =>
      isGangSheetItem(item, expectedProductType),
    );
    const item = gangSheetItems[gangSheetItems.length - 1];

    if (!item) {
      return buildErrorRedirect(request, "Gang Sheet was not found in WooCommerce cart.");
    }

    const handoff = await createCheckoutHandoff({
      items: [
        {
          line_id: item.key,
          id: item.id,
          quantity: item.quantity || 1,
          product_id: expectedProductId,
          variation_id: item.type === "variation" ? item.id : 0,
          variation_attributes: getVariationAttributes(item),
          gang_sheet_data: getGangSheetMetadata(item),
          metadata: getVariationMetadata(item),
          artwork_token: "",
        },
      ],
      billing_address: {},
      shipping_address: {},
      customer_note: "",
    });

    const checkoutUrl = handoff.checkout_ref
      ? checkoutUrlFromRef(handoff.checkout_ref)
      : new URL(handoff.checkout_url || "/checkout/", STORE_URL);
    const response = NextResponse.redirect(checkoutUrl);
    response.cookies.delete(CART_TOKEN_COOKIE);

    if (process.env.NODE_ENV === "development") {
      console.info("[CMYK Gang Sheet] verified checkout handoff", {
        productId: expectedProductId,
        productType: expectedProductType || "unknown",
        cartItemId: item.id,
      });
    }

    return response;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[CMYK Gang Sheet] checkout handoff failed", error);
    }

    return buildErrorRedirect(
      request,
      error instanceof Error
        ? error.message
        : "Gang Sheet checkout could not be started.",
    );
  }
}
