import { NextRequest, NextResponse } from "next/server";

const WC_URL = process.env.NEXT_PUBLIC_WC_URL;
const CART_TOKEN_COOKIE = "cmyk_cart_token";

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

    let cart;

    try {
      cart = JSON.parse(responseText);
    } catch {
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
    console.error("[gang-sheet/add-to-cart]", error);

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
