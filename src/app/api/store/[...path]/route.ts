import { NextRequest, NextResponse } from "next/server";

const CART_TOKEN_COOKIE = "cmyk_cart_token";
const STORE_API_PREFIX = "/wp-json/wc/store/v1";
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const WOO_SESSION_COOKIE_PREFIX = "wp_woocommerce_session_";
const WOO_CART_COOKIE_NAMES = new Set([
  "woocommerce_cart_hash",
  "woocommerce_items_in_cart",
]);

function logBySizeStep(step: number, message: string, data: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info(`[CMYK DTF By Size Step ${step}] ${message}`, data);
}

function getStoreUrl() {
  const storeUrl = process.env.NEXT_PUBLIC_WC_URL;
  if (!storeUrl) {
    throw new Error("NEXT_PUBLIC_WC_URL is not configured.");
  }
  return new URL(storeUrl);
}

function copyRequestHeaders(
  request: NextRequest,
  options: { includeCartToken?: boolean } = {},
) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const requestCartToken = request.headers.get("cart-token");
  const nonce = request.headers.get("nonce");
  const cookieCartToken = request.cookies.get(CART_TOKEN_COOKIE)?.value;
  const includeCartToken = options.includeCartToken !== false;

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  headers.set("Cache-Control", "no-cache");
  headers.set("Pragma", "no-cache");

  const cartToken = includeCartToken ? requestCartToken || cookieCartToken : "";

  if (cartToken) {
    headers.set("Cart-Token", cartToken);
  } else {
    const wooSessionCookie = getWooSessionCookieHeader(request);
    if (wooSessionCookie) {
      headers.set("Cookie", wooSessionCookie);
    }
  }
  if (nonce) {
    headers.set("Nonce", nonce);
  }

  return headers;
}

function getWooSessionCookieHeader(request: NextRequest) {
  return request.cookies
    .getAll()
    .filter(
      (cookie) =>
        cookie.name.startsWith(WOO_SESSION_COOKIE_PREFIX) ||
        WOO_CART_COOKIE_NAMES.has(cookie.name),
    )
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

function toStoreApiUrl(path: string[], search: string) {
  const base = getStoreUrl();
  const cleanPath = path
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const url = new URL(`${STORE_API_PREFIX}/${cleanPath}`, base);
  url.search = search;
  if (path[0] === "cart") {
    url.searchParams.set("_cmyk_cart_ts", String(Date.now()));
  }
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

function isJsonLikeBody(body: ArrayBuffer) {
  return parseJsonBody(body) !== null;
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

function clearCartTokenCookie(response: NextResponse) {
  response.cookies.delete(CART_TOKEN_COOKIE);
  response.headers.set("X-CMYK-Clear-Cart-Token", "1");
}

async function fetchWooStoreApi({
  request,
  url,
  body,
  includeCartToken = true,
}: {
  request: NextRequest;
  url: URL;
  body?: ArrayBuffer;
  includeCartToken?: boolean;
}) {
  const wooResponse = await fetch(url, {
    method: request.method,
    headers: copyRequestHeaders(request, { includeCartToken }),
    body,
    cache: "no-store",
    redirect: "manual",
  });
  const responseBody = await wooResponse.arrayBuffer();

  return { wooResponse, responseBody };
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
    const isCartRead = request.method === "GET" && path?.[0] === "cart";
    const incomingCartToken =
      request.headers.get("cart-token") ||
      request.cookies.get(CART_TOKEN_COOKIE)?.value ||
      "";
    const wooSessionCookie = getWooSessionCookieHeader(request);

    if (isCartRead) {
      logBySizeStep(8, "Next cart page requested Woo cart", {
        hasCartToken: Boolean(incomingCartToken),
        hasWooSessionCookie: Boolean(wooSessionCookie),
        usingWooCookieFallback: !incomingCartToken && Boolean(wooSessionCookie),
      });
    }

    const body =
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer();

    let { wooResponse, responseBody } = await fetchWooStoreApi({
      request,
      url,
      body,
    });
    let shouldClearCartToken = false;

    if (
      request.method === "GET" &&
      path?.[0] === "cart" &&
      !wooResponse.headers.get("content-type")?.includes("application/json") &&
      !isJsonLikeBody(responseBody) &&
      (request.headers.get("cart-token") ||
        request.cookies.get(CART_TOKEN_COOKIE)?.value)
    ) {
      ({ wooResponse, responseBody } = await fetchWooStoreApi({
        request,
        url,
        body,
        includeCartToken: false,
      }));
      shouldClearCartToken = true;
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Cache-Control", "no-store, max-age=0");
    const contentType = wooResponse.headers.get("content-type") || "";
    const cartToken = wooResponse.headers.get("cart-token");
    const nonce = wooResponse.headers.get("nonce");
    const location = wooResponse.headers.get("location");
    if (contentType.includes("application/json")) {
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
      if (shouldClearCartToken) {
        clearCartTokenCookie(response);
      }
      return response;
    }

    if (!contentType?.includes("application/json") && !isJsonLikeBody(responseBody)) {
      const response = NextResponse.json(
        {
          code: "woocommerce_proxy_non_json_response",
          message: "WooCommerce Store API returned a non-JSON response.",
          status: wooResponse.status,
          woocommerceUrl: url.toString(),
        },
        { status: wooResponse.ok ? 502 : wooResponse.status },
      );
      if (shouldClearCartToken) {
        clearCartTokenCookie(response);
      }
      return response;
    }

    const parsedBody = parseJsonBody(responseBody);

    if (parsedBody === null) {
      const response = NextResponse.json(
        {
          code: "woocommerce_proxy_invalid_json_response",
          message: "WooCommerce Store API returned invalid JSON.",
          status: wooResponse.status,
          woocommerceUrl: url.toString(),
        },
        { status: wooResponse.ok ? 502 : wooResponse.status },
      );
      if (shouldClearCartToken) {
        clearCartTokenCookie(response);
      }
      return response;
    }

    if (isCartRead) {
      logBySizeStep(9, "Woo cart response parsed", {
        status: wooResponse.status,
        itemCount:
          parsedBody &&
          typeof parsedBody === "object" &&
          "items_count" in parsedBody
            ? (parsedBody as { items_count?: unknown }).items_count
            : "unknown",
      });
    }

    const response = NextResponse.json(parsedBody, {
      status: wooResponse.status,
      headers: responseHeaders,
    });

    applyCartTokenCookie(response, cartToken);
    if (shouldClearCartToken) {
      clearCartTokenCookie(response);
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
