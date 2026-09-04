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

export function getWooCartItems(cart?: WooCart | null) {
  return Array.isArray(cart?.items) ? cart.items : [];
}

function getWooItemData(item: WooCartItem) {
  return Array.isArray(item.item_data) ? item.item_data : [];
}

function getWooItemVariation(item: WooCartItem) {
  return Array.isArray(item.variation) ? item.variation : [];
}

function getWooItems(items?: WooCartItem[] | null) {
  return Array.isArray(items) ? items : [];
}

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
      existingKeys: getWooCartItems(cart).map((item) => item.key),
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
  const gangSheetItems = getWooCartItems(cart).filter(
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
  return getWooCartItems(cart).filter((item) => activeKeys.has(item.key));
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
  wooItems: WooCartItem[] | null | undefined,
  localItem: SyncLocalCartItem,
) {
  const items = getWooItems(wooItems);

  if (localItem.wooCartKey) {
    const keyedItem = items.find((item) => item.key === localItem.wooCartKey);
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

  const candidates = items.filter((item) => item.id === checkoutId);
  return candidates.length === 1 ? candidates[0] : null;
}

export function findNewWooCartItem(
  wooItems: WooCartItem[] | null | undefined,
  localItem: SyncLocalCartItem,
  previousLocalItems: SyncLocalCartItem[] = [],
) {
  const items = getWooItems(wooItems);
  const checkoutId = getLocalCheckoutId(localItem);
  if (!checkoutId) {
    return null;
  }

  const previousKeys = new Set(
    previousLocalItems.map((item) => item.wooCartKey).filter(Boolean),
  );
  const candidates = items.filter(
    (item) => item.id === checkoutId && !previousKeys.has(item.key),
  );

  return candidates[candidates.length - 1] || null;
}

export function isGangSheetWooItem(item: WooCartItem) {
  if (item.id === 28426 || item.id === 28471) {
    return true;
  }

  return getWooItemData(item).some((entry) =>
    `${entry.name} ${entry.value} ${entry.display || ""}`
      .toLowerCase()
      .includes("gang"),
  );
}

function getGangSheetCartIdentity(item: WooCartItem) {
  const variationKey = getWooItemVariation(item)
    .map((entry) => `${entry.raw_attribute}:${entry.value}`)
    .join("|");

  return `${item.id}:${variationKey}`;
}

export async function removeDuplicateGangSheetItems(cart: WooCart) {
  const newestKeyByIdentity = new Map<string, string>();
  const items = getWooCartItems(cart);

  for (const item of items) {
    if (isGangSheetWooItem(item)) {
      newestKeyByIdentity.set(getGangSheetCartIdentity(item), item.key);
    }
  }

  const duplicateKeys = items
    .filter((item) => isGangSheetWooItem(item))
    .filter(
      (item) => newestKeyByIdentity.get(getGangSheetCartIdentity(item)) !== item.key,
    )
    .map((item) => item.key);

  let nextCart = cart;
  for (const key of duplicateKeys) {
    nextCart = await removeCartItem(key);
  }

  return nextCart;
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

  for (const item of getWooCartItems(cart)) {
    if (!validWooKeys.has(item.key)) {
      nextCart = await removeCartItem(item.key);
    }
  }

  return nextCart;
}
