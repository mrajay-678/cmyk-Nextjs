import { NextResponse } from "next/server";

const storeUrl = process.env.NEXT_PUBLIC_WC_URL;
const cmykArtworkUploadSecret = process.env.CMYK_ARTWORK_UPLOAD_SECRET;
const wcConsumerKey = process.env.WC_CONSUMER_KEY;
const wcConsumerSecret = process.env.WC_CONSUMER_SECRET;
const DISALLOWED_METADATA_KEYS = new Set([
  "custom_price",
  "gs_price_tiers",
  "gs_addon_fee",
  "gs_rush_fee",
  "gs_services_fee",
  "gang_sheet_add_on_fee",
  "rush_fee",
  "image_services_fee",
]);

function parseItems(value) {
  if (!value) {
    return [];
  }

  try {
    const items = JSON.parse(String(value));
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function getCheckoutProductId(item) {
  return Number(
    item?.variationId ||
      item?.variation_id ||
      item?.productId ||
      item?.product_id ||
      item?.id,
  );
}

function getCheckoutQuantity(item) {
  return Math.max(
    1,
    Number.parseInt(
      String(item?.checkoutQuantity || item?.cartQuantity || item?.quantity || 1),
      10,
    ) ||
      1,
  );
}

function getLineId(item, index) {
  const raw = String(item?.wooCartKey || item?.key || item?.id || `checkout-line-${index}`);
  const safe = raw.replace(/[^a-zA-Z0-9._:-]+/g, "-").slice(0, 120);
  return safe || `checkout-line-${index}`;
}

function getSafeFileName(file) {
  const fallbackName = "artwork-upload";
  const rawName = String(file?.name || fallbackName);
  return rawName.replace(/[^a-zA-Z0-9._-]+/g, "-") || fallbackName;
}

function parseObject(value) {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function assertServerConfig() {
  if (!storeUrl) {
    throw new Error("WooCommerce store URL is not configured.");
  }

  if (!cmykArtworkUploadSecret) {
    throw new Error(
      "Artwork handoff is not configured. Set CMYK_ARTWORK_UPLOAD_SECRET on the Next.js server and WordPress server.",
    );
  }
}

function getWordPressApiUrl(path) {
  return new URL(path, new URL(storeUrl)).toString();
}

function getWooRestApiUrl(path, query = {}) {
  const url = new URL(`/wp-json/wc/v3${path}`, new URL(storeUrl));
  url.searchParams.set("consumer_key", wcConsumerKey);
  url.searchParams.set("consumer_secret", wcConsumerSecret);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function fetchWooRest(path, query = {}) {
  if (!wcConsumerKey || !wcConsumerSecret) {
    throw new Error("WooCommerce REST API credentials are not configured.");
  }

  const response = await fetch(getWooRestApiUrl(path, query), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`WooCommerce product lookup failed with status ${response.status}.`);
  }

  return response.json();
}

function getProductSlugFromPermalink(permalink) {
  if (!permalink) {
    return "";
  }

  try {
    const url = new URL(String(permalink));
    const parts = url.pathname.split("/").filter(Boolean);
    const productIndex = parts.indexOf("product");
    return productIndex >= 0 ? parts[productIndex + 1] || "" : parts.at(-1) || "";
  } catch {
    return "";
  }
}

async function resolveProductId(item, variationId) {
  const explicitProductId = Number(item?.productId || item?.product_id || 0);
  if (explicitProductId > 0) {
    return explicitProductId;
  }

  if (!variationId) {
    return Number(item?.id || 0);
  }

  const slug = getProductSlugFromPermalink(item?.permalink);
  if (!slug) {
    return 0;
  }

  const products = await fetchWooRest("/products", { slug, per_page: 1 });
  const product = Array.isArray(products) ? products[0] : null;
  return Number(product?.id || 0);
}

function getVariationId(item) {
  const explicitVariationId = Number(item?.variationId || item?.variation_id || 0);
  if (explicitVariationId > 0) {
    return explicitVariationId;
  }

  return String(item?.type || "").toLowerCase() === "variation"
    ? Number(item?.id || 0)
    : 0;
}

function normalizeVariationAttributes(item) {
  if (Array.isArray(item?.variationAttributes)) {
    return item.variationAttributes.reduce((attributes, entry) => {
      const rawKey = entry?.slug || entry?.name;
      const value = entry?.option;
      if (rawKey && value) {
        attributes[rawKey] = value;
      }
      return attributes;
    }, {});
  }

  if (Array.isArray(item?.variation)) {
    return item.variation.reduce((attributes, entry) => {
      const rawKey = entry?.raw_attribute || entry?.attribute;
      const value = entry?.value;
      if (rawKey && value) {
        attributes[rawKey] = value;
      }
      return attributes;
    }, {});
  }

  return item?.variation_attributes && typeof item.variation_attributes === "object"
    ? item.variation_attributes
    : {};
}

function normalizeMetadataEntry(name, value) {
  const safeName = String(name || "").trim();
  const safeKey = safeName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (!safeName || DISALLOWED_METADATA_KEYS.has(safeKey)) {
    return null;
  }

  const rawValue =
    value && typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
  if (!rawValue) {
    return null;
  }

  return {
    name: safeName,
    value: rawValue,
  };
}

function normalizeMetadata(item) {
  const metadata = [];

  if (Array.isArray(item?.metadata)) {
    item.metadata.forEach((entry) => {
      const normalized = normalizeMetadataEntry(
        entry?.name || entry?.key,
        entry?.display || entry?.value,
      );
      if (normalized) metadata.push(normalized);
    });
  }

  if (Array.isArray(item?.item_data)) {
    item.item_data.forEach((entry) => {
      const normalized = normalizeMetadataEntry(
        entry?.name,
        entry?.display || entry?.value,
      );
      if (normalized) metadata.push(normalized);
    });
  }

  const gangSheetMetadata = item?.extensions?.["cmyk-gang-sheet"]?.metadata;
  if (gangSheetMetadata && typeof gangSheetMetadata === "object") {
    Object.entries(gangSheetMetadata).forEach(([key, value]) => {
      const normalized = normalizeMetadataEntry(key, value);
      if (normalized) metadata.push(normalized);
    });
  }

  const seen = new Set();
  return metadata.filter((entry) => {
    const key = `${entry.name}:${entry.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function postToCmykEndpoint(path, body, headers = {}) {
  const response = await fetch(getWordPressApiUrl(path), {
    method: "POST",
    headers: {
      "X-CMYK-Artwork-Secret": cmykArtworkUploadSecret,
      ...headers,
    },
    body,
  });

  const responseText = await response.text();
  let payload = {};
  try {
    payload = responseText ? JSON.parse(responseText) : {};
  } catch {
    payload = { message: responseText };
  }

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        `WordPress checkout handoff failed with status ${response.status}.`,
    );
  }

  return payload;
}

async function uploadArtworkToWordPress(file, checkoutItem) {
  const formData = new FormData();

  formData.append("artwork", file, getSafeFileName(file));
  formData.append("line_id", checkoutItem.lineId);
  formData.append("product_id", String(checkoutItem.productId));
  formData.append("variation_id", String(checkoutItem.variationId || 0));
  formData.append("checkout_product_id", String(checkoutItem.id));
  formData.append("quantity", String(checkoutItem.quantity));
  formData.append("artwork_name", checkoutItem.artworkName || file.name);
  formData.append(
    "artwork_options",
    JSON.stringify(checkoutItem.artworkOptions || {}),
  );

  return postToCmykEndpoint("/wp-json/cmyk/v1/artwork", formData);
}

async function createCheckoutHandoff(payload) {
  return postToCmykEndpoint(
    "/wp-json/cmyk/v1/checkout-handoff",
    JSON.stringify(payload),
    { "Content-Type": "application/json" },
  );
}

export async function POST(request) {
  try {
    assertServerConfig();

    const formData = await request.formData();
    const items = parseItems(formData.get("items"));
    const billingAddress = parseObject(formData.get("billing_address"));
    const shippingAddress = parseObject(formData.get("shipping_address"));
    const customerNote = String(formData.get("customer_note") || "");

    if (!items.length) {
      return NextResponse.json(
        { error: "Invalid or empty items array" },
        { status: 400 },
      );
    }

    const checkoutItems = [];

    for (const [index, item] of items.entries()) {
      const variationId = getVariationId(item);
      const productId = await resolveProductId(item, variationId);
      const checkoutItem = {
        lineId: getLineId(item, index),
        id: getCheckoutProductId(item),
        quantity: getCheckoutQuantity(item),
        productId,
        variationId: variationId || null,
        name: String(item?.name || ""),
        artworkName: String(item?.artworkName || ""),
        artworkOptions: item?.artworkOptions || {},
        artworkToken: "",
        variationAttributes: normalizeVariationAttributes(item),
        metadata: normalizeMetadata(item),
      };

      if (!Number.isFinite(checkoutItem.id) || checkoutItem.id <= 0) {
        continue;
      }

      const artworkFile = formData.get(`artwork-${index}`);

      if (checkoutItem.artworkName && !(artworkFile instanceof File)) {
        return NextResponse.json(
          { error: `Artwork file is missing for ${checkoutItem.name}.` },
          { status: 400 },
        );
      }

      if (artworkFile instanceof File) {
        const uploadedArtwork = await uploadArtworkToWordPress(
          artworkFile,
          checkoutItem,
        );
        checkoutItem.artworkToken = String(uploadedArtwork.artwork_token || "");

        if (!checkoutItem.artworkToken) {
          throw new Error("WordPress did not return an artwork token.");
        }
      }

      checkoutItems.push({
        line_id: checkoutItem.lineId,
        id: checkoutItem.id,
        quantity: checkoutItem.quantity,
        product_id: checkoutItem.productId,
        variation_id: checkoutItem.variationId,
        variation_attributes: checkoutItem.variationAttributes,
        metadata: checkoutItem.metadata,
        artwork_token: checkoutItem.artworkToken,
      });
    }

    if (!checkoutItems.length) {
      return NextResponse.json(
        { error: "No checkout-ready WooCommerce products were found" },
        { status: 400 },
      );
    }

    const handoff = await createCheckoutHandoff({
      items: checkoutItems,
      billing_address: billingAddress,
      shipping_address: shippingAddress,
      customer_note: customerNote,
    });

    if (process.env.NODE_ENV === "development") {
      console.info("[CMYK CART HANDOFF]", {
        itemCount: checkoutItems.length,
        productIds: checkoutItems.map((item) => item.product_id),
        variationIds: checkoutItems.map((item) => item.variation_id || 0),
      });
    }

    if (!handoff.checkout_url) {
      throw new Error("WordPress did not return a checkout URL.");
    }

    return NextResponse.json({ checkoutUrl: handoff.checkout_url });
  } catch (error) {
    console.error("Error in checkout cart API:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
