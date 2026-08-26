"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  PackageCheck,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { useCart } from "@/component/product/CartContext";
import { formatCurrency } from "@/component/product/productHelpers";

const storeUrl = process.env.NEXT_PUBLIC_WC_URL;

function normalizeStoreUrl() {
  if (!storeUrl) return null;

  try {
    return new URL(storeUrl);
  } catch {
    return null;
  }
}

async function addAllItemsToWooCart(items) {
  try {
    const response = await fetch("/api/checkout/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to add items to cart:", errorData.error);
      return null;
    }

    const data = await response.json();
    return data.checkoutUrl;
  } catch (error) {
    console.error("Error adding items to WooCommerce cart:", error);
    return null;
  }
}

function itemDescription(item) {
  const details = [`${item.selectedQuantity || 1} units`];

  if (item.cartQuantity > 1) {
    details.push(`${item.cartQuantity} packs`);
  }

  if (item.artworkName) {
    details.push(`Artwork: ${item.artworkName}`);
  }

  return details.join(" | ");
}

export default function CheckoutPage() {
  const { items, itemCount, subtotal, removeItem, clearCart } = useCart();
  const currencySymbol = items[0]?.currencySymbol || "$";
  const hasStoreUrl = Boolean(normalizeStoreUrl());
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const handleCheckout = async () => {
    if (!items.length || !hasStoreUrl) return;

    setIsRedirecting(true);
    setCheckoutError(null);

    try {
      const checkoutUrl = await addAllItemsToWooCart(items);

      if (checkoutUrl) {
        clearCart();
        window.location.href = checkoutUrl;
      } else {
        setCheckoutError("Failed to add items to cart. Please try again.");
        setIsRedirecting(false);
      }
    } catch {
      setCheckoutError("An error occurred during checkout. Please try again.");
      setIsRedirecting(false);
    }
  };

  return (
    <main className="bg-neutral-50 px-6 py-12 md:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-pink-500">
              Checkout
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-neutral-950 sm:text-4xl md:text-5xl">
              Review your order
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600">
              Review your print items here, then move straight into your
              WooCommerce checkout with the cart already prepared.
            </p>
            <div className="mt-5 grid max-w-3xl gap-3 text-sm text-neutral-600 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <PackageCheck size={18} className="text-pink-500" />
                Cart synced to WooCommerce
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-pink-500" />
                Secure payment handoff
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck size={18} className="text-pink-500" />
                Taxes calculated there
              </div>
            </div>
          </div>
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-100"
          >
            Keep shopping
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-5">
              <div>
                <h2 className="text-xl font-semibold text-neutral-950">
                  Cart items
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {itemCount
                    ? `${itemCount} item${itemCount > 1 ? "s" : ""} ready for checkout`
                    : "Your cart is empty."}
                </p>
              </div>
              {items.length ? (
                <button
                  type="button"
                  onClick={clearCart}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200 px-4 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
                >
                  <Trash2 size={16} />
                  Clear
                </button>
              ) : null}
            </div>

            {items.length ? (
              <div className="divide-y divide-neutral-100">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="grid gap-4 py-5 md:grid-cols-[96px_minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-neutral-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div>
                      <Link
                        href={item.productUrl || "/products"}
                        className="text-lg font-semibold text-neutral-950 transition hover:text-pink-500"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm text-neutral-500">
                        {itemDescription(item)}
                      </p>
                      <p className="mt-2 text-sm text-neutral-500">
                        Per unit:{" "}
                        {formatCurrency(item.unitPrice, currencySymbol)}
                      </p>
                      {item.variationId ? (
                        <p className="mt-1 text-xs text-neutral-400">
                          WooCommerce variation #{item.variationId}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-3 md:items-end">
                      <p className="text-lg font-semibold text-neutral-950">
                        {formatCurrency(
                          item.totalPrice * item.cartQuantity,
                          currencySymbol,
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-neutral-500">
                  Add products to your cart before checkout.
                </p>
                <Link
                  href="/products"
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-pink-500"
                >
                  Browse products
                </Link>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <h2 className="text-xl font-semibold text-neutral-950">
                Order summary
              </h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-950">
                    {formatCurrency(subtotal, currencySymbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Shipping</span>
                  <span>Calculated in WooCommerce</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Tax</span>
                  <span>Calculated in WooCommerce</span>
                </div>
              </div>
              <div className="mt-5 border-t border-neutral-100 pt-5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-950">
                    Estimated total
                  </span>
                  <span className="text-2xl font-semibold text-neutral-950">
                    {formatCurrency(subtotal, currencySymbol)}
                  </span>
                </div>
              </div>

              {items.length > 0 ? (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isRedirecting || !hasStoreUrl}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-pink-500 px-5 text-sm font-semibold text-white transition hover:bg-pink-600 disabled:bg-neutral-200 disabled:text-neutral-500"
                >
                  {isRedirecting ? (
                    "Redirecting to checkout..."
                  ) : (
                    <>
                      Continue to secure checkout
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-200 px-5 text-sm font-semibold text-neutral-500"
                >
                  Continue to secure checkout
                  <ArrowRight size={18} />
                </button>
              )}

              {checkoutError ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
                  <AlertCircle className="mb-2" size={18} />
                  {checkoutError}
                </div>
              ) : null}

              {!hasStoreUrl ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  <AlertCircle className="mb-2" size={18} />
                  Set NEXT_PUBLIC_WC_URL in .env.local so checkout can redirect
                  to WooCommerce.
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
