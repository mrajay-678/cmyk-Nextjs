"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, RefreshCw, Trash2 } from "lucide-react";

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
    <main className="bg-neutral-50 px-4 py-10 sm:px-6 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-pink-500">
              Cart
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-neutral-950 sm:text-4xl">
              Your WooCommerce cart
            </h1>
          </div>
          <button
            type="button"
            onClick={refreshCart}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        ) : null}

        <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5">
          {!cart ? (
            <p className="text-sm text-neutral-500">Loading cart...</p>
          ) : cart.items.length ? (
            <>
              <div className="divide-y divide-neutral-100">
                {cart.items.map((item) => (
                  <article
                    key={item.key}
                    className="grid gap-4 py-5 sm:grid-cols-[84px_minmax(0,1fr)_auto]"
                  >
                    <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-neutral-100">
                      {item.images[0]?.thumbnail || item.images[0]?.src ? (
                        <Image
                          src={item.images[0].thumbnail || item.images[0].src}
                          alt={item.images[0].alt || item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div>
                      <h2 className="font-semibold text-neutral-950">{item.name}</h2>
                      {item.item_data.length ? (
                        <div className="mt-2 space-y-1 text-xs text-neutral-500">
                          {item.item_data.map((entry) => (
                            <p key={`${item.key}-${entry.name}`}>
                              {entry.name}: {entry.display || entry.value}
                            </p>
                          ))}
                        </div>
                      ) : null}
                      <p className="mt-2 text-sm text-neutral-500">
                        {money(item.totals.line_total, cart)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isBusy || item.quantity <= item.quantity_limits.minimum}
                        onClick={() =>
                          mutateCart(() =>
                            updateCartItemQuantity(item.key, item.quantity - 1),
                          )
                        }
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">
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
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => mutateCart(() => removeCartItem(item.key))}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-100 pt-5">
                <p className="text-lg font-semibold text-neutral-950">
                  Total: {money(cart.totals.total_price, cart)}
                </p>
                <Link
                  href="/checkout"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-pink-500 px-5 text-sm font-semibold text-white"
                >
                  Checkout
                </Link>
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
        </div>
      </div>
    </main>
  );
}
