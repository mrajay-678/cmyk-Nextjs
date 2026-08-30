import { storeApiFetch } from "./store-api";

export type StoreProductQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  tag?: string;
  slug?: string;
  orderby?: string;
  order?: "asc" | "desc";
};

function toQueryString(query: StoreProductQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export function getStoreProducts(query?: StoreProductQuery) {
  const qs = toQueryString(query);
  return storeApiFetch<unknown[]>(`/products${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}

export function getStoreProduct(productId: number) {
  return storeApiFetch<unknown>(`/products/${productId}`, { method: "GET" });
}
