export const STORE_API_BASE = "/api/store";
export const CART_TOKEN_STORAGE_KEY = "cmyk_cart_token";
export const CART_NONCE_STORAGE_KEY = "cmyk_cart_nonce";

export type StoreApiError = {
  code?: string;
  message: string;
  data?: {
    status?: number;
    params?: Record<string, string>;
  };
};

export class WooStoreApiError extends Error {
  status: number;
  code?: string;
  data?: StoreApiError["data"];

  constructor(message: string, status: number, code?: string, data?: StoreApiError["data"]) {
    super(message);
    this.name = "WooStoreApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

function parseResponseJson(text: string) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getStoredCartToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(CART_TOKEN_STORAGE_KEY) || "";
}

function getStoredCartNonce() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(CART_NONCE_STORAGE_KEY) || "";
}

function persistCartToken(response: Response) {
  if (typeof window === "undefined") {
    return;
  }

  const token = response.headers.get("Cart-Token");
  if (token) {
    window.localStorage.setItem(CART_TOKEN_STORAGE_KEY, token);
  }

  const nonce = response.headers.get("Nonce");
  if (nonce) {
    window.localStorage.setItem(CART_NONCE_STORAGE_KEY, nonce);
  }
}

function isMutatingRequest(method?: string) {
  const normalizedMethod = (method || "GET").toUpperCase();
  return normalizedMethod !== "GET" && normalizedMethod !== "HEAD";
}

async function ensureCartToken() {
  if (typeof window === "undefined") {
    return "";
  }

  const existingToken = getStoredCartToken();
  if (existingToken) {
    return existingToken;
  }

  const response = await fetch(`${STORE_API_BASE}/cart`, {
    credentials: "same-origin",
  });
  persistCartToken(response);

  return getStoredCartToken();
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export async function storeApiFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = isMutatingRequest(init.method)
    ? await ensureCartToken()
    : getStoredCartToken();

  if (token) {
    headers.set("Cart-Token", token);
  }

  const nonce = isMutatingRequest(init.method) ? getStoredCartNonce() : "";
  if (nonce) {
    headers.set("Nonce", nonce);
  }

  let body = init.body;
  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }

  const response = await fetch(`${STORE_API_BASE}${normalizePath(path)}`, {
    ...init,
    headers,
    body,
    credentials: "same-origin",
  });
  const responseText = await response.text();
  const location = response.headers.get("location");
  const contentType = response.headers.get("content-type") || "";

  if (process.env.NODE_ENV !== "production") {
    console.info("[cmyk-store-api-client]", {
      url: `${STORE_API_BASE}${normalizePath(path)}`,
      status: response.status,
      location,
      contentType,
      bodyStart: responseText.slice(0, 300),
    });
  }

  persistCartToken(response);
  const parsedBody = parseResponseJson(responseText) as StoreApiError | T | null;

  if (!response.ok) {
    const error = parsedBody as StoreApiError | null;

    throw new WooStoreApiError(
      error?.message || `WooCommerce Store API request failed with status ${response.status}.`,
      response.status,
      error?.code,
      error?.data,
    );
  }

  if (response.status === 204 || !responseText) {
    return null as T;
  }

  if (!contentType.includes("application/json") || parsedBody === null) {
    throw new WooStoreApiError(
      `WooCommerce Store API returned a non-JSON response with status ${response.status}.`,
      response.status,
      "woocommerce_non_json_response",
    );
  }

  return parsedBody as T;
}

export function clearStoredCartToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CART_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(CART_NONCE_STORAGE_KEY);
  }
}
