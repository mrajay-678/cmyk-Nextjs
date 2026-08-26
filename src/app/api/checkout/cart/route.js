import { NextResponse } from "next/server";

const storeUrl = process.env.NEXT_PUBLIC_WC_URL;

function parseItems(requestBody) {
  if (Array.isArray(requestBody?.items)) {
    return requestBody.items;
  }

  return [];
}

function getCheckoutProductId(item) {
  return Number(item?.variationId || item?.productId);
}

function getCheckoutQuantity(item) {
  return Math.max(1, Number.parseInt(String(item?.cartQuantity || 1), 10) || 1);
}

export async function POST(request) {
  try {
    if (!storeUrl) {
      return NextResponse.json(
        { error: "WooCommerce store URL is not configured" },
        { status: 500 },
      );
    }

    const requestBody = await request.json();
    const items = parseItems(requestBody);

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty items array" },
        { status: 400 },
      );
    }

    const base = new URL(storeUrl);
    const checkoutItems = items
      .map((item) => ({
        id: getCheckoutProductId(item),
        quantity: getCheckoutQuantity(item),
      }))
      .filter((item) => Number.isFinite(item.id) && item.id > 0);

    if (!checkoutItems.length) {
      return NextResponse.json(
        { error: "No checkout-ready WooCommerce products were found" },
        { status: 400 },
      );
    }

    const checkoutUrl = new URL("/checkout-link/", base);
    checkoutUrl.searchParams.set(
      "products",
      checkoutItems.map((item) => `${item.id}:${item.quantity}`).join(","),
    );

    return NextResponse.json({ checkoutUrl: checkoutUrl.toString() });
  } catch (error) {
    console.error("Error in checkout cart API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
