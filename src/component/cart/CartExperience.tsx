"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2, X } from "lucide-react";

import {
  getCurrentCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/woocommerce/cart";
import type { WooCart } from "@/lib/woocommerce/types";

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

export default function CartExperience() {
  const [cart, setCart] = useState<WooCart | null>(null);
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function refreshCart() {
    setIsBusy(true);
    setError("");
    try {
      setCart(await getCurrentCart());
    } catch (cartError) {
      setError(cartError instanceof Error ? cartError.message : "Unable to load cart.");
    } finally {
      setIsBusy(false);
    }
  }

  async function mutateCart(action: () => Promise<WooCart>) {
    setIsBusy(true);
    setError("");
    try {
      setCart(await action());
    } catch (cartError) {
      setError(cartError instanceof Error ? cartError.message : "Unable to update cart.");
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    window.queueMicrotask(refreshCart);
  }, []);

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
          ) : cart.items.length ? (
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
                {cart.items.map((item) => (
                  <article
                    key={item.key}
                    className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)] md:grid md:gap-4 md:rounded-none md:border-0 md:p-0 md:py-7 md:shadow-none md:grid-cols-[minmax(320px,1fr)_130px_130px_130px_80px] md:items-center md:px-6"
                  >
                    <div className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] gap-4 md:grid-cols-[78px_minmax(0,1fr)] md:gap-5">
                      <div className="relative h-[76px] w-[76px] overflow-hidden rounded-md bg-neutral-100 md:h-[78px] md:w-[78px]">
                        {item.images[0]?.thumbnail || item.images[0]?.src ? (
                          <Image
                            src={item.images[0].thumbnail || item.images[0].src}
                            alt={item.images[0].alt || item.name}
                            fill
                            sizes="78px"
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
                            {item.variation.map((entry) => entry.value).join(", ")}
                          </p>
                        ) : null}
                        {item.item_data.length ? (
                          <div className="mt-1 space-y-1 text-xs text-neutral-500">
                            {item.item_data.map((entry, index) => (
                              <p key={`${item.key}-${entry.name}-${index}`}>
                                {entry.name}: {entry.display || entry.value}
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
                      <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white">
                      <button
                        type="button"
                        disabled={isBusy || item.quantity <= item.quantity_limits.minimum}
                        onClick={() =>
                          mutateCart(() =>
                            updateCartItemQuantity(item.key, item.quantity - 1),
                          )
                        }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 disabled:text-neutral-300"
                      >
                        <Minus size={16} />
                      </button>
                        <span className="w-10 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={isBusy || item.quantity >= item.quantity_limits.maximum}
                        onClick={() =>
                          mutateCart(() =>
                            updateCartItemQuantity(item.key, item.quantity + 1),
                          )
                        }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 disabled:text-neutral-300"
                      >
                        <Plus size={16} />
                      </button>
                      </div>
                    </div>

                    <p className="mt-3 flex items-center justify-between text-sm font-semibold text-neutral-950 md:mt-0 md:block md:text-center">
                      <span className="text-xs font-semibold uppercase text-neutral-400 md:hidden">
                        Per Unit
                      </span>
                      {unitMoney(item, cart)}
                    </p>

                    <p className="mt-3 flex items-center justify-between text-sm font-semibold text-neutral-950 md:mt-0 md:block md:text-center">
                      <span className="text-xs font-semibold uppercase text-neutral-400 md:hidden">
                        Subtotal
                      </span>
                      {money(item.totals.line_total, cart)}
                    </p>

                    <div className="mt-4 flex justify-end border-t border-neutral-100 pt-3 md:mt-0 md:border-0 md:pt-0 md:justify-center">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => mutateCart(() => removeCartItem(item.key))}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-950 disabled:text-neutral-200"
                        aria-label={`Remove ${item.name}`}
                      >
                        <X className="hidden md:block" size={18} />
                        <Trash2 className="md:hidden" size={17} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              </section>

              <aside className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] lg:mt-32">
                <h2 className="font-heading text-2xl font-bold text-neutral-950">
                  Checkout total
                </h2>
                <div className="mt-7 border-t border-neutral-200 pt-7">
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-sm text-neutral-600">Product total</span>
                    <span className="text-2xl font-medium text-neutral-950">
                      {money(cart.totals.total_price, cart)}
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
        </div>
      </div>
    </main>
  );
}
