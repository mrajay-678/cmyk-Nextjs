"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, RefreshCw, X } from "lucide-react";

import {
  getCurrentCart,
  removeCartItem,
} from "@/lib/woocommerce/cart";
import {
  CART_NONCE_STORAGE_KEY,
  CART_TOKEN_STORAGE_KEY,
  clearStoredCartToken,
} from "@/lib/woocommerce/store-api";
import { useCart } from "@/component/product/CartContext";
import { formatCurrency } from "@/component/product/productHelpers";
import {
  acceptPendingWooCartIntent,
  findMatchingWooCartItem,
  removeDuplicateGangSheetItems,
} from "@/lib/woocommerce/cart-sync";
import {
  createHostedCheckoutUrl,
  hasMissingLocalArtwork,
  isLocalArtworkLoading,
} from "@/lib/woocommerce/checkout-handoff";
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

type PreviewArtwork = {
  title: string;
  fileName: string;
  src: string;
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
  return decodeText(
    entry.name || ("key" in entry ? String(entry.key) : ""),
  ).trim();
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
  onRemove,
  onPreviewArtwork,
  getArtworkFile,
}: {
  item: LocalCartItem;
  isBusy: boolean;
  onRemove: (item: LocalCartItem) => void;
  onPreviewArtwork: (item: LocalCartItem) => void;
  getArtworkFile: (id: string) => File | null;
}) {
  const artworkFile = getArtworkFile(item.id);

  return (
    <article className="rounded-xl border border-neutral-100 bg-white p-4 md:grid md:grid-cols-[minmax(420px,1fr)_120px_140px_140px_80px] md:items-center md:gap-5 md:rounded-none md:border-0 md:px-6 md:py-8">
      <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-center gap-5">
        <div className="relative h-14 w-12 overflow-hidden rounded-sm bg-neutral-100">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="48px"
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
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <span>Files Upload: {item.artworkName || "Not uploaded"}</span>
            {artworkFile ? (
              <button
                type="button"
                onClick={() => onPreviewArtwork(item)}
                className="inline-flex items-center gap-1 font-semibold text-pink-500"
              >
                <Eye size={14} />
                View
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-neutral-100 pt-4 md:mt-0 md:border-0 md:pt-0 md:justify-center">
        <span className="text-xs font-semibold uppercase text-neutral-400 md:hidden">
          Quantity
        </span>
        <span className="text-sm font-medium text-neutral-950">
          {item.selectedQuantity || item.cartQuantity}
        </span>
      </div>

      <CartAmount label="Per Unit">
        {formatCurrency(
          item.selectedQuantity ? item.totalPrice / item.selectedQuantity : 0,
          item.currencySymbol || "$",
        )}
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
    <article className="rounded-xl border border-neutral-100 bg-white p-4 md:grid md:grid-cols-[minmax(420px,1fr)_120px_140px_140px_80px] md:items-center md:gap-5 md:rounded-none md:border-0 md:px-6 md:py-8">
      <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-center gap-5">
        <div className="relative h-14 w-12 overflow-hidden rounded-sm bg-neutral-100">
          {item.images[0]?.thumbnail || item.images[0]?.src ? (
            <Image
              src={item.images[0].thumbnail || item.images[0].src}
              alt={item.images[0].alt || item.name}
              fill
              sizes="48px"
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
              {item.variation
                .map((entry) => decodeText(entry.value))
                .join(", ")}
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
        <span className="text-sm font-medium text-neutral-950">
          {item.quantity}
        </span>
      </div>

      <CartAmount label="Per Unit">{unitMoney(item, cart)}</CartAmount>
      <CartAmount label="Subtotal">
        {money(item.totals.line_total, cart)}
      </CartAmount>
      <RemoveButton
        disabled={isBusy}
        label={`Remove ${item.name}`}
        onClick={() => onMutate(() => removeCartItem(item.key))}
      />
    </article>
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
    <p className="mt-3 flex items-center justify-between text-sm font-medium text-neutral-950 md:mt-0 md:block md:text-center">
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
        <X size={18} />
      </button>
    </div>
  );
}

function CartTotals({
  total,
  isBusy,
  isArtworkLoading,
  onProceed,
}: {
  total: string;
  isBusy: boolean;
  isArtworkLoading: boolean;
  onProceed: () => void;
}) {
  return (
    <aside className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.12)] sm:p-7">
      <div className="text-2xl font-semibold text-neutral-950">
        Checkout total
      </div>
      <div className="mt-7 border-t border-neutral-200 pt-7">
        <div className="flex items-center justify-between gap-6">
          <span className="text-sm text-neutral-600">Product total</span>
          <span className="text-2xl font-medium text-neutral-950">{total}</span>
        </div>
      </div>
      <div className="mt-7 border-t border-neutral-200 pt-6">
        <button
          type="button"
          onClick={onProceed}
          disabled={isBusy || isArtworkLoading}
          className="inline-flex h-14 w-full items-center justify-center rounded-full bg-pink-500 px-6 text-sm font-bold text-white transition hover:bg-pink-600 disabled:bg-pink-200"
        >
          {isArtworkLoading ? "Preparing artwork..." : "Proceed to payment"}
        </button>
      </div>
    </aside>
  );
}

function CheckoutLoadingOverlay() {
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-white/90 px-6 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-pink-500 text-white shadow-lg shadow-pink-200">
          <RefreshCw className="animate-spin" size={26} />
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-neutral-950">
          Just a moment!
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          We are sending your cart and artwork safely to payment.
        </p>
      </div>
    </div>
  );
}

function ArtworkModal({
  artwork,
  onClose,
}: {
  artwork: PreviewArtwork;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-white/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-hidden border border-neutral-300 bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow"
          aria-label="Close artwork preview"
        >
          <X size={18} />
        </button>
        <div className="relative h-[80vh] min-h-[420px] bg-neutral-50">
          <Image
            src={artwork.src}
            alt={artwork.fileName}
            fill
            sizes="600px"
            className="object-contain"
            unoptimized
          />
        </div>
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 text-xs text-neutral-600">
          <span className="truncate">{artwork.title}</span>
          <span className="shrink-0">{artwork.fileName}</span>
        </div>
      </div>
    </div>
  );
}

export default function CartExperience() {
  const {
    items: localItems,
    removeItem: removeLocalItem,
    clearCart: clearLocalCart,
    getArtworkFile,
    isArtworkReady,
  } = useCart() as {
    items: LocalCartItem[];
    removeItem: (id: string) => void;
    clearCart: () => void;
    getArtworkFile: (id: string) => File | null;
    isArtworkReady: boolean;
  };
  const [cart, setCart] = useState<WooCart | null>(null);
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [previewArtwork, setPreviewArtwork] = useState<PreviewArtwork | null>(
    null,
  );
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
  const artworkLoading = isLocalArtworkLoading({
    localItems: visibleLocalItems,
    isArtworkReady,
  });
  const displayTotal = money(cart?.totals.total_price, cart || undefined);

  useEffect(() => {
    const message = new URLSearchParams(window.location.search).get(
      "gang_sheet_checkout_error",
    );

    if (message) {
      window.queueMicrotask(() => setError(message));
    }
  }, []);

  const hydrateCart = useCallback(
    (nextCart: WooCart, sequenceId?: number) => {
      if (
        typeof sequenceId === "number" &&
        sequenceId !== cartRequestSequenceRef.current
      ) {
        return;
      }

      acceptPendingWooCartIntent(nextCart);
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
    if (!new URLSearchParams(window.location.search).get("gang_sheet_checkout_error")) {
      setError("");
    }
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
      hydrateCart(
        await removeDuplicateGangSheetItems(await action()),
        sequenceId,
      );
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

  async function proceedToPayment() {
    if (!hasVisibleItems) {
      setError("Your cart is empty.");
      return;
    }

    if (artworkLoading) {
      setError(
        "Your artwork files are still loading. Please try again in a moment.",
      );
      return;
    }

    if (
      hasMissingLocalArtwork({
        localItems: visibleLocalItems,
        isArtworkReady,
        getArtworkFile,
      })
    ) {
      setError(
        "Artwork preview is unavailable. Please add the product with artwork again before payment.",
      );
      return;
    }

    setIsBusy(true);
    setIsRedirecting(true);
    setError("");

    try {
      const checkoutUrl = await createHostedCheckoutUrl({
        localItems: visibleLocalItems,
        getArtworkFile,
      });
      window.location.assign(checkoutUrl);
    } catch (checkoutError) {
      setIsRedirecting(false);
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to open secure WooCommerce payment.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  function openArtworkPreview(item: LocalCartItem) {
    const file = getArtworkFile(item.id);
    if (!file) return;
    setPreviewArtwork({
      title: item.name,
      fileName: file.name,
      src: URL.createObjectURL(file),
    });
  }

  function closeArtworkPreview() {
    if (previewArtwork) URL.revokeObjectURL(previewArtwork.src);
    setPreviewArtwork(null);
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
    <main className="bg-white px-4 py-12 sm:px-6 lg:px-16">
      <div className="mx-auto max-w-[1152px]">
        <div className="mb-12 md:mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-pink-500">
            Checkout
          </p>
          <h1 className="mt-4 text-3xl text-neutral-950 sm:text-4xl">
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
            <>
              <section className="min-w-0">
                <div className="hidden bg-neutral-100 px-6 py-7 text-sm font-medium text-neutral-950 md:grid md:grid-cols-[minmax(420px,1fr)_120px_140px_140px_80px] md:items-center md:gap-5">
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
                          onRemove={removeLocalCartItem}
                          onPreviewArtwork={openArtworkPreview}
                          getArtworkFile={getArtworkFile}
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

              <div className="mt-16 grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
                <div>
                  <button
                    type="button"
                    onClick={clearVisibleCart}
                    className="inline-flex h-12 min-w-23 items-center justify-center rounded-full border border-neutral-300 px-7 text-sm font-bold text-neutral-950 transition hover:border-neutral-950"
                  >
                    Clear
                  </button>
                  {isDevelopment ? (
                    <button
                      type="button"
                      onClick={clearWooCartSession}
                      disabled={isBusy}
                      className="ml-3 inline-flex h-12 items-center justify-center rounded-full border border-red-200 px-6 text-sm font-semibold text-red-700 disabled:opacity-50"
                    >
                      Clear Woo Cart
                    </button>
                  ) : null}
                </div>

                <CartTotals
                  total={displayTotal}
                  isBusy={isBusy}
                  isArtworkLoading={artworkLoading}
                  onProceed={proceedToPayment}
                />
              </div>
            </>
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
      {previewArtwork ? (
        <ArtworkModal artwork={previewArtwork} onClose={closeArtworkPreview} />
      ) : null}
      {isRedirecting ? <CheckoutLoadingOverlay /> : null}
    </main>
  );
}
