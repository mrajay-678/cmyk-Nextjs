import { storeApiFetch } from "./store-api";
import type { WooCart, WooVariationInput } from "./types";

export type AddCartItemInput = {
  id: number;
  quantity?: number;
  variation?: WooVariationInput;
  extensions?: Record<string, unknown>;
};

export function getCurrentCart() {
  return storeApiFetch<WooCart>("/cart", { method: "GET" });
}

export function addCartItem(input: AddCartItemInput) {
  return storeApiFetch<WooCart>("/cart/add-item", {
    method: "POST",
    json: input,
  });
}

export function updateCartItemQuantity(key: string, quantity: number) {
  return storeApiFetch<WooCart>("/cart/update-item", {
    method: "POST",
    json: { key, quantity },
  });
}

export function removeCartItem(key: string) {
  return storeApiFetch<WooCart>("/cart/remove-item", {
    method: "POST",
    json: { key },
  });
}

export function applyCoupon(code: string) {
  return storeApiFetch<WooCart>("/cart/apply-coupon", {
    method: "POST",
    json: { code },
  });
}

export function removeCoupon(code: string) {
  return storeApiFetch<WooCart>("/cart/remove-coupon", {
    method: "POST",
    json: { code },
  });
}

export function updateCartCustomer(input: {
  billing_address?: Record<string, string>;
  shipping_address?: Record<string, string>;
}) {
  return storeApiFetch<WooCart>("/cart/update-customer", {
    method: "POST",
    json: input,
  });
}
