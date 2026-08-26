"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Trash2, X, Search } from "lucide-react"

import { extractCurrencySymbol, formatCurrency, getLowestUnitPrice, toSlug } from "../product/productHelpers"
import { useCart } from "../product/CartContext"
import { useEffect, useState } from "react"

export default function CartButton() {
	const { items, itemCount, subtotal, removeItem, clearCart } = useCart()
	const [isOpen, setIsOpen] = useState(false)
	const [isSearchOpen, setIsSearchOpen] = useState(false)
	const [searchTerm, setSearchTerm] = useState("")
	const [searchResults, setSearchResults] = useState([])
	const [isSearching, setIsSearching] = useState(false)
	const [searchError, setSearchError] = useState("")

	useEffect(() => {
		const query = searchTerm.trim()

		if (query.length < 2) {
			setSearchResults([])
			setSearchError("")
			setIsSearching(false)
			return undefined
		}

		const controller = new AbortController()
		const timeoutId = window.setTimeout(async () => {
			setIsSearching(true)
			setSearchError("")

			try {
				const response = await fetch(`/api/products?q=${encodeURIComponent(query)}`, { signal: controller.signal })
				if (!response.ok) {
					throw new Error("Unable to search products")
				}

				const data = await response.json()
				setSearchResults(data.products || [])
			} catch (error) {
				if (error.name !== "AbortError") {
					setSearchError(error.message)
					setSearchResults([])
				}
			} finally {
				if (!controller.signal.aborted) {
					setIsSearching(false)
				}
			}
		}, 300)

		return () => {
			window.clearTimeout(timeoutId)
			controller.abort()
		}
	}, [searchTerm])

	useEffect(() => {
		if (!isSearchOpen) {
			return undefined
		}

		const handleKeyDown = (event) => {
			if (event.key === "Escape") {
				setIsSearchOpen(false)
			}
		}

		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [isSearchOpen])

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setIsSearchOpen(true)}
				className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50 mr-4"
				aria-label="Search products"
			>
				<Search size={20} strokeWidth={1.5} />
			</button>
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
				<div className="fixed inset-x-3 top-24 z-50 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-neutral-200 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:absolute sm:inset-auto sm:right-0 sm:top-16 sm:w-[24rem] sm:p-5">
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
												<div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white">
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
									<span className="text-lg font-semibold">{formatCurrency(subtotal, "$")}</span>
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

			{isSearchOpen ? (
				<div className="fixed inset-0 z-40" onMouseDown={() => setIsSearchOpen(false)}>
					<div className="absolute right-3 top-24 w-[min(41rem,calc(100vw-1.5rem))] border border-neutral-300 bg-white p-6 shadow-[0_16px_35px_rgba(15,23,42,0.08)] sm:right-12 sm:top-32 sm:p-11" role="dialog" aria-modal="true" aria-labelledby="product-search-title" onMouseDown={(event) => event.stopPropagation()}>
						<div className="absolute -top-3 right-24 h-6 w-6 rotate-45 border-l border-t border-neutral-300 bg-white" aria-hidden="true" />
						<button type="button" onClick={() => setIsSearchOpen(false)} className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center text-neutral-950 transition hover:text-pink-500" aria-label="Close search">
							<X size={34} strokeWidth={1.25} />
						</button>

						<h2 id="product-search-title" className="sr-only">Search products</h2>
						<div className="relative pr-10">
							<Search size={18} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-neutral-400" />
							<input autoFocus type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search products..." className="h-12 w-full border-b border-neutral-300 bg-transparent pl-8 text-lg text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-pink-500" aria-label="Search products" />
						</div>

						<div className="mt-7 max-h-[min(60vh,28rem)] overflow-y-auto">
							{isSearching ? <p className="py-10 text-center text-sm text-neutral-500">Searching products...</p> : null}
							{searchError ? <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{searchError}</p> : null}
							{!isSearching && !searchError && searchTerm.trim().length < 2 ? <p className="py-10 text-center text-lg text-neutral-500">Type at least 2 characters to search.</p> : null}
							{!isSearching && !searchError && searchTerm.trim().length >= 2 && !searchResults.length ? <p className="py-10 text-center text-lg text-neutral-500">No products found.</p> : null}
							{searchResults.length ? (
								<>
									{searchResults.slice(0, 1).map((product) => {
										const image = product.images?.[0]
										const price = getLowestUnitPrice(product)
										const productUrl = `/products/${toSlug(product.slug || product.name)}`

										return (
											<Link key={product.id} href={productUrl} onClick={() => setIsSearchOpen(false)} className="grid grid-cols-[11rem_1fr] gap-8 border-b border-neutral-300 pb-8 transition hover:text-pink-500 sm:grid-cols-[12rem_1fr]">
												<div className="relative h-32 overflow-hidden bg-neutral-100 sm:h-36">
													{image ? <Image src={image.src} alt={image.alt || product.name} fill sizes="192px" className="object-contain" /> : <span className="flex h-full items-center justify-center text-sm text-neutral-400">No image</span>}
												</div>
												<div className="min-w-0 pt-1">
													<p className="text-sm uppercase tracking-[0.08em] text-neutral-950">Product</p>
													<p className="mt-2 text-xl font-medium leading-tight text-neutral-950 sm:text-2xl">{product.name}</p>
													<p className="mt-4 text-sm text-neutral-500">{price === null ? "Contact us" : `From ${formatCurrency(price, extractCurrencySymbol(product))}`}</p>
												</div>
											</Link>
										)
									})}
									<Link href={`/products?q=${encodeURIComponent(searchTerm.trim())}`} onClick={() => setIsSearchOpen(false)} className="mt-8 inline-flex text-xl text-neutral-950 transition hover:text-pink-500">More results ...</Link>
								</>
							) : null}
						</div>
					</div>
				</div>
			) : null}
		</div>
	)
}
