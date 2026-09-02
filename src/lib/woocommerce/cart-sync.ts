import { removeCartItem } from "./cart";
import type { WooCart, WooCartItem } from "./types";

export type SyncLocalCartItem = {
  id: string;
  productId?: number;
  variationId?: number | null;
  cartQuantity?: number;
  wooCartKey?: string;
  artworkName?: string;
  designId?: string;
};

const PENDING_WOO_CART_INTENT_STORAGE_KEY = "cmyk_pending_woo_cart_intent";
const ACTIVE_WOO_CART_KEYS_STORAGE_KEY = "cmyk_active_woo_cart_keys";
const PENDING_WOO_CART_INTENT_TTL_MS = 30 * 60 * 1000;

function readActiveWooCartKeys() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(ACTIVE_WOO_CART_KEYS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    window.localStorage.removeItem(ACTIVE_WOO_CART_KEYS_STORAGE_KEY);
    return [];
  }
}

function writeActiveWooCartKeys(keys: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)));
  if (!uniqueKeys.length) {
    window.localStorage.removeItem(ACTIVE_WOO_CART_KEYS_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(
    ACTIVE_WOO_CART_KEYS_STORAGE_KEY,
    JSON.stringify(uniqueKeys),
  );
}

function readPendingWooCartIntent() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(PENDING_WOO_CART_INTENT_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    if (
      !parsed?.updatedAt ||
      Date.now() - Number(parsed.updatedAt) > PENDING_WOO_CART_INTENT_TTL_MS
    ) {
      window.localStorage.removeItem(PENDING_WOO_CART_INTENT_STORAGE_KEY);
      return null;
    }
    return {
      existingKeys: Array.isArray(parsed.existingKeys)
        ? parsed.existingKeys.filter(Boolean)
        : [],
    };
  } catch {
    window.localStorage.removeItem(PENDING_WOO_CART_INTENT_STORAGE_KEY);
    return null;
  }
}

export function markWooCartIntentPending(cart?: WooCart | null) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    PENDING_WOO_CART_INTENT_STORAGE_KEY,
    JSON.stringify({
      updatedAt: Date.now(),
      existingKeys: (cart?.items || []).map((item) => item.key),
    }),
  );
}

export function rememberWooCartItems(items: WooCartItem[]) {
  writeActiveWooCartKeys([
    ...readActiveWooCartKeys(),
    ...items.map((item) => item.key),
  ]);
}

export function forgetWooCartItems(keys: string[]) {
  writeActiveWooCartKeys(
    readActiveWooCartKeys().filter((key) => !keys.includes(key)),
  );
}

export function hasPendingWooCartIntent() {
  return Boolean(readPendingWooCartIntent());
}

export function acceptPendingWooCartIntent(cart: WooCart) {
  const pendingIntent = readPendingWooCartIntent();
  if (!pendingIntent) {
    return false;
  }

  const existingKeys = new Set(pendingIntent.existingKeys);
  const gangSheetItems = cart.items.filter(
    (item) => isGangSheetWooItem(item) && !existingKeys.has(item.key),
  );
  if (!gangSheetItems.length) {
    return false;
  }

  rememberWooCartItems(gangSheetItems);
  window.localStorage.removeItem(PENDING_WOO_CART_INTENT_STORAGE_KEY);
  return true;
}

export function getIntentionalWooItems(cart: WooCart | null) {
  if (!cart) {
    return [];
  }

  const activeKeys = new Set(readActiveWooCartKeys());
  return cart.items.filter((item) => activeKeys.has(item.key));
}

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

  if (localItem.artworkName || localItem.designId) {
    return null;
  }

  const candidates = wooItems.filter((item) => item.id === checkoutId);
  return candidates.length === 1 ? candidates[0] : null;
}

export function findNewWooCartItem(
  wooItems: WooCartItem[],
  localItem: SyncLocalCartItem,
  previousLocalItems: SyncLocalCartItem[] = [],
) {
  const checkoutId = getLocalCheckoutId(localItem);
  if (!checkoutId) {
    return null;
  }

  const previousKeys = new Set(
    previousLocalItems.map((item) => item.wooCartKey).filter(Boolean),
  );
  const candidates = wooItems.filter(
    (item) => item.id === checkoutId && !previousKeys.has(item.key),
  );

  return candidates[candidates.length - 1] || null;
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
  const validWooKeys = new Set(
    localItems.map((item) => item.wooCartKey).filter(Boolean),
  );
  getIntentionalWooItems(cart).forEach((item) => validWooKeys.add(item.key));
  let nextCart = cart;

  for (const item of cart.items) {
    if (!validWooKeys.has(item.key)) {
      nextCart = await removeCartItem(item.key);
    }
  }

  return nextCart;
}
