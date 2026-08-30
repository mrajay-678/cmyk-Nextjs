"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Minus,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";

import { useCart } from "@/component/product/CartContext";
import { formatCurrency } from "@/component/product/productHelpers";
import {
  addCartItem,
  getCurrentCart,
  removeCartItem,
  updateCartCustomer,
  updateCartItemQuantity,
} from "@/lib/woocommerce/cart";
import { selectShippingRate } from "@/lib/woocommerce/shipping";
import { WooStoreApiError } from "@/lib/woocommerce/store-api";
import type { WooAddress, WooCart, WooCartItem } from "@/lib/woocommerce/types";

type CheckoutStep = "cart" | "payment";

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
};

type PreviewArtwork = {
  title: string;
  fileName: string;
  src: string;
};

const emptyAddress: WooAddress = {
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

const gatewayLabels: Record<string, string> = {
  woocommerce_payments: "Card",
  paypal: "PayPal",
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

function shippingMethodLabel(rate: {
  method_id?: string;
  rate_id?: string;
  name?: string;
}) {
  const value =
    `${rate.method_id || ""} ${rate.rate_id || ""} ${rate.name || ""}`.toLowerCase();

  if (value.includes("pickup")) {
    return "Pickup";
  }

  return "Delivery";
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

  const [step, setStep] = useState<CheckoutStep>("cart");
  const [cart, setCart] = useState<WooCart | null>(null);
  const [billingAddress, setBillingAddress] =
    useState<WooAddress>(emptyAddress);
  const [shippingAddress, setShippingAddress] =
    useState<WooAddress>(emptyAddress);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState("");
  const [previewArtwork, setPreviewArtwork] = useState<PreviewArtwork | null>(
    null,
  );

  const hasLocalItems = localItems.length > 0;
  const hasWooItems = Boolean(cart?.items.length);
  const selectedShippingRates = useMemo(
    () =>
      cart?.shipping_rates.flatMap((shippingPackage) =>
        shippingPackage.shipping_rates.filter((rate) => rate.selected),
      ) || [],
    [cart],
  );
  const availablePaymentMethods = cart?.payment_methods || [];
  const isArtworkLoading =
    hasLocalItems &&
    localItems.some((item) => Boolean(item.artworkName)) &&
    !isArtworkReady;
  const localCartNeedsArtwork = localItems.some(
    (item) =>
      isArtworkReady && Boolean(item.artworkName) && !getArtworkFile(item.id),
  );
  const subtotal = hasLocalItems
    ? formatCurrency(localSubtotal, localItems[0]?.currencySymbol || "$")
    : money(cart?.totals.total_items, cart);
  const total = hasLocalItems
    ? formatCurrency(localSubtotal, localItems[0]?.currencySymbol || "$")
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
    setBillingAddress({ ...emptyAddress, ...nextCart.billing_address });
    setShippingAddress({ ...emptyAddress, ...nextCart.shipping_address });
    setPaymentMethod((current) => current || nextCart.payment_methods[0] || "");
  }

  useEffect(() => {
    window.queueMicrotask(() => {
      refreshCart();
    });
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

  function updateAddress(
    type: "billing" | "shipping",
    field: keyof WooAddress,
    value: string,
  ) {
    const setter = type === "billing" ? setBillingAddress : setShippingAddress;
    setter((current) => ({ ...current, [field]: value }));
  }

  async function handleAddressBlur() {
    if (!cart?.items.length) return;

    await mutateCart(() =>
      updateCartCustomer({
        billing_address: billingAddress,
        shipping_address: sameAsBilling ? billingAddress : shippingAddress,
      }),
    );
  }

  async function syncLocalItemsToWooCart() {
    if (cart?.items.length) {
      const nextCart = await getCurrentCart();
      hydrateCart(nextCart);
      return nextCart;
    }

    let nextCart: WooCart | null = null;
    for (const item of localItems) {
      nextCart = await addCartItem({
        id: Number(item.variationId || item.productId || item.id),
        quantity: Number(item.checkoutQuantity || item.cartQuantity || 1),
        variation: (item.variationAttributes || []).map((attribute) => ({
          attribute: attribute.slug || attribute.name || "",
          value: attribute.option,
        })),
      });
    }

    if (!nextCart) nextCart = await getCurrentCart();
    hydrateCart(nextCart);
    return nextCart;
  }

  async function redirectToHostedCheckout() {
    if (hasLocalItems) {
      const formData = new FormData();
      formData.append("items", JSON.stringify(localItems));
      formData.append("billing_address", JSON.stringify(billingAddress));
      formData.append(
        "shipping_address",
        JSON.stringify(sameAsBilling ? billingAddress : shippingAddress),
      );
      formData.append("customer_note", orderNotes);

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

    await updateCartCustomer({
      billing_address: billingAddress,
      shipping_address: sameAsBilling ? billingAddress : shippingAddress,
    });
    window.location.href = getHostedCheckoutUrl();
  }

  function findWooCartItemForLocalItem(localItem: LocalCartItem) {
    const checkoutId = Number(localItem.variationId || localItem.productId);
    return cart?.items.find((item) => item.id === checkoutId) || null;
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

  async function handleCheckoutSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === "cart") {
      await handleProceedToPayment();
      return;
    }

    if (!cart?.items.length) {
      setError(
        "WooCommerce does not have these cart items yet. Refresh and try again.",
      );
      return;
    }

    if (cart.needs_shipping && !selectedShippingRates.length) {
      setError("Select pickup or delivery before placing the order.");
      return;
    }

    setIsBusy(true);
    setError("");
    try {
      await redirectToHostedCheckout();
    } catch (checkoutError) {
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
      <form onSubmit={handleCheckoutSubmit} className="mx-auto max-w-6xl">
        <CheckoutProgress step={step} />

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
            <AlertCircle className="mb-2" size={18} />
            {error}
          </div>
        ) : null}

        {step === "cart" ? (
          <CartStep
            cart={cart}
            localItems={localItems}
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
        ) : (
          <PaymentStep
            cart={cart}
            localItems={localItems}
            hasLocalItems={hasLocalItems}
            isBusy={isBusy}
            billingAddress={billingAddress}
            shippingAddress={shippingAddress}
            sameAsBilling={sameAsBilling}
            orderNotes={orderNotes}
            paymentMethod={paymentMethod}
            availablePaymentMethods={availablePaymentMethods}
            subtotal={subtotal}
            total={total}
            onBack={() => setStep("cart")}
            onAddressChange={updateAddress}
            onAddressBlur={handleAddressBlur}
            onSameAsBillingChange={setSameAsBilling}
            onOrderNotesChange={setOrderNotes}
            onPaymentMethodChange={setPaymentMethod}
            onMutateCart={mutateCart}
          />
        )}
      </form>

      {previewArtwork ? (
        <ArtworkModal artwork={previewArtwork} onClose={closeArtworkPreview} />
      ) : null}
      {isRedirecting ? <CheckoutLoadingOverlay /> : null}
    </main>
  );
}

function CheckoutProgress({ step }: { step: CheckoutStep }) {
  const items = [
    ["cart", "Shopping Cart"],
    ["payment", "Payment & Delivery Options"],
    ["received", "Order Received"],
  ] as const;

  return (
    <div className="mb-14 flex flex-wrap items-center justify-center gap-7 text-sm font-semibold text-neutral-950">
      {items.map(([key, label], index) => {
        const active = key === step;
        const done = step === "payment" && key === "cart";
        return (
          <div key={key} className="flex items-center gap-4">
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                active || done
                  ? "bg-pink-500 text-white"
                  : "bg-neutral-950 text-white"
              }`}
            >
              {done ? <Check size={14} /> : index + 1}
            </span>
            <span>{label}</span>
            {index < items.length - 1 ? (
              <ArrowRight size={16} className="text-neutral-300" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function CartStep(props: {
  cart: WooCart | null;
  localItems: LocalCartItem[];
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
  const wooItems = props.cart?.items || [];
  const isEmpty = props.hasLocalItems
    ? !props.localItems.length
    : !wooItems.length;

  return (
    <div className="grid gap-10">
      <section className="overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_120px_160px_120px_80px] bg-neutral-100 px-6 py-5 text-sm font-semibold text-neutral-900 max-lg:hidden">
          <span>Product</span>
          <span>Price</span>
          <span>Quantity</span>
          <span>Subtotal</span>
          <span>Remove</span>
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
            props.localItems.map((item) => (
              <LocalCartRow key={item.id} item={item} {...props} />
            ))
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
  isBusy,
  onRemoveLocalItem,
  onUpdateLocalQuantity,
  onPreviewArtwork,
  getArtworkFile,
}: {
  item: LocalCartItem;
  isBusy: boolean;
  onRemoveLocalItem: (item: LocalCartItem) => void;
  onUpdateLocalQuantity: (id: string, quantity: number) => void;
  onPreviewArtwork: (item: LocalCartItem) => void;
  getArtworkFile: (id: string) => File | null;
}) {
  const artworkFile = getArtworkFile(item.id);
  const lineTotal = item.totalPrice * item.cartQuantity;

  return (
    <article className="grid items-center gap-5 py-7 lg:grid-cols-[minmax(0,1fr)_120px_160px_120px_80px]">
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
      <span className="text-sm font-medium">
        {formatCurrency(item.totalPrice, item.currencySymbol || "$")}
      </span>
      <QuantityControl
        value={item.cartQuantity}
        disabled={isBusy}
        onChange={(quantity) => onUpdateLocalQuantity(item.id, quantity)}
      />
      <span className="text-sm font-semibold">
        {formatCurrency(lineTotal, item.currencySymbol || "$")}
      </span>
      <button
        type="button"
        onClick={() => onRemoveLocalItem(item)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
        aria-label={`Remove ${item.name}`}
      >
        <X size={18} />
      </button>
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
    <article className="grid items-center gap-5 py-7 lg:grid-cols-[minmax(0,1fr)_120px_160px_120px_80px]">
      <ProductCell
        image={item.images[0]?.thumbnail || item.images[0]?.src}
        title={item.name}
        subtitle={item.variation.map((entry) => entry.value).join(" / ")}
      >
        <p className="mt-1 text-xs text-neutral-500">
          Files Upload: {wooArtworkName(item) || "Not uploaded"}
        </p>
      </ProductCell>
      <span className="text-sm font-medium">
        {money(item.prices.price, cart)}
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
      <span className="text-sm font-semibold">
        {money(item.totals.line_total, cart)}
      </span>
      <button
        type="button"
        onClick={() => onMutateCart(() => removeCartItem(item.key))}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
        aria-label={`Remove ${item.name}`}
      >
        <X size={18} />
      </button>
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

function PaymentStep(props: {
  cart: WooCart | null;
  localItems: LocalCartItem[];
  hasLocalItems: boolean;
  isBusy: boolean;
  billingAddress: WooAddress;
  shippingAddress: WooAddress;
  sameAsBilling: boolean;
  orderNotes: string;
  paymentMethod: string;
  availablePaymentMethods: string[];
  subtotal: string;
  total: string;
  onBack: () => void;
  onAddressChange: (
    type: "billing" | "shipping",
    field: keyof WooAddress,
    value: string,
  ) => void;
  onAddressBlur: () => void;
  onSameAsBillingChange: (checked: boolean) => void;
  onOrderNotesChange: (value: string) => void;
  onPaymentMethodChange: (method: string) => void;
  onMutateCart: (action: () => Promise<WooCart>) => void;
}) {
  const orderItems = props.hasLocalItems
    ? props.localItems
    : props.cart?.items || [];

  return (
    <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_520px]">
      <section>
        <button
          type="button"
          onClick={props.onBack}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-neutral-600"
        >
          <ArrowLeft size={16} />
          Back to cart
        </button>
        <h1 className="mb-8 text-3xl font-semibold">Billing details</h1>
        <AddressFields
          address={props.billingAddress}
          includeEmail
          onChange={(field, value) =>
            props.onAddressChange("billing", field, value)
          }
          onBlur={props.onAddressBlur}
        />
        <label className="mt-8 flex items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={!props.sameAsBilling}
            onChange={(event) =>
              props.onSameAsBillingChange(!event.target.checked)
            }
          />
          Ship to a different address?
        </label>
        {!props.sameAsBilling ? (
          <div className="mt-8">
            <AddressFields
              address={props.shippingAddress}
              onChange={(field, value) =>
                props.onAddressChange("shipping", field, value)
              }
              onBlur={props.onAddressBlur}
            />
          </div>
        ) : null}
        <label className="mt-8 block text-sm font-semibold">
          Order notes (optional)
          <textarea
            value={props.orderNotes}
            onChange={(event) => props.onOrderNotesChange(event.target.value)}
            placeholder="Notes about your order, e.g. special notes for delivery."
            className="mt-3 min-h-32 w-full border-b border-neutral-300 bg-transparent py-3 text-sm outline-none focus:border-pink-500"
          />
        </label>
      </section>

      <aside className="space-y-8">
        <section>
          <h2 className="mb-8 text-3xl font-semibold">Your order</h2>
          <div className="rounded-lg bg-neutral-100 p-8">
            <div className="divide-y divide-neutral-300">
              {orderItems.map((item) => {
                const local = "cartQuantity" in item;
                return (
                  <div
                    key={local ? item.id : item.key}
                    className="flex justify-between gap-6 py-4 text-sm"
                  >
                    <div>
                      <p className="font-semibold">
                        {item.name} x{" "}
                        {local ? item.cartQuantity : item.quantity}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Files Upload:{" "}
                        {local
                          ? item.artworkName || "Not uploaded"
                          : wooArtworkName(item)}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {local
                        ? formatCurrency(
                            item.totalPrice * item.cartQuantity,
                            item.currencySymbol || "$",
                          )
                        : money(item.totals.line_total, props.cart)}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 divide-y divide-neutral-300 text-sm">
              <TotalLine label="Subtotal" value={props.subtotal} />
              <div className="grid grid-cols-[1fr_1.25fr] gap-4 py-5">
                <span className="font-semibold">Shipment</span>
                <ShippingMethods
                  cart={props.cart}
                  onMutateCart={props.onMutateCart}
                />
              </div>
              <TotalLine
                label="State Sales Tax"
                value={money(props.cart?.totals.total_tax, props.cart)}
              />
              <TotalLine label="Total" value={props.total} strong />
            </div>
          </div>
        </section>

        <PaymentBox
          paymentMethod={props.paymentMethod}
          availablePaymentMethods={props.availablePaymentMethods}
          isBusy={props.isBusy}
          onPaymentMethodChange={props.onPaymentMethodChange}
        />
      </aside>
    </div>
  );
}

function AddressFields({
  address,
  includeEmail = false,
  onChange,
  onBlur,
}: {
  address: WooAddress;
  includeEmail?: boolean;
  onChange: (field: keyof WooAddress, value: string) => void;
  onBlur: () => void;
}) {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {includeEmail ? (
        <Field
          className="sm:col-span-2"
          label="Email address"
          type="email"
          value={address.email || ""}
          onChange={(value) => onChange("email", value)}
          onBlur={onBlur}
          required
        />
      ) : null}
      <Field
        label="First name"
        value={address.first_name}
        onChange={(value) => onChange("first_name", value)}
        onBlur={onBlur}
        required
      />
      <Field
        label="Last name"
        value={address.last_name}
        onChange={(value) => onChange("last_name", value)}
        onBlur={onBlur}
        required
      />
      <Field
        className="sm:col-span-2"
        label="Country / Region"
        value={address.country}
        onChange={(value) => onChange("country", value)}
        onBlur={onBlur}
        required
      />
      <Field
        className="sm:col-span-2"
        label="Street address"
        value={address.address_1}
        onChange={(value) => onChange("address_1", value)}
        onBlur={onBlur}
        required
      />
      <Field
        className="sm:col-span-2"
        label="Apartment, suite, unit, etc. (optional)"
        value={address.address_2}
        onChange={(value) => onChange("address_2", value)}
        onBlur={onBlur}
      />
      <Field
        className="sm:col-span-2"
        label="Town / City"
        value={address.city}
        onChange={(value) => onChange("city", value)}
        onBlur={onBlur}
        required
      />
      <Field
        className="sm:col-span-2"
        label="State"
        value={address.state}
        onChange={(value) => onChange("state", value)}
        onBlur={onBlur}
        required
      />
      <Field
        className="sm:col-span-2"
        label="ZIP Code"
        value={address.postcode}
        onChange={(value) => onChange("postcode", value)}
        onBlur={onBlur}
        required
      />
      <Field
        className="sm:col-span-2"
        label="Phone (optional)"
        type="tel"
        value={address.phone}
        onChange={(value) => onChange("phone", value)}
        onBlur={onBlur}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  required = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-semibold ${className}`}>
      {label} {required ? <span className="text-red-500">*</span> : null}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="mt-4 h-10 w-full border-0 border-b border-neutral-300 bg-transparent px-0 text-sm font-normal outline-none focus:border-pink-500"
      />
    </label>
  );
}

function ShippingMethods({
  cart,
  onMutateCart,
}: {
  cart: WooCart | null;
  onMutateCart: (action: () => Promise<WooCart>) => void;
}) {
  if (!cart?.shipping_rates.length) {
    return (
      <p className="text-neutral-500">
        Enter your address to calculate delivery or pickup.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {cart.shipping_rates.map((shippingPackage) =>
        shippingPackage.shipping_rates.map((rate) => (
          <label
            key={`${shippingPackage.package_id}-${rate.rate_id}`}
            className="flex items-center justify-end gap-2"
          >
            <input
              type="radio"
              name={`shipping-${shippingPackage.package_id}`}
              checked={rate.selected}
              onChange={() =>
                onMutateCart(() =>
                  selectShippingRate(rate.rate_id, shippingPackage.package_id),
                )
              }
            />
            <span>
              <span className="font-semibold">{shippingMethodLabel(rate)}</span>
            </span>
          </label>
        )),
      )}
    </div>
  );
}

function PaymentBox({
  paymentMethod,
  availablePaymentMethods,
  isBusy,
  onPaymentMethodChange,
}: {
  paymentMethod: string;
  availablePaymentMethods: string[];
  isBusy: boolean;
  onPaymentMethodChange: (method: string) => void;
}) {
  return (
    <section>
      <h2 className="mb-8 text-3xl font-semibold">Payment</h2>
      <div className="rounded-lg bg-neutral-100 p-8">
        <div className="space-y-4">
          {availablePaymentMethods.length ? (
            availablePaymentMethods.map((method) => (
              <label
                key={method}
                className="flex items-center gap-3 text-sm font-semibold"
              >
                <input
                  type="radio"
                  name="payment_method"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(event) =>
                    onPaymentMethodChange(event.target.value)
                  }
                />
                {gatewayLabels[method] || method}
              </label>
            ))
          ) : (
            <p className="text-sm text-neutral-500">
              Payment methods will load from WooCommerce after the cart syncs.
            </p>
          )}
        </div>

        <div className="mt-5 rounded-md bg-white p-5 text-sm leading-6 text-neutral-600">
          Card and PayPal details are entered on the secure WooCommerce payment
          page after you continue.
        </div>

        <p className="mt-6 text-xs leading-5 text-neutral-500">
          Your personal data will be used to process your order and support your
          experience throughout this website.
        </p>
        <button
          type="submit"
          disabled={isBusy}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-pink-500 px-10 text-sm font-semibold text-white transition hover:bg-pink-600 disabled:bg-pink-200"
        >
          Continue to secure payment
        </button>
      </div>
    </section>
  );
}

function TotalLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-5 py-5 ${strong ? "font-semibold text-pink-500" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
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
          Hang tight, print magic in motion.
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
