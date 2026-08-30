"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { getOrder } from "@/lib/woocommerce/checkout";

function formatTotal(order) {
  if (order?.totals?.total_price) {
    const minorUnit = order.totals.currency_minor_unit || 2;
    const amount = Number.parseInt(order.totals.total_price || "0", 10) / 10 ** minorUnit;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: order.totals.currency_code || "USD",
    }).format(amount);
  }

  return order?.total || "";
}

export default function OrderReceived({ orderId, orderKey }) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    getOrder(orderId, orderKey)
      .then((nextOrder) => {
        if (isMounted) setOrder(nextOrder);
      })
      .catch((orderError) => {
        if (isMounted) {
          setError(
            orderError instanceof Error
              ? orderError.message
              : "Unable to load this order.",
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [orderId, orderKey]);

  if (error) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-red-200 bg-red-50 p-8 text-red-900">
          {error}
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-neutral-200 bg-white p-8">
          Loading order...
        </div>
      </main>
    );
  }

  return (
    <main className="bg-neutral-50 px-4 py-10 sm:px-6 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <CheckCircle2 className="text-emerald-600" size={34} />
          <h1 className="mt-4 text-3xl font-semibold text-neutral-950">
            Order received
          </h1>
          <p className="mt-2 text-neutral-600">
            Thanks. WooCommerce created and owns this order.
          </p>

          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <Summary label="Order number" value={order.number || `#${order.id}`} />
            <Summary label="Order status" value={order.status} />
            <Summary label="Total" value={formatTotal(order)} />
            <Summary label="Customer email" value={order.billing_address?.email || ""} />
            <Summary label="Payment status" value={order.payment_status || order.status} />
          </div>

          <div className="mt-8 divide-y divide-neutral-100">
            {order.items?.map((item) => (
              <article key={item.key || item.id} className="grid gap-4 py-5 sm:grid-cols-[72px_1fr_auto]">
                <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-neutral-100">
                  {item.images?.[0]?.thumbnail || item.images?.[0]?.src ? (
                    <Image
                      src={item.images[0].thumbnail || item.images[0].src}
                      alt={item.images[0].alt || item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <h2 className="font-semibold text-neutral-950">{item.name}</h2>
                  <p className="mt-1 text-sm text-neutral-500">Quantity: {item.quantity}</p>
                  {item.item_data?.length ? (
                    <div className="mt-2 space-y-1 text-xs text-neutral-500">
                      {item.item_data.map((entry) => (
                        <p key={`${item.key}-${entry.name}`}>
                          {entry.name}: {entry.display || entry.value}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <Link
            href="/products"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-pink-500"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
        {label}
      </p>
      <p className="mt-2 break-words font-semibold text-neutral-950">
        {value || "Not available"}
      </p>
    </div>
  );
}
