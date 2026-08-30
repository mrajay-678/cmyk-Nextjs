import { NextResponse } from "next/server";

const storeUrl = process.env.NEXT_PUBLIC_WC_URL;
const cmykArtworkUploadSecret = process.env.CMYK_ARTWORK_UPLOAD_SECRET;

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
  return Number(item?.variationId || item?.productId);
}

function getCheckoutQuantity(item) {
  return Math.max(
    1,
    Number.parseInt(String(item?.checkoutQuantity || item?.cartQuantity || 1), 10) ||
      1,
  );
}

function getLineId(item, index) {
  const raw = String(item?.id || `checkout-line-${index}`);
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
      const checkoutItem = {
        lineId: getLineId(item, index),
        id: getCheckoutProductId(item),
        quantity: getCheckoutQuantity(item),
        productId: Number(item?.productId || 0),
        variationId: Number(item?.variationId || 0) || null,
        name: String(item?.name || ""),
        artworkName: String(item?.artworkName || ""),
        artworkOptions: item?.artworkOptions || {},
        artworkToken: "",
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
