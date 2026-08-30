import { storeApiFetch } from "./store-api";
import type { WooCheckoutPayload, WooCheckoutResult, WooOrder } from "./types";

export function getCheckout() {
  return storeApiFetch<unknown>("/checkout", { method: "GET" });
}

export function createOrder(payload: WooCheckoutPayload) {
  return storeApiFetch<WooCheckoutResult>("/checkout", {
    method: "POST",
    json: payload,
  });
}

export function getOrder(orderId: string | number, orderKey?: string) {
  const query = orderKey ? `?key=${encodeURIComponent(orderKey)}` : "";
  return storeApiFetch<WooOrder>(`/order/${orderId}${query}`, { method: "GET" });
}
