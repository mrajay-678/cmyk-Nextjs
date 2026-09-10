import { NextRequest, NextResponse } from "next/server";

const DEFAULT_WOO_HOST = "https://wp.cmykprint.shop";
const WC_URL = process.env.NEXT_PUBLIC_WC_URL || DEFAULT_WOO_HOST;
const CART_TOKEN_COOKIE = "cmyk_cart_token";
const CHECKOUT_SECRET = process.env.CMYK_ARTWORK_UPLOAD_SECRET;
const DIRECT_CHECKOUT_SLUGS = new Set([
  "dtf-gang-sheet",
  "dtf-gang-sheet-builder",
  "uv-dtf-gang-sheet",
  "uv-dtf-gang-sheet-builder",
]);

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

function stripHtml(value: unknown) {
  return String(value || "").replace(/<[^>]*>/g, "").trim();
}

function normalizeText(value: unknown) {
  return stripHtml(value)
    .toLowerCase()
    .replace(/&quot;/g, '"')
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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

function getWooUrl(path: string) {
  return new URL(path, new URL(WC_URL));
}

function checkoutUrlFromRef(checkoutRef: string) {
  const url = getWooUrl("/checkout/");
  url.searchParams.set("cmyk_checkout_ref", checkoutRef);
  return url;
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

function getItemDataMetadata(item: WooCartItem) {
  return (item.item_data || [])
    .map((entry) => ({
      name: stripHtml(entry.name || entry.key || ""),
      value: stripHtml(entry.display || entry.value || ""),
    }))
    .filter((entry) => entry.name && entry.value);
}

function getGangSheetMetadataFallback(item: WooCartItem) {
  const data: Record<string, string> = {};

  getItemDataMetadata(item).forEach((entry) => {
    const key = normalizeMetadataKey(entry.name);

    if (key === "uploaded_file") {
      data.uploaded_file = entry.value;
    }

    if (key === "print_ready_file" || key === "print_ready") {
      data.print_ready = entry.value;
    }

    if (key === "gang_sheet_product_type") {
      data.product_type = entry.value;
    }

    if (key === "gang_sheet_design_id" || key === "gs_design_id") {
      data.gs_design_id = entry.value;
    }

    if (key === "gang_sheet_height") {
      data.gang_sheet_height = entry.value;
    }
  });

  return data;
}

function getMergedGangSheetMetadata(item: WooCartItem) {
  return {
    ...getGangSheetMetadataFallback(item),
    ...getGangSheetMetadata(item),
  };
}

function isExpectedGangSheetProduct(item: WooCartItem, expectedSlug: string) {
  if (!expectedSlug) {
    return true;
  }

  const permalinkMatch = String(item.permalink || "")
    .toLowerCase()
    .includes(`/product/${expectedSlug.toLowerCase()}`);
  if (permalinkMatch) {
    return true;
  }

  const expectedName = normalizeText(expectedSlug);
  const itemName = normalizeText(item.name);

  return Boolean(expectedName && itemName.includes(expectedName));
}

function isGangSheetItem(
  item: WooCartItem,
  expectedProductType: string,
  expectedSlug: string,
) {
  const gangSheetData = getMergedGangSheetMetadata(item);
  if (
    expectedProductType &&
    gangSheetData.product_type &&
    gangSheetData.product_type !== expectedProductType
  ) {
    return false;
  }

  if (!isExpectedGangSheetProduct(item, expectedSlug)) {
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
  const variationMetadata = Object.entries(getVariationAttributes(item)).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );

  return [...getItemDataMetadata(item), ...variationMetadata];
}

function buildErrorRedirect(request: NextRequest, message: string) {
  const url = new URL("/cart", request.url);
  url.searchParams.set("gang_sheet_checkout_error", message);
  return NextResponse.redirect(url);
}

async function fetchVerifiedWooCart(request: NextRequest) {
  const headers = new Headers();
  const cookie = getRequestCookieHeader(request);

  if (cookie) {
    headers.set("Cookie", cookie);
  }

  const response = await fetch(getWooUrl("/wp-json/wc/store/v1/cart"), {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`WooCommerce cart verification failed with status ${response.status}.`);
  }

  const cart = parseJsonFromText(await response.text());
  if (!cart || typeof cart !== "object") {
    throw new Error("WooCommerce cart verification returned invalid JSON.");
  }

  return cart as WooCart;
}

async function createCheckoutHandoff(payload: unknown) {
  if (!CHECKOUT_SECRET) {
    throw new Error("Checkout handoff secret is not configured.");
  }

  const response = await fetch(getWooUrl("/wp-json/cmyk/v1/checkout-handoff"), {
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

export async function GET(request: NextRequest) {
  try {
    const expectedProductId = Number(
      request.nextUrl.searchParams.get("product_id") || 0,
    );
    const expectedProductType = request.nextUrl.searchParams.get("product_type") || "";
    const expectedSlug = request.nextUrl.searchParams.get("product_slug") || "";

    if (!expectedProductId) {
      return buildErrorRedirect(request, "Missing Gang Sheet product.");
    }

    if (!DIRECT_CHECKOUT_SLUGS.has(expectedSlug)) {
      return buildErrorRedirect(request, "Invalid Gang Sheet checkout product.");
    }

    const cart = await fetchVerifiedWooCart(request);

    const gangSheetItems = (cart.items || []).filter((item) =>
      isGangSheetItem(item, expectedProductType, expectedSlug),
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
          gang_sheet_data: getMergedGangSheetMetadata(item),
          metadata: getVariationMetadata(item),
          artwork_token: "",
        },
      ],
      billing_address: {},
      shipping_address: {},
      customer_note: "",
      replace_cart: false,
    });

    const checkoutUrl = handoff.checkout_ref
      ? checkoutUrlFromRef(handoff.checkout_ref)
      : new URL(handoff.checkout_url || "/checkout/", WC_URL);
    const response = NextResponse.redirect(checkoutUrl);
    response.cookies.delete(CART_TOKEN_COOKIE);

    return response;
  } catch (error) {
    return buildErrorRedirect(
      request,
      error instanceof Error
        ? error.message
        : "Gang Sheet checkout could not be started.",
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!WC_URL) {
      return NextResponse.json(
        { success: false, message: "WooCommerce URL is not configured." },
        { status: 500 },
      );
    }

    const data = await request.json();

    const { productId, variation, quantity = 1, extensions } = data;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "productId is required.",
        },
        { status: 400 },
      );
    }

    const cartToken =
      request.cookies.get(CART_TOKEN_COOKIE)?.value ||
      request.headers.get("cart-token") ||
      "";

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    if (cartToken) {
      headers.set("Cart-Token", cartToken);
    }

    const response = await fetch(
      `${WC_URL}/wp-json/wc/store/v1/cart/add-item`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          id: Number(productId),
          quantity: Number(quantity),
          ...(variation?.length ? { variation } : {}),
          ...(extensions ? { extensions } : {}),
        }),
        cache: "no-store",
        redirect: "manual",
      },
    );

    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "WooCommerce failed to add the Gang Sheet.",
          wooStatus: response.status,
          details: responseText.slice(0, 1000),
        },
        { status: response.status },
      );
    }

    const cart = parseJsonFromText(responseText);

    if (!cart) {
      return NextResponse.json(
        {
          success: false,
          message: "WooCommerce returned an invalid response.",
        },
        { status: 502 },
      );
    }

    const newCartToken = response.headers.get("Cart-Token");
    const result = NextResponse.json({
      success: true,
      cart,
      checkoutUrl: "/checkout",
    });

    if (newCartToken) {
      result.cookies.set(CART_TOKEN_COOKIE, newCartToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 14,
      });
    }

    return result;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to add Gang Sheet to cart.",
      },
      { status: 500 },
    );
  }
}
