"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Trash2, X } from "lucide-react"

import { formatCurrency } from "../product/productHelpers"
import { useCart } from "../product/CartContext"
import { useState } from "react"

export default function CartButton() {
	const { items, itemCount, subtotal, removeItem, clearCart } = useCart()
	const [isOpen, setIsOpen] = useState(false)

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setIsOpen((open) => !open)}
				className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50"
				aria-label="Open cart"
			>
				<ShoppingCart size={20} />
				{itemCount ? (
					<span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1 text-xs font-semibold text-white">
						{itemCount}
					</span>
				) : null}
			</button>

			{isOpen ? (
				<div className="fixed inset-x-3 top-24 z-50 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:absolute sm:inset-auto sm:right-0 sm:top-16 sm:w-[24rem] sm:p-5">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-lg font-semibold text-neutral-950">Cart</p>
							<p className="text-sm text-neutral-500">{itemCount ? `${itemCount} item${itemCount > 1 ? "s" : ""} added` : "Your cart is empty."}</p>
						</div>
						<button type="button" onClick={() => setIsOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50">
							<X size={18} />
						</button>
					</div>

					{items.length ? (
						<>
							<div className="mt-5 max-h-96 space-y-3 overflow-y-auto pr-1">
								{items.map((item) => (
									<div key={item.id} className="rounded-[1.25rem] border border-neutral-200 bg-neutral-50 p-4">
										<div className="flex items-start justify-between gap-4">
											<div className="flex gap-3">
												<div className="relative h-16 w-16 overflow-hidden rounded-[1rem] bg-white">
													{item.image ? <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" /> : null}
												</div>
												<div className="space-y-1">
													<Link href={item.productUrl} onClick={() => setIsOpen(false)} className="font-medium text-neutral-950 transition hover:text-pink-500">
														{item.name}
													</Link>
													<p className="text-sm text-neutral-500">
														{item.selectedQuantity} units x {item.cartQuantity}
													</p>
													<p className="text-sm text-neutral-500">Per unit: {formatCurrency(item.unitPrice, item.currencySymbol)}</p>
													{item.artworkName ? <p className="text-sm text-neutral-500">Artwork: {item.artworkName}</p> : null}
												</div>
											</div>
											<button type="button" onClick={() => removeItem(item.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-neutral-300 hover:bg-white hover:text-neutral-800">
												<Trash2 size={16} />
											</button>
										</div>
										<p className="mt-3 text-sm font-semibold text-neutral-950">
											Line total: {formatCurrency(item.totalPrice * item.cartQuantity, item.currencySymbol)}
										</p>
									</div>
								))}
							</div>

							<div className="mt-5 rounded-[1.25rem] bg-neutral-950 p-4 text-white">
								<div className="flex items-center justify-between text-sm">
									<span className="text-white/70">Subtotal</span>
									<span className="text-lg font-semibold">{formatCurrency(subtotal, items[0]?.currencySymbol || "$")}</span>
								</div>
								<div className="mt-4 grid gap-3 sm:flex">
									<Link href="/checkout" onClick={() => setIsOpen(false)} className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-pink-500 text-sm font-semibold text-white transition hover:bg-pink-600">
										Checkout
									</Link>
									<Link href="/products" onClick={() => setIsOpen(false)} className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-white text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100">
										Keep shopping
									</Link>
									<button type="button" onClick={clearCart} className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-4 text-sm font-medium text-white transition hover:bg-white/10">
										Clear
									</button>
								</div>
							</div>
						</>
					) : (
						<div className="mt-5 rounded-[1.25rem] border border-dashed border-neutral-300 px-5 py-10 text-center">
							<p className="text-sm text-neutral-500">Add a product and it will appear here.</p>
						</div>
					)}
				</div>
			) : null}
		</div>
	)
}
