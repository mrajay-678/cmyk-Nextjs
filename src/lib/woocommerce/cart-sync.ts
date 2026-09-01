import { removeCartItem } from "./cart";
import type { WooCart, WooCartItem } from "./types";

export type SyncLocalCartItem = {
  id: string;
  productId?: number;
  variationId?: number | null;
  cartQuantity?: number;
  wooCartKey?: string;
};

export function getLocalCheckoutId(item: SyncLocalCartItem) {
  return Number(item.variationId || item.productId || 0);
}

export function mergeLocalCartItems(
  currentItems: SyncLocalCartItem[],
  nextItem: SyncLocalCartItem,
) {
  const existingItem = currentItems.find((item) => item.id === nextItem.id);

  if (!existingItem) {
    return [...currentItems, { ...nextItem, cartQuantity: 1 }];
  }

  return currentItems.map((item) =>
    item.id === nextItem.id
      ? { ...item, cartQuantity: (item.cartQuantity || 1) + 1 }
      : item,
  );
}

export function findMatchingWooCartItem(
  wooItems: WooCartItem[],
  localItem: SyncLocalCartItem,
) {
  if (localItem.wooCartKey) {
    const keyedItem = wooItems.find((item) => item.key === localItem.wooCartKey);
    if (keyedItem) {
      return keyedItem;
    }
  }

  const checkoutId = getLocalCheckoutId(localItem);
  if (!checkoutId) {
    return null;
  }

  return wooItems.find((item) => item.id === checkoutId) || null;
}

export function isGangSheetWooItem(item: WooCartItem) {
  if (item.id === 28426 || item.id === 28471) {
    return true;
  }

  return item.item_data.some((entry) =>
    `${entry.name} ${entry.value} ${entry.display || ""}`
      .toLowerCase()
      .includes("gang"),
  );
}

export async function reconcileWooCartToLocalItems(
  cart: WooCart,
  localItems: SyncLocalCartItem[],
) {
  const validCheckoutIds = new Set(
    localItems.map(getLocalCheckoutId).filter((id) => id > 0),
  );
  let nextCart = cart;

  for (const item of cart.items) {
    if (isGangSheetWooItem(item)) {
      continue;
    }

    if (!validCheckoutIds.has(item.id)) {
      nextCart = await removeCartItem(item.key);
    }
  }

  return nextCart;
}
