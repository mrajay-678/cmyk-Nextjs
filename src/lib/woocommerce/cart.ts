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

function normalizeWooCart(cart: WooCart): WooCart {
  if (!cart || typeof cart !== "object") {
    throw new Error("WooCommerce cart response was invalid.");
  }

  if (!cart.totals || typeof cart.totals !== "object") {
    throw new Error("WooCommerce cart response was missing totals.");
  }

  const items = Array.isArray(cart.items) ? cart.items : [];
  const itemsCount = Number(cart.items_count);

  return {
    ...cart,
    items,
    items_count: Number.isFinite(itemsCount) ? itemsCount : items.length,
  };
}

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
  return storeApiFetch<WooCart>("/cart", { method: "GET" }).then(
    normalizeWooCart,
  );
}

export function buildAddCartItemInput(item: LocalCartItemInput): AddCartItemInput {
  const variation = (item.variationAttributes || [])
    .map((attribute) => ({
      attribute: attribute.slug || attribute.name || "",
      value: attribute.option || attribute.value || "",
    }))
    .filter((attribute) => attribute.attribute && attribute.value);
  const productId = Number(item.productId || item.id);
  const variationId = Number(item.variationId || 0);

  return {
    id:
      variation.length && Number.isFinite(productId)
        ? productId
        : variationId || productId,
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

  debugCartMutation("add:start", {
    productId: input.id,
    quantity: input.quantity,
    variation: input.variation,
  });
  const request = storeApiFetch<WooCart>("/cart/add-item", {
    method: "POST",
    json: input,
  }).then(normalizeWooCart);

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
  }).then(normalizeWooCart);
}

export function removeCartItem(key: string) {
  debugCartMutation("remove:start", { key });
  return storeApiFetch<WooCart>(`/cart/items/${encodeURIComponent(key)}`, {
    method: "DELETE",
  }).then(normalizeWooCart);
}

export function applyCoupon(code: string) {
  return storeApiFetch<WooCart>("/cart/apply-coupon", {
    method: "POST",
    json: { code },
  }).then(normalizeWooCart);
}

export function removeCoupon(code: string) {
  return storeApiFetch<WooCart>("/cart/remove-coupon", {
    method: "POST",
    json: { code },
  }).then(normalizeWooCart);
}

export function updateCartCustomer(input: {
  billing_address?: Record<string, string>;
  shipping_address?: Record<string, string>;
}) {
  return storeApiFetch<WooCart>("/cart/update-customer", {
    method: "POST",
    json: input,
  }).then(normalizeWooCart);
}
