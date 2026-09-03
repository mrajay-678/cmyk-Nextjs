import { NextRequest, NextResponse } from "next/server";

const DEFAULT_WOO_HOST = "https://cmykprint.shop";

function getWooAdminAjaxUrl() {
  const storeUrl = process.env.NEXT_PUBLIC_WC_URL || DEFAULT_WOO_HOST;
  return new URL("/wp-admin/admin-ajax.php", storeUrl);
}

function copyAjaxRequestHeaders(request: NextRequest) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const cookie = request.headers.get("cookie");
  const userAgent = request.headers.get("user-agent");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (cookie) {
    headers.set("Cookie", cookie);
  }

  if (userAgent) {
    headers.set("User-Agent", userAgent);
  }

  headers.set("X-Requested-With", "XMLHttpRequest");

  return headers;
}

function getSetCookieHeaders(headers: Headers) {
  const withGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof withGetSetCookie.getSetCookie === "function") {
    return withGetSetCookie.getSetCookie();
  }

  const setCookie = headers.get("set-cookie");
  return setCookie ? [setCookie] : [];
}

function rewriteSetCookieForCurrentOrigin(cookie: string, request: NextRequest) {
  return cookie
    .replace(/;\s*Domain=[^;]*/gi, "")
    .replace(
      /;\s*Secure/gi,
      request.nextUrl.protocol === "https:" ? "; Secure" : "",
    );
}

async function proxyAdminAjax(request: NextRequest) {
  const wooResponse = await fetch(getWooAdminAjaxUrl(), {
    method: request.method,
    headers: copyAjaxRequestHeaders(request),
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    cache: "no-store",
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  const contentType = wooResponse.headers.get("content-type");

  if (contentType) {
    responseHeaders.set("Content-Type", contentType);
  }

  const response = new NextResponse(await wooResponse.arrayBuffer(), {
    status: wooResponse.status,
    headers: responseHeaders,
  });

  for (const cookie of getSetCookieHeaders(wooResponse.headers)) {
    response.headers.append(
      "Set-Cookie",
      rewriteSetCookieForCurrentOrigin(cookie, request),
    );
  }

  response.cookies.delete("cmyk_cart_token");

  return response;
}

export const GET = proxyAdminAjax;
export const POST = proxyAdminAjax;
