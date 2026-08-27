import { NextResponse } from "next/server";

const storeUrl = process.env.NEXT_PUBLIC_WC_URL;
const wpMediaUsername = process.env.WP_MEDIA_USERNAME;
const wpMediaApplicationPassword = process.env.WP_MEDIA_APPLICATION_PASSWORD;
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

function hasMediaCredentials() {
  return Boolean(wpMediaUsername && wpMediaApplicationPassword);
}

function hasCustomArtworkUploader() {
  return Boolean(cmykArtworkUploadSecret);
}

function getSafeFileName(file) {
  const fallbackName = "artwork-upload";
  const rawName = String(file?.name || fallbackName);
  return rawName.replace(/[^a-zA-Z0-9._-]+/g, "-") || fallbackName;
}

async function uploadArtworkToWordPress(file) {
  if (hasCustomArtworkUploader()) {
    return uploadArtworkToCustomEndpoint(file);
  }

  if (!hasMediaCredentials()) {
    throw new Error(
      "Artwork upload is not configured. Set CMYK_ARTWORK_UPLOAD_SECRET on the Next.js server and WordPress plugin.",
    );
  }

  const base = new URL(storeUrl);
  const uploadUrl = new URL("/wp-json/wp/v2/media", base);
  const auth = Buffer.from(
    `${wpMediaUsername}:${wpMediaApplicationPassword}`,
  ).toString("base64");

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Disposition": `attachment; filename="${getSafeFileName(file)}"`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: Buffer.from(await file.arrayBuffer()),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(
      `WordPress artwork upload failed with status ${response.status}. ${message}`,
    );
  }

  const media = await response.json();
  return {
    id: media.id,
    url: media.source_url,
    name: file.name,
    type: file.type,
    size: file.size,
  };
}

async function uploadArtworkToCustomEndpoint(file) {
  const base = new URL(storeUrl);
  const uploadUrl = new URL("/wp-json/cmyk/v1/artwork", base);
  const formData = new FormData();

  formData.append("artwork", file, getSafeFileName(file));

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-CMYK-Artwork-Secret": cmykArtworkUploadSecret,
    },
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(
      `WordPress artwork upload failed with status ${response.status}. ${message}`,
    );
  }

  const upload = await response.json();
  return {
    id: upload.id || 0,
    url: upload.url,
    name: upload.name || file.name,
    type: upload.type || file.type,
    size: upload.size || file.size,
  };
}

export async function POST(request) {
  try {
    if (!storeUrl) {
      return NextResponse.json(
        { error: "WooCommerce store URL is not configured" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const items = parseItems(formData.get("items"));

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty items array" },
        { status: 400 },
      );
    }

    const checkoutItems = [];
    const artworkItems = [];

    for (const [index, item] of items.entries()) {
      const checkoutItem = {
        id: getCheckoutProductId(item),
        quantity: getCheckoutQuantity(item),
        productId: Number(item?.productId || 0),
        variationId: Number(item?.variationId || 0) || null,
        name: item?.name || "",
        artworkName: item?.artworkName || "",
        artworkOptions: item?.artworkOptions || null,
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
        const uploadedArtwork = await uploadArtworkToWordPress(artworkFile);
        artworkItems.push({
          product_id: checkoutItem.productId || checkoutItem.id,
          variation_id: checkoutItem.variationId,
          checkout_product_id: checkoutItem.id,
          quantity: checkoutItem.quantity,
          product_name: checkoutItem.name,
          artwork_name: checkoutItem.artworkName || uploadedArtwork.name,
          artwork_url: uploadedArtwork.url,
          artwork_options: checkoutItem.artworkOptions,
          media_id: uploadedArtwork.id,
        });
      }

      checkoutItems.push(checkoutItem);
    }

    if (!checkoutItems.length) {
      return NextResponse.json(
        { error: "No checkout-ready WooCommerce products were found" },
        { status: 400 },
      );
    }

    const base = new URL(storeUrl);
    const checkoutUrl = new URL("/checkout-link/", base);
    checkoutUrl.searchParams.set(
      "products",
      checkoutItems.map((item) => `${item.id}:${item.quantity}`).join(","),
    );

    if (artworkItems.length) {
      checkoutUrl.searchParams.set("cmyk_artwork", JSON.stringify(artworkItems));
    }

    return NextResponse.json({ checkoutUrl: checkoutUrl.toString() });
  } catch (error) {
    console.error("Error in checkout cart API:", error);

    if (
      error instanceof Error &&
      (error.message.startsWith("Artwork upload is not configured") ||
        error.message.startsWith("WordPress artwork upload failed"))
    ) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
