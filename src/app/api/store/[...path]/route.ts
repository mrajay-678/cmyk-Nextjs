import { NextRequest, NextResponse } from "next/server";

const CART_TOKEN_COOKIE = "cmyk_cart_token";
const STORE_API_PREFIX = "/wp-json/wc/store/v1";
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

function getStoreUrl() {
  const storeUrl = process.env.NEXT_PUBLIC_WC_URL;
  if (!storeUrl) {
    throw new Error("NEXT_PUBLIC_WC_URL is not configured.");
  }
  return new URL(storeUrl);
}

function copyRequestHeaders(request: NextRequest) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const requestCartToken = request.headers.get("cart-token");
  const nonce = request.headers.get("nonce");
  const cookie = request.headers.get("cookie");
  const cookieCartToken = request.cookies.get(CART_TOKEN_COOKIE)?.value;
  const hasWooCartCookie = Boolean(
    cookie?.includes("wp_woocommerce_session_") ||
      cookie?.includes("woocommerce_items_in_cart") ||
      cookie?.includes("woocommerce_cart_hash"),
  );

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (cookie) {
    headers.set("Cookie", cookie);
  }

  const cartToken = hasWooCartCookie ? "" : requestCartToken || cookieCartToken;
  if (cartToken) {
    headers.set("Cart-Token", cartToken);
  }
  if (nonce) {
    headers.set("Nonce", nonce);
  }

  return headers;
}

function toStoreApiUrl(path: string[], search: string) {
  const base = getStoreUrl();
  const cleanPath = path
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const url = new URL(`${STORE_API_PREFIX}/${cleanPath}`, base);
  url.search = search;
  return url;
}

function parseJsonBody(body: ArrayBuffer) {
  const text = new TextDecoder().decode(body);

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function applyCartTokenCookie(response: NextResponse, cartToken: string | null) {
  if (!cartToken) {
    return;
  }

  response.cookies.set(CART_TOKEN_COOKIE, cartToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

async function proxyStoreApi(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!ALLOWED_METHODS.has(request.method)) {
    return NextResponse.json(
      { message: "Method not allowed." },
      { status: 405 },
    );
  }

  try {
    const { path } = await context.params;
    const url = toStoreApiUrl(path || [], request.nextUrl.search);
    const body =
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer();

    const wooResponse = await fetch(url, {
      method: request.method,
      headers: copyRequestHeaders(request),
      body,
      cache: "no-store",
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    const contentType = wooResponse.headers.get("content-type");
    const cartToken = wooResponse.headers.get("cart-token");
    const nonce = wooResponse.headers.get("nonce");
    const location = wooResponse.headers.get("location");
    const responseBody = await wooResponse.arrayBuffer();

    if (contentType) {
      responseHeaders.set("Content-Type", contentType);
    }
    if (cartToken) {
      responseHeaders.set("Cart-Token", cartToken);
    }
    if (nonce) {
      responseHeaders.set("Nonce", nonce);
    }

    if (wooResponse.status >= 300 && wooResponse.status < 400) {
      return NextResponse.json(
        {
          code: "woocommerce_proxy_redirect",
          message: "WooCommerce Store API returned a redirect.",
          status: wooResponse.status,
          location,
          woocommerceUrl: url.toString(),
        },
        { status: 502 },
      );
    }

    if (wooResponse.status === 204 || responseBody.byteLength === 0) {
      const response = new NextResponse(null, {
        status: wooResponse.status,
        headers: responseHeaders,
      });
      applyCartTokenCookie(response, cartToken);
      return response;
    }

    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        {
          code: "woocommerce_proxy_non_json_response",
          message: "WooCommerce Store API returned a non-JSON response.",
          status: wooResponse.status,
          woocommerceUrl: url.toString(),
        },
        { status: wooResponse.ok ? 502 : wooResponse.status },
      );
    }

    const parsedBody = parseJsonBody(responseBody);

    if (parsedBody === null) {
      return NextResponse.json(
        {
          code: "woocommerce_proxy_invalid_json_response",
          message: "WooCommerce Store API returned invalid JSON.",
          status: wooResponse.status,
          woocommerceUrl: url.toString(),
        },
        { status: wooResponse.ok ? 502 : wooResponse.status },
      );
    }

    const response = NextResponse.json(parsedBody, {
      status: wooResponse.status,
      headers: responseHeaders,
    });

    applyCartTokenCookie(response, cartToken);

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        code: "cmyk_store_api_proxy_error",
        message:
          error instanceof Error
            ? error.message
            : "WooCommerce Store API request failed.",
      },
      { status: 500 },
    );
  }
}

export const GET = proxyStoreApi;
export const POST = proxyStoreApi;
export const PUT = proxyStoreApi;
export const PATCH = proxyStoreApi;
export const DELETE = proxyStoreApi;
