"use client"

import Image from "next/image"
import Link from "next/link"
import { AlertCircle, ArrowRight, CheckCircle2, CreditCard, LockKeyhole, Trash2 } from "lucide-react"

import { useCart } from "@/component/product/CartContext"
import { formatCurrency } from "@/component/product/productHelpers"

const storeUrl = process.env.NEXT_PUBLIC_WC_URL

function normalizeStoreUrl() {
	if (!storeUrl) return null

	try {
		return new URL(storeUrl)
	} catch {
		return null
	}
}

function normalizeAttributeName(attribute) {
	const name = attribute?.slug || attribute?.name || ""
	return name
		.toLowerCase()
		.trim()
		.replace(/^pa_/, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}

function buildWooCheckoutUrl(item) {
	const base = normalizeStoreUrl()

	if (!base || !item?.productId) return ""

	const checkoutUrl = new URL("/checkout/", base)
	checkoutUrl.searchParams.set("add-to-cart", String(item.productId))
	checkoutUrl.searchParams.set("quantity", String(Math.max(1, Number(item.cartQuantity) || 1)))

	if (item.variationId) {
		checkoutUrl.searchParams.set("variation_id", String(item.variationId))
	}

	if (Array.isArray(item.variationAttributes)) {
		item.variationAttributes.forEach((attribute) => {
			const attributeName = normalizeAttributeName(attribute)
			if (attributeName && attribute.option) {
				checkoutUrl.searchParams.set(`attribute_${attributeName}`, attribute.option)
			}
		})
	}

	return checkoutUrl.toString()
}

function itemDescription(item) {
	const details = [`${item.selectedQuantity || 1} units`]

	if (item.cartQuantity > 1) {
		details.push(`${item.cartQuantity} packs`)
	}

	if (item.artworkName) {
		details.push(`Artwork: ${item.artworkName}`)
	}

	return details.join(" | ")
}

export default function CheckoutPage() {
	const { items, itemCount, subtotal, removeItem, clearCart } = useCart()
	const currencySymbol = items[0]?.currencySymbol || "$"
	const firstCheckoutUrl = items.length === 1 ? buildWooCheckoutUrl(items[0]) : ""
	const hasStoreUrl = Boolean(normalizeStoreUrl())

	return (
		<main className="bg-neutral-50 px-6 py-12 md:px-10 lg:px-16">
			<div className="mx-auto max-w-7xl">
				<div className="mb-8 flex flex-wrap items-center justify-between gap-4">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.22em] text-pink-500">Checkout</p>
						<h1 className="mt-2 text-3xl font-semibold text-neutral-950 sm:text-4xl md:text-5xl">Review your order</h1>
						<p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600">
							Payments are completed securely in your existing WooCommerce checkout with Stripe.
						</p>
					</div>
					<Link href="/products" className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-100">
						Keep shopping
					</Link>
				</div>

				<div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start xl:grid-cols-[minmax(0,1fr)_420px]">
					<section className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
						<div className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-5">
							<div>
								<h2 className="text-xl font-semibold text-neutral-950">Cart items</h2>
								<p className="mt-1 text-sm text-neutral-500">{itemCount ? `${itemCount} item${itemCount > 1 ? "s" : ""} ready for checkout` : "Your cart is empty."}</p>
							</div>
							{items.length ? (
								<button type="button" onClick={clearCart} className="inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200 px-4 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50">
									<Trash2 size={16} />
									Clear
								</button>
							) : null}
						</div>

						{items.length ? (
							<div className="divide-y divide-neutral-100">
								{items.map((item) => {
									const checkoutUrl = buildWooCheckoutUrl(item)

									return (
										<article key={item.id} className="grid gap-4 py-5 md:grid-cols-[96px_minmax(0,1fr)_auto] md:items-center">
											<div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-neutral-100">
												{item.image ? <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" /> : null}
											</div>
											<div>
												<Link href={item.productUrl || "/products"} className="text-lg font-semibold text-neutral-950 transition hover:text-pink-500">
													{item.name}
												</Link>
												<p className="mt-1 text-sm text-neutral-500">{itemDescription(item)}</p>
												<p className="mt-2 text-sm text-neutral-500">Per unit: {formatCurrency(item.unitPrice, item.currencySymbol)}</p>
												{item.variationId ? <p className="mt-1 text-xs text-neutral-400">WooCommerce variation #{item.variationId}</p> : null}
											</div>
											<div className="flex flex-col gap-3 md:items-end">
												<p className="text-lg font-semibold text-neutral-950">{formatCurrency(item.totalPrice * item.cartQuantity, "$")}</p>
												<div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
													{checkoutUrl ? (
														<a href={checkoutUrl} className="inline-flex h-10 items-center justify-center rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-pink-500">
															Checkout item
														</a>
													) : null}
													<button type="button" onClick={() => removeItem(item.id)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50">
														<Trash2 size={16} />
													</button>
												</div>
											</div>
										</article>
									)
								})}
							</div>
						) : (
							<div className="py-16 text-center">
								<p className="text-neutral-500">Add products to your cart before checkout.</p>
								<Link href="/products" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-pink-500">
									Browse products
								</Link>
							</div>
						)}
					</section>

					<aside className="space-y-4">
						<div className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
							<h2 className="text-xl font-semibold text-neutral-950">Order summary</h2>
							<div className="mt-5 space-y-3 text-sm">
								<div className="flex items-center justify-between text-neutral-600">
									<span>Subtotal</span>
									<span className="font-semibold text-neutral-950">{formatCurrency(subtotal, "$")}</span>
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
									<span className="font-semibold text-neutral-950">Estimated total</span>
									<span className="text-2xl font-semibold text-neutral-950">{formatCurrency(subtotal, "$")}</span>
								</div>
							</div>

							{items.length === 1 && firstCheckoutUrl ? (
								<a href={firstCheckoutUrl} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-pink-500 px-5 text-sm font-semibold text-white transition hover:bg-pink-600">
									Continue to secure checkout
									<ArrowRight size={18} />
								</a>
							) : (
								<button type="button" disabled className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-200 px-5 text-sm font-semibold text-neutral-500">
									Continue to secure checkout
									<ArrowRight size={18} />
								</button>
							)}

							{!hasStoreUrl ? (
								<div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
									<AlertCircle className="mb-2" size={18} />
									Set NEXT_PUBLIC_WC_URL in .env.local so checkout can redirect to WooCommerce.
								</div>
							) : null}

							{items.length > 1 ? (
								<div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
									<AlertCircle className="mb-2" size={18} />
									Use the per-item checkout buttons for now. WooCommerce needs a shared cart session or a small WordPress endpoint before this frontend can send multiple items in one checkout handoff.
								</div>
							) : null}
						</div>

						<div className="rounded-[1.75rem] border border-neutral-200 bg-white p-5">
							<div className="flex gap-3">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white">
									<CreditCard size={18} />
								</div>
								<div>
									<h3 className="font-semibold text-neutral-950">Stripe stays in WordPress</h3>
									<p className="mt-1 text-sm leading-6 text-neutral-500">Card details, coupons, shipping, tax, order emails, and payment status continue through WooCommerce.</p>
								</div>
							</div>
							<div className="mt-4 flex gap-3">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
									<LockKeyhole size={18} />
								</div>
								<div>
									<h3 className="font-semibold text-neutral-950">Secure handoff</h3>
									<p className="mt-1 text-sm leading-6 text-neutral-500">The button opens your WordPress checkout with the selected WooCommerce product already added.</p>
								</div>
							</div>
							<div className="mt-4 flex gap-3">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-600">
									<CheckCircle2 size={18} />
								</div>
								<div>
									<h3 className="font-semibold text-neutral-950">Next step</h3>
									<p className="mt-1 text-sm leading-6 text-neutral-500">For full multi-item checkout, add a tiny WooCommerce helper endpoint that accepts this cart and creates the session server-side.</p>
								</div>
							</div>
						</div>
					</aside>
				</div>
			</div>
		</main>
	)
}
