"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, Eye, Minus, Plus, RefreshCw, X } from "lucide-react";

import { useCart } from "@/component/product/CartContext";
import { formatCurrency } from "@/component/product/productHelpers";
import {
  getCurrentCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/woocommerce/cart";
import { WooStoreApiError } from "@/lib/woocommerce/store-api";
import {
  findMatchingWooCartItem,
  isGangSheetWooItem,
  reconcileWooCartToLocalItems,
} from "@/lib/woocommerce/cart-sync";
import type { WooCart, WooCartItem } from "@/lib/woocommerce/types";

type LocalCartItem = {
  id: string;
  productId?: number;
  variationId?: number | null;
  variationAttributes?: Array<{ slug?: string; name?: string; option: string }>;
  name: string;
  productUrl?: string;
  image?: string;
  selectedQuantity?: number;
  checkoutQuantity?: number;
  cartQuantity: number;
  totalPrice: number;
  unitPrice: number;
  currencySymbol?: string;
  artworkName?: string;
  wooCartKey?: string;
};

type PreviewArtwork = {
  title: string;
  fileName: string;
  src: string;
};

const emptyAddress = {
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "CA",
  postcode: "",
  country: "US",
  phone: "",
  email: "",
};

function money(amount?: string | null, cart?: WooCart | null) {
  const totals = cart?.totals;
  const minorUnit = totals?.currency_minor_unit ?? 2;
  const numeric = Number.parseInt(amount || "0", 10) / 10 ** minorUnit;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: totals?.currency_code || "USD",
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

function minorAmount(amount?: string | null, cart?: WooCart | null) {
  const totals = cart?.totals;
  const minorUnit = totals?.currency_minor_unit ?? 2;
  return Number.parseInt(amount || "0", 10) / 10 ** minorUnit;
}

function normalizeError(error: unknown) {
  if (error instanceof WooStoreApiError) {
    const code = error.code || "";
    if (code.includes("coupon"))
      return error.message || "That coupon is not valid.";
    if (code.includes("stock"))
      return error.message || "One item is no longer available.";
    if (code.includes("shipping"))
      return error.message || "Shipping is unavailable for this address.";
    if (code.includes("payment"))
      return error.message || "Payment could not be completed.";
    if (code.includes("cart"))
      return (
        error.message || "Your cart changed or expired. Refresh and try again."
      );
    return error.message;
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function wooArtworkName(item: WooCartItem) {
  const artworkEntry = item.item_data.find((entry) =>
    ["artwork", "file", "upload"].some((needle) =>
      `${entry.name} ${entry.value} ${entry.display || ""}`
        .toLowerCase()
        .includes(needle),
    ),
  );
  return artworkEntry?.display || artworkEntry?.value || "";
}

function getHostedCheckoutUrl() {
  const storeUrl = process.env.NEXT_PUBLIC_WC_URL || "https://cmykprint.shop/";
  return new URL("/checkout/", storeUrl).toString();
}

export default function CheckoutExperience() {
  const {
    items: localItems,
    subtotal: localSubtotal,
    removeItem: removeLocalItem,
    updateItemQuantity: updateLocalQuantity,
    clearCart: clearLocalCart,
    getArtworkFile,
    isArtworkReady,
  } = useCart() as {
    items: LocalCartItem[];
    subtotal: number;
    removeItem: (id: string) => void;
    updateItemQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    getArtworkFile: (id: string) => File | null;
    isArtworkReady: boolean;
  };
  const [cart, setCart] = useState<WooCart | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState("");
  const [previewArtwork, setPreviewArtwork] = useState<PreviewArtwork | null>(
    null,
  );

  const hasLocalItems = localItems.length > 0;
  const visibleWooItems = hasLocalItems
    ? (cart?.items || []).filter(isGangSheetWooItem)
    : cart?.items || [];
  const hasWooItems = visibleWooItems.length > 0;
  const wooOnlySubtotal = visibleWooItems.reduce(
    (total, item) => total + minorAmount(item.totals.line_total, cart),
    0,
  );
  const isArtworkLoading =
    hasLocalItems &&
    localItems.some((item) => Boolean(item.artworkName)) &&
    !isArtworkReady;
  const localCartNeedsArtwork = localItems.some(
    (item) =>
      isArtworkReady && Boolean(item.artworkName) && !getArtworkFile(item.id),
  );
  const total = hasLocalItems
    ? formatCurrency(
        localSubtotal + wooOnlySubtotal,
        localItems[0]?.currencySymbol || "$",
      )
    : money(cart?.totals.total_price, cart);

  async function refreshCart() {
    setIsBusy(true);
    setError("");
    try {
      hydrateCart(await getCurrentCart());
    } catch (cartError) {
      setError(normalizeError(cartError));
    } finally {
      setIsBusy(false);
    }
  }

  function hydrateCart(nextCart: WooCart) {
    setCart(nextCart);
  }

  useEffect(() => {
    window.queueMicrotask(() => {
      refreshCart();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function mutateCart(action: () => Promise<WooCart>) {
    setIsBusy(true);
    setError("");
    try {
      hydrateCart(await action());
    } catch (cartError) {
      setError(normalizeError(cartError));
    } finally {
      setIsBusy(false);
    }
  }

  async function redirectToHostedCheckout() {
    if (hasLocalItems) {
      await reconcileWooCartToLocalItems(await getCurrentCart(), localItems);

      const formData = new FormData();
      formData.append("items", JSON.stringify(localItems));
      formData.append("billing_address", JSON.stringify(emptyAddress));
      formData.append("shipping_address", JSON.stringify(emptyAddress));
      formData.append("customer_note", "");

      localItems.forEach((item, index) => {
        const artworkFile = getArtworkFile(item.id);
        if (artworkFile) {
          formData.append(`artwork-${index}`, artworkFile, artworkFile.name);
        }
      });

      const response = await fetch("/api/checkout/cart", {
        method: "POST",
        body: formData,
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.checkoutUrl) {
        throw new Error(
          result.error || "Unable to open secure WooCommerce payment.",
        );
      }

      window.location.href = result.checkoutUrl;
      return;
    }

    window.location.href = getHostedCheckoutUrl();
  }

  function findWooCartItemForLocalItem(localItem: LocalCartItem) {
    return cart ? findMatchingWooCartItem(cart.items, localItem) : null;
  }

  function removeCheckoutItem(localItem: LocalCartItem) {
    removeLocalItem(localItem.id);

    const wooItem = findWooCartItemForLocalItem(localItem);
    if (wooItem) {
      mutateCart(() => removeCartItem(wooItem.key));
    }
  }

  async function handleProceedToPayment() {
    if (!hasLocalItems && !hasWooItems) {
      setError("Your cart is empty.");
      return;
    }

    if (isArtworkLoading) {
      setError(
        "Your artwork files are still loading. Please try again in a moment.",
      );
      return;
    }

    if (localCartNeedsArtwork) {
      setError(
        "Artwork preview is unavailable. Please add the product with artwork again before checkout.",
      );
      return;
    }

    setIsBusy(true);
    setIsRedirecting(true);
    setError("");
    try {
      await redirectToHostedCheckout();
    } catch (checkoutError) {
      setIsRedirecting(false);
      setError(normalizeError(checkoutError));
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

  return (
    <main className="bg-white px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-500">
            Checkout
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
            Shopping cart
          </h1>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
            <AlertCircle className="mb-2" size={18} />
            {error}
          </div>
        ) : null}

        <CartStep
          cart={cart}
          localItems={localItems}
          wooItems={visibleWooItems}
          hasLocalItems={hasLocalItems}
          isBusy={isBusy}
          isArtworkLoading={isArtworkLoading}
          total={total}
          onProceed={handleProceedToPayment}
          onClearLocalCart={clearLocalCart}
          onRemoveLocalItem={removeCheckoutItem}
          onUpdateLocalQuantity={updateLocalQuantity}
          onPreviewArtwork={openArtworkPreview}
          getArtworkFile={getArtworkFile}
          onMutateCart={mutateCart}
        />
      </div>

      {previewArtwork ? (
        <ArtworkModal artwork={previewArtwork} onClose={closeArtworkPreview} />
      ) : null}
      {isRedirecting ? <CheckoutLoadingOverlay /> : null}
    </main>
  );
}

function CartStep(props: {
  cart: WooCart | null;
  localItems: LocalCartItem[];
  wooItems: WooCartItem[];
  hasLocalItems: boolean;
  isBusy: boolean;
  isArtworkLoading: boolean;
  total: string;
  onProceed: () => void;
  onClearLocalCart: () => void;
  onRemoveLocalItem: (item: LocalCartItem) => void;
  onUpdateLocalQuantity: (id: string, quantity: number) => void;
  onPreviewArtwork: (item: LocalCartItem) => void;
  getArtworkFile: (id: string) => File | null;
  onMutateCart: (action: () => Promise<WooCart>) => void;
}) {
  const wooItems = props.wooItems;
  const isEmpty = props.hasLocalItems
    ? !props.localItems.length
    : !wooItems.length;

  return (
    <div className="grid gap-10">
      <section className="overflow-hidden">
        <div className="grid items-center gap-5 py-7 lg:grid-cols-[minmax(0,1fr)_120px_160px_120px_80px] bg-neutral-100 px-6 text-sm font-semibold text-neutral-900 max-lg:hidden">
          <span>Product</span>
          <span className="text-center">Quantity</span>
          <span className="text-center">Per Unit</span>
          <span className="text-center">Subtotal</span>
          <span className="text-center">Remove</span>
        </div>

        <div className="divide-y divide-neutral-200">
          {isEmpty ? (
            <div className="py-14 text-center text-sm text-neutral-500">
              Your cart is empty.{" "}
              <Link href="/products" className="font-semibold text-pink-500">
                Browse products
              </Link>
            </div>
          ) : props.hasLocalItems ? (
            <>
              {props.localItems.map((item) => (
                <LocalCartRow key={item.id} item={item} {...props} />
              ))}
              {wooItems.map((item) => (
                <WooCartRow
                  key={item.key}
                  item={item}
                  cart={props.cart}
                  isBusy={props.isBusy}
                  onMutateCart={props.onMutateCart}
                />
              ))}
            </>
          ) : (
            wooItems.map((item) => (
              <WooCartRow
                key={item.key}
                item={item}
                cart={props.cart}
                isBusy={props.isBusy}
                onMutateCart={props.onMutateCart}
              />
            ))
          )}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
        <div className="flex flex-wrap items-center gap-4">
          {props.hasLocalItems ? (
            <button
              type="button"
              onClick={props.onClearLocalCart}
              className="inline-flex h-12 items-center rounded-full border border-neutral-300 px-7 text-sm font-semibold"
            >
              Clear
            </button>
          ) : null}
        </div>

        <CartTotals
          total={props.total}
          isBusy={props.isBusy}
          isArtworkLoading={props.isArtworkLoading}
          onProceed={props.onProceed}
        />
      </div>
    </div>
  );
}

function LocalCartRow({
  item,
  onRemoveLocalItem,
  onPreviewArtwork,
  getArtworkFile,
}: {
  item: LocalCartItem;
  onRemoveLocalItem: (item: LocalCartItem) => void;
  onPreviewArtwork: (item: LocalCartItem) => void;
  getArtworkFile: (id: string) => File | null;
}) {
  const artworkFile = getArtworkFile(item.id);

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)] lg:grid lg:items-center lg:gap-5 lg:rounded-none lg:border-0 lg:px-5 lg:py-7 lg:shadow-none lg:grid-cols-[minmax(0,1fr)_120px_160px_120px_80px]">
      <ProductCell
        image={item.image}
        title={item.name}
        subtitle={
          item.selectedQuantity ? `${item.selectedQuantity} units` : undefined
        }
      >
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
          ) : item.artworkName ? (
            <span className="font-semibold text-neutral-400">
              Preview unavailable
            </span>
          ) : null}
        </div>
      </ProductCell>
      <div className="mt-5 grid gap-3 border-t border-neutral-100 pt-4 lg:mt-0 lg:contents lg:border-0 lg:pt-0">
        <div className="flex items-center justify-between gap-4 lg:block lg:text-center">
          <span className="text-xs font-semibold uppercase text-neutral-400 lg:hidden">
            Quantity
          </span>
          <span className="text-sm font-semibold">{item.selectedQuantity}</span>
        </div>
        <div className="flex items-center justify-between gap-4 lg:block lg:text-center">
          <span className="text-xs font-semibold uppercase text-neutral-400 lg:hidden">
            Per Unit
          </span>
          <span className="text-sm font-semibold">
            ${item.selectedQuantity ? item.totalPrice / item.selectedQuantity : 0}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 lg:block lg:text-center">
          <span className="text-xs font-semibold uppercase text-neutral-400 lg:hidden">
            Subtotal
          </span>
          <span className="text-sm font-medium">
            {formatCurrency(item.totalPrice, item.currencySymbol || "$")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-3 lg:block lg:border-0 lg:pt-0 lg:text-center">
          <span className="text-xs font-semibold uppercase text-neutral-400 lg:hidden">
            Remove
          </span>
          <button
            type="button"
            onClick={() => onRemoveLocalItem(item)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 lg:mx-auto"
            aria-label={`Remove ${item.name}`}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

function WooCartRow({
  item,
  cart,
  isBusy,
  onMutateCart,
}: {
  item: WooCartItem;
  cart: WooCart | null;
  isBusy: boolean;
  onMutateCart: (action: () => Promise<WooCart>) => void;
}) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)] lg:grid lg:items-center lg:gap-5 lg:rounded-none lg:border-0 lg:px-5 lg:py-7 lg:shadow-none lg:grid-cols-[minmax(0,1fr)_120px_160px_120px_80px]">
      <ProductCell
        image={item.images[0]?.thumbnail || item.images[0]?.src}
        title={item.name}
        subtitle={item.variation.map((entry) => entry.value).join(" / ")}
      >
        <p className="mt-1 text-xs text-neutral-500">
          Files Upload: {wooArtworkName(item) || "Not uploaded"}
        </p>
      </ProductCell>
      <div className="mt-5 grid gap-3 border-t border-neutral-100 pt-4 lg:mt-0 lg:contents lg:border-0 lg:pt-0">
        <div className="flex items-center justify-between gap-4 lg:block lg:text-center">
          <span className="text-xs font-semibold uppercase text-neutral-400 lg:hidden">
            Quantity
          </span>
          <QuantityControl
            value={item.quantity}
            disabled={isBusy || !item.quantity_limits.editable}
            min={item.quantity_limits.minimum}
            max={item.quantity_limits.maximum}
            step={item.quantity_limits.multiple_of}
            onChange={(quantity) =>
              onMutateCart(() => updateCartItemQuantity(item.key, quantity))
            }
          />
        </div>
        <div className="flex items-center justify-between gap-4 lg:block lg:text-center">
          <span className="text-xs font-semibold uppercase text-neutral-400 lg:hidden">
            Per Unit
          </span>
          <span className="text-sm font-medium">
            {money(item.prices.price, cart)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 lg:block lg:text-center">
          <span className="text-xs font-semibold uppercase text-neutral-400 lg:hidden">
            Subtotal
          </span>
          <span className="text-sm font-semibold">
            {money(item.totals.line_total, cart)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-3 lg:block lg:border-0 lg:pt-0 lg:text-center">
          <span className="text-xs font-semibold uppercase text-neutral-400 lg:hidden">
            Remove
          </span>
          <button
            type="button"
            onClick={() => onMutateCart(() => removeCartItem(item.key))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label={`Remove ${item.name}`}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductCell({
  image,
  title,
  subtitle,
  children,
}: {
  image?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-5">
      <div className="relative h-16 w-16 overflow-hidden rounded-full bg-neutral-100">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div>
        <h2 className="text-base font-semibold leading-snug text-neutral-950">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-xs text-neutral-500">{subtitle}</p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function QuantityControl({
  value,
  onChange,
  disabled,
  min = 1,
  max = 999,
  step = 1,
}: {
  value: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}) {
  const next = (quantity: number) => Math.max(min, Math.min(max, quantity));
  return (
    <div className="inline-flex h-12 w-28 items-center justify-between rounded-full border border-neutral-300 px-3">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(next(value - step))}
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <span className="text-sm font-semibold">{value}</span>
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(next(value + step))}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
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
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">Checkout total</h2>
      <div className="mt-6 flex items-center justify-between border-y border-neutral-200 py-6">
        <span className="text-sm font-semibold text-neutral-600">
          Product total
        </span>
        <span className="text-2xl font-bold text-neutral-950">{total}</span>
      </div>
      <button
        type="button"
        onClick={onProceed}
        disabled={isBusy || isArtworkLoading}
        className="mt-6 inline-flex h-14 w-full items-center justify-center rounded-full bg-pink-500 text-sm font-semibold text-white transition hover:bg-pink-600 disabled:bg-pink-200"
      >
        {isArtworkLoading ? "Preparing artwork..." : "Proceed to checkout"}
      </button>
    </section>
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
          We are sending your cart and artwork safely to checkout.
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
