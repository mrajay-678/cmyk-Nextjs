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
  const cookieCartToken = request.cookies.get(CART_TOKEN_COOKIE)?.value;

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const cartToken = requestCartToken || cookieCartToken;
  if (cartToken) {
    headers.set("Cart-Token", cartToken);
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

    if (contentType) {
      responseHeaders.set("Content-Type", contentType);
    }
    if (cartToken) {
      responseHeaders.set("Cart-Token", cartToken);
    }

    const response = new NextResponse(await wooResponse.arrayBuffer(), {
      status: wooResponse.status,
      headers: responseHeaders,
    });

    if (cartToken) {
      response.cookies.set(CART_TOKEN_COOKIE, cartToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 14,
      });
    }

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
