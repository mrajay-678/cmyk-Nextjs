import { storeApiFetch } from "./store-api";
import type { WooCart, WooVariationInput } from "./types";

export type AddCartItemInput = {
  id: number;
  quantity?: number;
  variation?: WooVariationInput;
  extensions?: Record<string, unknown>;
};

type LocalCartItemInput = {
  id?: number | string;
  productId?: number | string;
  variationId?: number | string | null;
  checkoutQuantity?: number | string;
  cartQuantity?: number | string;
  variationAttributes?: Array<{
    slug?: string;
    name?: string;
    option?: string;
    value?: string;
  }>;
};

const inFlightAdds = new Map<string, Promise<WooCart>>();

function debugCartMutation(message: string, data: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info(`[cart] ${message}`, data);
}

function stableAddKey(input: AddCartItemInput) {
  return JSON.stringify({
    id: input.id,
    quantity: input.quantity || 1,
    variation: input.variation || [],
    extensions: input.extensions || {},
  });
}

export function getCurrentCart() {
  return storeApiFetch<WooCart>("/cart", { method: "GET" });
}

export function buildAddCartItemInput(item: LocalCartItemInput): AddCartItemInput {
  const variation = (item.variationAttributes || [])
    .map((attribute) => ({
      attribute: attribute.slug || attribute.name || "",
      value: attribute.option || attribute.value || "",
    }))
    .filter((attribute) => attribute.attribute && attribute.value);

  return {
    id: Number(item.variationId || item.productId || item.id),
    quantity: Number(item.checkoutQuantity || item.cartQuantity || 1),
    ...(variation.length ? { variation } : {}),
  };
}

export function addCartItem(input: AddCartItemInput) {
  const key = stableAddKey(input);
  const existingRequest = inFlightAdds.get(key);

  if (existingRequest) {
    debugCartMutation("add:deduped", { productId: input.id });
    return existingRequest;
  }

  debugCartMutation("add:start", { productId: input.id });
  const request = storeApiFetch<WooCart>("/cart/add-item", {
    method: "POST",
    json: input,
  });

  inFlightAdds.set(key, request);
  request.finally(() => {
    inFlightAdds.delete(key);
    debugCartMutation("add:end", { productId: input.id });
  });

  return request;
}

export function updateCartItemQuantity(key: string, quantity: number) {
  return storeApiFetch<WooCart>(`/cart/items/${encodeURIComponent(key)}`, {
    method: "POST",
    json: { quantity },
  });
}

export function removeCartItem(key: string) {
  debugCartMutation("remove:start", { key });
  return storeApiFetch<WooCart>(`/cart/items/${encodeURIComponent(key)}`, {
    method: "DELETE",
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
