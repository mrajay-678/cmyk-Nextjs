import { NextRequest, NextResponse } from "next/server";

const DEFAULT_WOO_HOST = "https://wp.cmykprint.shop";
const WOO_SESSION_COOKIE_PREFIX = "wp_woocommerce_session_";
const CART_TOKEN_COOKIE = "cmyk_cart_token";
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

function logBySizeStep(step: number, message: string, data: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info(`[CMYK DTF Cart Debug ${step}] ${message}`, data);
}

function getWooAdminAjaxUrl(request: NextRequest) {
  const storeUrl = process.env.NEXT_PUBLIC_WC_URL || DEFAULT_WOO_HOST;
  const url = new URL("/wp-admin/admin-ajax.php", storeUrl);
  url.search = request.nextUrl.search;
  return url;
}

function getWooUrl(path: string) {
  const storeUrl = process.env.NEXT_PUBLIC_WC_URL || DEFAULT_WOO_HOST;
  return new URL(path, storeUrl);
}

function getWooRestApiUrl(path: string) {
  const url = getWooUrl(`/wp-json/wc/v3${path}`);

  if (WC_CONSUMER_KEY) {
    url.searchParams.set("consumer_key", WC_CONSUMER_KEY);
  }

  if (WC_CONSUMER_SECRET) {
    url.searchParams.set("consumer_secret", WC_CONSUMER_SECRET);
  }

  return url;
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
  return setCookie ? splitSetCookieHeader(setCookie) : [];
}

function splitSetCookieHeader(header: string) {
  // Some runtimes expose multiple Set-Cookie values as one comma-joined string.
  // Do not split the comma inside an Expires date; split only before a cookie name.
  return header
    .split(/,(?=\s*[\w!#$%&'*+.^`|~-]+=)/)
    .map((cookie) => cookie.trim())
    .filter(Boolean);
}

function hasWooSessionCookie(cookies: string[]) {
  return cookies.some((cookie) =>
    cookie.toLowerCase().startsWith(WOO_SESSION_COOKIE_PREFIX),
  );
}

function rewriteSetCookieForCurrentOrigin(cookie: string, request: NextRequest) {
  let rewritten = cookie.replace(/;\s*Domain=[^;]*/gi, "");

  if (request.nextUrl.protocol !== "https:") {
    rewritten = rewritten
      .replace(/;\s*Secure/gi, "")
      .replace(/;\s*SameSite=None/gi, "; SameSite=Lax");
  }

  return rewritten;
}

function getCookieName(setCookie: string) {
  return setCookie.split("=", 1)[0] || "";
}

function buildWooCookieHeader(request: NextRequest, setCookieHeaders: string[] = []) {
  const cookiePairs = new Map<string, string>();

  request.headers
    .get("cookie")
    ?.split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const separatorIndex = entry.indexOf("=");
      const name = separatorIndex >= 0 ? entry.slice(0, separatorIndex) : entry;

      if (name && name !== CART_TOKEN_COOKIE) {
        cookiePairs.set(name, entry);
      }
    });

  setCookieHeaders.forEach((cookie) => {
    const pair = cookie.split(";", 1)[0]?.trim();
    const separatorIndex = pair.indexOf("=");
    const name = separatorIndex >= 0 ? pair.slice(0, separatorIndex) : "";

    if (name) {
      cookiePairs.set(name, pair);
    }
  });

  return Array.from(cookiePairs.values()).join("; ");
}

function buildLocalCookie(name: string, value: string, maxAge: number) {
  const encodedValue = encodeURIComponent(value);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${name}=${encodedValue}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}

function getValuePreview(value: FormDataEntryValue | null) {
  if (typeof value === "string") {
    return value.slice(0, 180);
  }

  if (value instanceof File) {
    return `file:${value.name || "unnamed"}:${value.size}`;
  }

  return "none";
}

async function getMultipartDebugData(contentType: string, body: ArrayBuffer) {
  try {
    const formRequest = new Request("http://cmyk.local/admin-ajax", {
      method: "POST",
      headers: { "content-type": contentType },
      body,
    });
    const formData = await formRequest.formData();

    return {
      bodyType: "FormData",
      bodyAction: getValuePreview(formData.get("action")),
      bodyProductId: getValuePreview(
        formData.get("product_id") || formData.get("add-to-cart"),
      ),
      bodyVariationId: getValuePreview(formData.get("variation_id")),
      bodyKeys: Array.from(formData.keys()),
    };
  } catch (error) {
    return {
      bodyType: "FormData",
      bodyParseError:
        error instanceof Error ? error.message : "Unable to parse form data.",
    };
  }
}

async function getBodyFields(request: NextRequest, body?: ArrayBuffer) {
  if (!body) {
    return new Map<string, string>();
  }

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(new TextDecoder().decode(body));
    return new Map(Array.from(params.entries()));
  }

  if (contentType.includes("multipart/form-data")) {
    const formRequest = new Request("http://cmyk.local/admin-ajax", {
      method: "POST",
      headers: { "content-type": contentType },
      body,
    });
    const formData = await formRequest.formData();

    return new Map(
      Array.from(formData.entries()).map(([key, value]) => [
        key,
        getValuePreview(value),
      ]),
    );
  }

  if (contentType.includes("application/json")) {
    const parsed = JSON.parse(new TextDecoder().decode(body));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return new Map();
    }

    return new Map(
      Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [
        key,
        String(value || ""),
      ]),
    );
  }

  return new Map<string, string>();
}

function getJsonDebugData(body: ArrayBuffer) {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(body));

    if (!parsed || typeof parsed !== "object") {
      return { bodyType: "json" };
    }

    const record = parsed as Record<string, unknown>;

    return {
      bodyType: "json",
      bodyAction: String(record.action || "none"),
      bodyProductId: String(record.product_id || record["add-to-cart"] || "none"),
      bodyVariationId: String(record.variation_id || "none"),
      bodyKeys: Object.keys(record),
    };
  } catch (error) {
    return {
      bodyType: "json",
      bodyParseError:
        error instanceof Error ? error.message : "Unable to parse JSON body.",
    };
  }
}

async function getRequestDebugData(request: NextRequest, body?: ArrayBuffer) {
  const searchKeys = Array.from(request.nextUrl.searchParams.keys());
  const debugData: Record<string, unknown> = {
    method: request.method,
    queryAction: request.nextUrl.searchParams.get("action") || "none",
    queryKeys: searchKeys,
    hasIncomingCookie: Boolean(request.headers.get("cookie")),
    requestContentType: request.headers.get("content-type") || "none",
    requestBodyBytes: body?.byteLength || 0,
  };

  const contentType = request.headers.get("content-type") || "";
  if (!body) {
    return debugData;
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(new TextDecoder().decode(body));
    debugData.bodyAction = params.get("action") || "none";
    debugData.bodyProductId =
      params.get("product_id") || params.get("add-to-cart") || "none";
    debugData.bodyVariationId = params.get("variation_id") || "none";
    debugData.bodyKeys = Array.from(params.keys());
    return debugData;
  }

  if (contentType.includes("multipart/form-data")) {
    return {
      ...debugData,
      ...(await getMultipartDebugData(contentType, body)),
    };
  }

  if (contentType.includes("application/json")) {
    return {
      ...debugData,
      ...getJsonDebugData(body),
    };
  }

  return debugData;
}

function getResponsePreview(body: ArrayBuffer, contentType: string) {
  if (
    !contentType.includes("application/json") &&
    !contentType.includes("text/") &&
    !contentType.includes("html")
  ) {
    return "non-text response";
  }

  return new TextDecoder().decode(body).slice(0, 240);
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

async function fetchStoreCartWithCookies(request: NextRequest, setCookieHeaders: string[]) {
  const headers = new Headers();
  const cookieHeader = buildWooCookieHeader(request, setCookieHeaders);

  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  const response = await fetch(getWooUrl("/wp-json/wc/store/v1/cart"), {
    headers,
    cache: "no-store",
  });
  const body = await response.arrayBuffer();
  const parsed = parseJsonBody(body) as { items_count?: number; items?: unknown[] } | null;

  return {
    status: response.status,
    cartToken: response.headers.get("cart-token") || "",
    itemsCount: Number(parsed?.items_count || 0),
    items: Array.isArray(parsed?.items) ? parsed.items : [],
  };
}

async function getVariationInput(productId: number, variationId: number) {
  if (!productId || !variationId || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    return [];
  }

  const response = await fetch(
    getWooRestApiUrl(`/products/${productId}/variations/${variationId}`),
    { cache: "no-store" },
  );

  if (!response.ok) {
    return [];
  }

  const variation = await response.json();
  const attributes = Array.isArray(variation?.attributes)
    ? variation.attributes
    : [];

  return attributes
    .map((attribute: { slug?: string; name?: string; option?: string }) => {
      const slug = attribute.slug || attribute.name || "";
      const normalizedSlug = slug
        .toLowerCase()
        .replace(/^attribute_/, "")
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      return {
        attribute: normalizedSlug.startsWith("pa_")
          ? normalizedSlug
          : `attribute_${normalizedSlug}`,
        value: attribute.option || "",
      };
    })
    .filter((attribute: { attribute: string; value: string }) =>
      Boolean(attribute.attribute && attribute.value),
    );
}

async function addBagsItemThroughStoreApi({
  request,
  setCookieHeaders,
  fields,
}: {
  request: NextRequest;
  setCookieHeaders: string[];
  fields: Map<string, string>;
}) {
  const action = fields.get("action") || request.nextUrl.searchParams.get("action") || "";

  if (action !== "gang_sheet_add_to_cart") {
    return null;
  }

  const productId = Number(fields.get("product_id") || 0);
  const variationId = Number(fields.get("variation_id") || 0);
  const quantity = Math.max(1, Number(fields.get("quantity") || 1) || 1);

  if (!productId) {
    return null;
  }

  const headers = new Headers({
    "Content-Type": "application/json",
  });
  const cookieHeader = buildWooCookieHeader(request, setCookieHeaders);

  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  const variation = await getVariationInput(productId, variationId);
  const response = await fetch(getWooUrl("/wp-json/wc/store/v1/cart/add-item"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: productId,
      quantity,
      ...(variation.length ? { variation } : {}),
      extensions: {
        "cmyk-gang-sheet": {
          product_type: fields.get("product_type") || "",
          uploaded_file: fields.get("uploaded_file") || "",
          print_ready: fields.get("print_ready") || "",
        },
      },
    }),
    cache: "no-store",
    redirect: "manual",
  });
  const body = await response.arrayBuffer();
  const parsed = parseJsonBody(body) as { items_count?: number; items?: unknown[] } | null;

  return {
    status: response.status,
    ok: response.ok,
    cartToken: response.headers.get("cart-token") || "",
    itemsCount: Number(parsed?.items_count || 0),
    responsePreview: getResponsePreview(
      body,
      response.headers.get("content-type") || "",
    ),
  };
}

async function proxyAdminAjax(request: NextRequest) {
  const requestBody =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();
  const requestFields = await getBodyFields(request, requestBody);

  logBySizeStep(2, "admin-ajax proxy forwarding BAGS request", {
    ...(await getRequestDebugData(request, requestBody)),
    targetUrl: getWooAdminAjaxUrl(request).toString(),
  });

  const wooResponse = await fetch(getWooAdminAjaxUrl(request), {
    method: request.method,
    headers: copyAjaxRequestHeaders(request),
    body: requestBody,
    cache: "no-store",
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  const contentType = wooResponse.headers.get("content-type");
  const setCookieHeaders = getSetCookieHeaders(wooResponse.headers);
  const responseBody = await wooResponse.arrayBuffer();
  const parsedResponse = parseJsonBody(responseBody) as { success?: boolean } | null;
  let cartTokenForNextCart = "";

  logBySizeStep(2, "admin-ajax response after BAGS add", {
    status: wooResponse.status,
    contentType: contentType || "none",
    setCookieCount: setCookieHeaders.length,
    setCookieNames: setCookieHeaders.map(getCookieName),
    hasWooSessionCookie: hasWooSessionCookie(setCookieHeaders),
    responsePreview: getResponsePreview(responseBody, contentType || ""),
  });

  if (parsedResponse?.success) {
    const verifiedCart = await fetchStoreCartWithCookies(request, setCookieHeaders);

    logBySizeStep(2, "cart immediately after BAGS response", {
      status: verifiedCart.status,
      itemsCount: verifiedCart.itemsCount,
      hasCartToken: Boolean(verifiedCart.cartToken),
    });

    cartTokenForNextCart = verifiedCart.cartToken;

    if (verifiedCart.itemsCount === 0) {
      const fallbackCart = await addBagsItemThroughStoreApi({
        request,
        setCookieHeaders,
        fields: requestFields,
      });

      if (fallbackCart) {
        cartTokenForNextCart = fallbackCart.cartToken;
        logBySizeStep(2, "Store API fallback add after empty BAGS cart", {
          status: fallbackCart.status,
          ok: fallbackCart.ok,
          itemsCount: fallbackCart.itemsCount,
          hasCartToken: Boolean(fallbackCart.cartToken),
          responsePreview: fallbackCart.responsePreview,
        });
      }
    }
  }

  if (contentType) {
    responseHeaders.set("Content-Type", contentType);
  }

  const response = new NextResponse(responseBody, {
    status: wooResponse.status,
    headers: responseHeaders,
  });

  for (const cookie of setCookieHeaders) {
    response.headers.append(
      "Set-Cookie",
      rewriteSetCookieForCurrentOrigin(cookie, request),
    );
  }

  const shouldUseFallbackCartToken = Boolean(cartTokenForNextCart) && setCookieHeaders.length === 0;

  if (shouldUseFallbackCartToken) {
    response.headers.set("Cart-Token", cartTokenForNextCart);
    response.headers.append(
      "Set-Cookie",
      buildLocalCookie(CART_TOKEN_COOKIE, cartTokenForNextCart, 60 * 60 * 24 * 14),
    );
  } else {
    response.headers.append(
      "Set-Cookie",
      buildLocalCookie(CART_TOKEN_COOKIE, "", 0),
    );
  }

  return response;
}

export const GET = proxyAdminAjax;
export const POST = proxyAdminAjax;
