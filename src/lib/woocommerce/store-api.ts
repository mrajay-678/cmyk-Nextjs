export const STORE_API_BASE = "/api/store";
export const CART_TOKEN_STORAGE_KEY = "cmyk_cart_token";

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

function getStoredCartToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(CART_TOKEN_STORAGE_KEY) || "";
}

function persistCartToken(response: Response) {
  if (typeof window === "undefined") {
    return;
  }

  const token = response.headers.get("Cart-Token");
  if (token) {
    window.localStorage.setItem(CART_TOKEN_STORAGE_KEY, token);
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

  persistCartToken(response);

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as StoreApiError | null;
    throw new WooStoreApiError(
      error?.message || `WooCommerce Store API request failed with status ${response.status}.`,
      response.status,
      error?.code,
      error?.data,
    );
  }

  return response.json() as Promise<T>;
}

export function clearStoredCartToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CART_TOKEN_STORAGE_KEY);
  }
}
