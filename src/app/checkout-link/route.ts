import { NextRequest, NextResponse } from "next/server";

const DEFAULT_WOO_HOST = "https://wp.cmykprint.shop";

function getWooCheckoutLinkUrl(request: NextRequest) {
  const storeUrl = process.env.NEXT_PUBLIC_WC_URL || DEFAULT_WOO_HOST;
  const url = new URL("/checkout/", storeUrl);
  const checkoutRef = request.nextUrl.searchParams.get("cmyk_checkout_ref");

  if (checkoutRef) {
    url.searchParams.set("cmyk_checkout_ref", checkoutRef);
  }

  return url;
}

export async function GET(request: NextRequest) {
  const wooUrl = getWooCheckoutLinkUrl(request);

  if (!wooUrl.searchParams.get("cmyk_checkout_ref")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // The handoff must run in the browser on the WooCommerce domain so Woo can
  // set its cart session cookie before sending the user to /checkout/.
  return NextResponse.redirect(wooUrl);
}
