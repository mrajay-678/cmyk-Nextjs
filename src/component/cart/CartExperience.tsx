"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, Trash2, X } from "lucide-react";

import {
  getCurrentCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/woocommerce/cart";
import {
  CART_NONCE_STORAGE_KEY,
  CART_TOKEN_STORAGE_KEY,
  clearStoredCartToken,
} from "@/lib/woocommerce/store-api";
import { useCart } from "@/component/product/CartContext";
import { formatCurrency } from "@/component/product/productHelpers";
import {
  findMatchingWooCartItem,
  removeDuplicateGangSheetItems,
} from "@/lib/woocommerce/cart-sync";
import type { WooCart, WooCartItem } from "@/lib/woocommerce/types";

type LocalCartItem = {
  id: string;
  productId?: number;
  variationId?: number | null;
  name: string;
  image?: string;
  selectedQuantity?: number;
  cartQuantity: number;
  totalPrice: number;
  currencySymbol?: string;
  artworkName?: string;
  wooCartKey?: string;
};

function money(amount?: string | null, cart?: WooCart) {
  const minorUnit = cart?.totals.currency_minor_unit ?? 2;
  const numeric = Number.parseInt(amount || "0", 10) / 10 ** minorUnit;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: cart?.totals.currency_code || "USD",
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

function unitMoney(item: WooCart["items"][number], cart: WooCart) {
  const lineTotal = Number.parseInt(item.totals.line_total || "0", 10);
  const quantity = item.quantity || 1;
  return money(String(Math.round(lineTotal / quantity)), cart);
}

function decodeText(value: string) {
  if (typeof document === "undefined") {
    return value;
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function getMetaName(entry: WooCartItem["item_data"][number]) {
  return decodeText(entry.name || ("key" in entry ? String(entry.key) : "")).trim();
}

function getMetaValue(entry: WooCartItem["item_data"][number]) {
  return decodeText(entry.display || entry.value || "").trim();
}

function getFileLabel(value: string) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    const fileName = decodeURIComponent(url.pathname.split("/").pop() || "");
    return fileName || "Uploaded file";
  } catch {
    return value;
  }
}

function getWooMetaLines(item: WooCartItem) {
  const hiddenNames = new Set([
    "gang sheet product type",
    "image count",
    "image services",
    "image service ids",
    "gang sheet add-on fee",
    "rush fee",
    "image services fee",
  ]);

  return item.item_data
    .map((entry) => ({
      name: getMetaName(entry),
      value: getMetaValue(entry),
    }))
    .filter((entry) => entry.value)
    .filter((entry) => !hiddenNames.has(entry.name.toLowerCase()))
    .map((entry) => {
      const normalizedName = entry.name.toLowerCase();
      if (normalizedName.includes("uploaded file")) {
        return { name: "Uploaded file", value: getFileLabel(entry.value) };
      }
      if (normalizedName.includes("print ready")) {
        return { name: "Print ready file", value: "Ready" };
      }
      return entry;
    })
    .slice(0, 3);
}

function LocalCartRow({
  item,
  isBusy,
  onUpdate,
  onRemove,
}: {
  item: LocalCartItem;
  isBusy: boolean;
  onUpdate: (item: LocalCartItem, quantity: number) => void;
  onRemove: (item: LocalCartItem) => void;
}) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)] md:grid md:grid-cols-[minmax(260px,1fr)_130px_130px_130px_80px] md:items-center md:gap-4 md:rounded-none md:border-0 md:px-5 md:py-7 md:shadow-none">
      <div className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] gap-4">
        <div className="relative h-[76px] w-[76px] overflow-hidden rounded-md bg-neutral-100">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="76px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0 self-center">
          <h2 className="break-words font-heading text-base font-bold leading-tight text-neutral-950">
            {item.name}
          </h2>
          {item.selectedQuantity ? (
            <p className="mt-1 text-sm text-neutral-500">
              {item.selectedQuantity} units
            </p>
          ) : null}
          <p className="mt-1 text-xs text-neutral-500">
            Files Upload: {item.artworkName || "Not uploaded"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-neutral-100 pt-4 md:mt-0 md:border-0 md:pt-0 md:justify-center">
        <span className="text-xs font-semibold uppercase text-neutral-400 md:hidden">
          Quantity
        </span>
        <QuantityControl
          value={item.cartQuantity}
          disabled={isBusy}
          min={1}
          onChange={(quantity) => onUpdate(item, quantity)}
        />
      </div>

      <CartAmount label="Per Unit">
        {formatCurrency(item.totalPrice, item.currencySymbol || "$")}
      </CartAmount>
      <CartAmount label="Subtotal">
        {formatCurrency(
          item.totalPrice * item.cartQuantity,
          item.currencySymbol || "$",
        )}
      </CartAmount>
      <RemoveButton
        disabled={isBusy}
        label={`Remove ${item.name}`}
        onClick={() => onRemove(item)}
      />
    </article>
  );
}

function WooCartRow({
  item,
  cart,
  isBusy,
  onMutate,
}: {
  item: WooCartItem;
  cart: WooCart;
  isBusy: boolean;
  onMutate: (action: () => Promise<WooCart>) => void;
}) {
  const metaLines = getWooMetaLines(item);

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)] md:grid md:grid-cols-[minmax(260px,1fr)_130px_130px_130px_80px] md:items-center md:gap-4 md:rounded-none md:border-0 md:px-5 md:py-7 md:shadow-none">
      <div className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] gap-4">
        <div className="relative h-[76px] w-[76px] overflow-hidden rounded-md bg-neutral-100">
          {item.images[0]?.thumbnail || item.images[0]?.src ? (
            <Image
              src={item.images[0].thumbnail || item.images[0].src}
              alt={item.images[0].alt || item.name}
              fill
              sizes="76px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0 self-center">
          <h2 className="break-words font-heading text-base font-bold leading-tight text-neutral-950">
            {item.name}
          </h2>
          {item.variation.length ? (
            <p className="mt-1 text-sm text-neutral-500">
              {item.variation.map((entry) => decodeText(entry.value)).join(", ")}
            </p>
          ) : null}
          {metaLines.length ? (
            <div className="mt-2 grid gap-1 text-xs text-neutral-500">
              {metaLines.map((entry, index) => (
                <p
                  key={`${item.key}-${entry.name}-${index}`}
                  className="break-words"
                >
                  <span className="font-medium text-neutral-700">
                    {entry.name}:
                  </span>{" "}
                  {entry.value}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-neutral-100 pt-4 md:mt-0 md:border-0 md:pt-0 md:justify-center">
        <span className="text-xs font-semibold uppercase text-neutral-400 md:hidden">
          Quantity
        </span>
        <QuantityControl
          value={item.quantity}
          disabled={isBusy}
          min={item.quantity_limits.minimum}
          max={item.quantity_limits.maximum}
          onChange={(quantity) =>
            onMutate(() => updateCartItemQuantity(item.key, quantity))
          }
        />
      </div>

      <CartAmount label="Per Unit">{unitMoney(item, cart)}</CartAmount>
      <CartAmount label="Subtotal">{money(item.totals.line_total, cart)}</CartAmount>
      <RemoveButton
        disabled={isBusy}
        label={`Remove ${item.name}`}
        onClick={() => onMutate(() => removeCartItem(item.key))}
      />
    </article>
  );
}

function QuantityControl({
  value,
  disabled,
  min = 1,
  max = 999,
  onChange,
}: {
  value: number;
  disabled: boolean;
  min?: number;
  max?: number;
  onChange: (quantity: number) => void;
}) {
  return (
    <div className="inline-flex h-10 w-28 items-center justify-between rounded-full border border-neutral-200 bg-white px-3">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 disabled:text-neutral-300"
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>
      <span className="w-7 text-center text-sm font-semibold">{value}</span>
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 disabled:text-neutral-300"
        aria-label="Increase quantity"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function CartAmount({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <p className="mt-3 flex items-center justify-between text-sm font-semibold text-neutral-950 md:mt-0 md:block md:text-center">
      <span className="text-xs font-semibold uppercase text-neutral-400 md:hidden">
        {label}
      </span>
      {children}
    </p>
  );
}

function RemoveButton({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 md:mt-0 md:border-0 md:pt-0 md:justify-center">
      <span className="text-xs font-semibold uppercase text-neutral-400 md:hidden">
        Remove
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-950 disabled:text-neutral-200"
        aria-label={label}
      >
        <X className="hidden md:block" size={18} />
        <Trash2 className="md:hidden" size={17} />
      </button>
    </div>
  );
}

export default function CartExperience() {
  const {
    items: localItems,
    removeItem: removeLocalItem,
    updateItemQuantity: updateLocalQuantity,
    clearCart: clearLocalCart,
  } = useCart() as {
    items: LocalCartItem[];
    removeItem: (id: string) => void;
    updateItemQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
  };
  const [cart, setCart] = useState<WooCart | null>(null);
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const cartRequestSequenceRef = useRef(0);
  const visibleLocalItems = useMemo(
    () =>
      cart
        ? localItems.filter((item) =>
            Boolean(findMatchingWooCartItem(cart.items, item)),
          )
        : [],
    [cart, localItems],
  );
  const visibleLocalWooKeys = useMemo(
    () =>
      new Set(
        visibleLocalItems
          .map((item) => findMatchingWooCartItem(cart?.items || [], item)?.key)
          .filter(Boolean),
      ),
    [cart, visibleLocalItems],
  );
  const visibleWooItems = (cart?.items || []).filter(
    (item) => !visibleLocalWooKeys.has(item.key),
  );
  const isDevelopment = process.env.NODE_ENV === "development";
  const hasLocalItems = visibleLocalItems.length > 0;
  const hasVisibleItems = hasLocalItems || visibleWooItems.length > 0;
  const displayTotal = money(cart?.totals.total_price, cart || undefined);

  const hydrateCart = useCallback(
    (nextCart: WooCart, sequenceId?: number) => {
      if (
        typeof sequenceId === "number" &&
        sequenceId !== cartRequestSequenceRef.current
      ) {
        return;
      }

      setCart(nextCart);

      if (nextCart.items_count === 0 && localItems.length > 0) {
        clearLocalCart();
      }

      if (process.env.NODE_ENV === "development") {
        console.info("[cart page] state", {
          sequenceId,
          wooItemsCount: nextCart.items_count,
          localItemsCount: nextCart.items_count === 0 ? 0 : localItems.length,
        });
      }
    },
    [clearLocalCart, localItems.length],
  );

  const refreshCart = useCallback(async () => {
    const sequenceId = ++cartRequestSequenceRef.current;
    setIsBusy(true);
    setError("");
    try {
      hydrateCart(
        await removeDuplicateGangSheetItems(await getCurrentCart()),
        sequenceId,
      );
    } catch (cartError) {
      setError(
        cartError instanceof Error ? cartError.message : "Unable to load cart.",
      );
    } finally {
      if (sequenceId === cartRequestSequenceRef.current) {
        setIsBusy(false);
      }
    }
  }, [hydrateCart]);

  async function mutateCart(action: () => Promise<WooCart>) {
    const sequenceId = ++cartRequestSequenceRef.current;
    setIsBusy(true);
    setError("");
    try {
      hydrateCart(await removeDuplicateGangSheetItems(await action()), sequenceId);
    } catch (cartError) {
      setError(
        cartError instanceof Error
          ? cartError.message
          : "Unable to update cart.",
      );
    } finally {
      if (sequenceId === cartRequestSequenceRef.current) {
        setIsBusy(false);
      }
    }
  }

  useEffect(() => {
    window.queueMicrotask(refreshCart);
  }, [refreshCart]);

  async function removeWooCartKeys(keys: string[]) {
    setIsBusy(true);
    setError("");
    try {
      let nextCart = cart;
      for (const key of keys) {
        nextCart = await removeCartItem(key);
      }
      if (nextCart) {
        hydrateCart(nextCart);
      }
    } catch (cartError) {
      setError(
        cartError instanceof Error
          ? cartError.message
          : "Unable to update cart.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  function findWooCartItemForLocalItem(localItem: LocalCartItem) {
    return cart ? findMatchingWooCartItem(cart.items, localItem) : null;
  }

  function updateLocalCartItem(localItem: LocalCartItem, quantity: number) {
    updateLocalQuantity(localItem.id, quantity);

    const wooItem = findWooCartItemForLocalItem(localItem);
    if (wooItem) {
      mutateCart(() => updateCartItemQuantity(wooItem.key, quantity));
    }
  }

  function removeLocalCartItem(localItem: LocalCartItem) {
    removeLocalItem(localItem.id);

    const wooItem = findWooCartItemForLocalItem(localItem);
    if (wooItem) {
      mutateCart(() => removeCartItem(wooItem.key));
    }
  }

  function clearVisibleCart() {
    if (hasLocalItems) {
      const wooKeys = visibleLocalItems
        .map((item) => findWooCartItemForLocalItem(item)?.key)
        .filter((key): key is WooCartItem["key"] => Boolean(key));
      clearLocalCart();
      void removeWooCartKeys([
        ...wooKeys,
        ...visibleWooItems.map((item) => item.key),
      ]);
      return;
    }

    void removeWooCartKeys((cart?.items || []).map((item) => item.key));
  }

  async function clearWooCartSession() {
    setIsBusy(true);
    setError("");

    try {
      const headers = new Headers();
      const cartToken = window.localStorage.getItem(CART_TOKEN_STORAGE_KEY);
      const nonce = window.localStorage.getItem(CART_NONCE_STORAGE_KEY);

      if (cartToken) {
        headers.set("Cart-Token", cartToken);
      }

      if (nonce) {
        headers.set("Nonce", nonce);
      }

      const response = await fetch("/api/dev/clear-woo-cart", {
        method: "POST",
        headers,
        credentials: "same-origin",
      });
      const nextCart = await response.json();

      if (!response.ok) {
        throw new Error(nextCart?.message || "Unable to clear Woo cart.");
      }

      hydrateCart(nextCart);
      clearStoredCartToken();
    } catch (cartError) {
      setError(
        cartError instanceof Error
          ? cartError.message
          : "Unable to clear Woo cart.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="bg-white px-4 py-10 sm:px-6 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-pink-500">
            Checkout
          </p>
          <h1 className="mt-4 font-heading text-3xl font-bold text-neutral-950 sm:text-4xl">
            Shopping cart
          </h1>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        ) : null}

        <div>
          {!cart ? (
            <p className="text-sm text-neutral-500">Loading cart...</p>
          ) : hasVisibleItems ? (
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
              <section className="min-w-0">
                <div className="hidden bg-neutral-100 px-6 py-6 text-sm font-medium text-neutral-950 md:grid md:grid-cols-[minmax(320px,1fr)_130px_130px_130px_80px] md:items-center">
                  <span>Product</span>
                  <span className="text-center">Quantity</span>
                  <span className="text-center">Per Unit</span>
                  <span className="text-center">Subtotal</span>
                  <span className="text-center">Remove</span>
                </div>

                <div className="space-y-4 md:space-y-0 md:divide-y md:divide-neutral-100">
                  {hasLocalItems
                    ? visibleLocalItems.map((item) => (
                        <LocalCartRow
                          key={item.id}
                          item={item}
                          isBusy={isBusy}
                          onUpdate={updateLocalCartItem}
                          onRemove={removeLocalCartItem}
                        />
                      ))
                    : null}
                  {visibleWooItems.map((item) => (
                    <WooCartRow
                      key={item.key}
                      item={item}
                      cart={cart}
                      isBusy={isBusy}
                      onMutate={mutateCart}
                    />
                  ))}
                </div>
              </section>

              <aside className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] lg:sticky lg:top-28">
                <h2 className="font-heading text-2xl font-bold text-neutral-950">
                  Checkout total
                </h2>
                <div className="mt-7 border-t border-neutral-200 pt-7">
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-sm text-neutral-600">
                      Product total
                    </span>
                    <span className="text-2xl font-medium text-neutral-950">
                      {displayTotal}
                    </span>
                  </div>
                </div>
                <div className="mt-8 border-t border-neutral-200 pt-6">
                  <Link
                    href="/checkout"
                    className="inline-flex h-14 w-full items-center justify-center rounded-full bg-pink-500 px-6 text-sm font-bold text-white transition hover:bg-pink-600"
                  >
                    Proceed to checkout
                  </Link>
                </div>
              </aside>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-neutral-500">Your cart is empty.</p>
              <Link
                href="/products"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white"
              >
                Browse products
              </Link>
            </div>
          )}
          {hasVisibleItems ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={clearVisibleCart}
                className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 px-6 text-sm font-semibold"
              >
                Clear
              </button>
              {isDevelopment ? (
                <button
                  type="button"
                  onClick={clearWooCartSession}
                  disabled={isBusy}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-red-200 px-6 text-sm font-semibold text-red-700 disabled:opacity-50"
                >
                  Clear Woo Cart
                </button>
              ) : null}
            </div>
          ) : null}
          {!hasVisibleItems && isDevelopment ? (
            <button
              type="button"
              onClick={clearWooCartSession}
              disabled={isBusy}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-red-200 px-6 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              Clear Woo Cart
            </button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
