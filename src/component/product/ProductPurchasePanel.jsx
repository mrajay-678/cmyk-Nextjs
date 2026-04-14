"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

import AddToCartButton from "./AddToCartButton"
import { formatCurrency } from "./productHelpers"

export default function ProductPurchasePanel({ product, quantityOptions, lowestPrice, currencySymbol }) {
	const [selectedQuantity, setSelectedQuantity] = useState(String(quantityOptions[0] || 25))
	const [selectedFile, setSelectedFile] = useState("")
	const [previewUrl, setPreviewUrl] = useState("")
	const numericQuantity = Number(selectedQuantity)
	const selectedTotalPrice = lowestPrice[numericQuantity] ?? null
	const selectedUnitPrice = selectedTotalPrice && numericQuantity ? selectedTotalPrice / numericQuantity : null
	const cartItem = {
		id: `${product.id}-${numericQuantity}-${selectedFile || "no-artwork"}`,
		productId: product.id,
		name: product.name,
		productUrl: `/products/${product.slug || ""}`,
		image: product.images?.[0]?.src || "",
		selectedQuantity: numericQuantity,
		totalPrice: selectedTotalPrice || 0,
		unitPrice: selectedUnitPrice || 0,
		currencySymbol,
		artworkName: selectedFile,
	}

	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl)
			}
		}
	}, [previewUrl])

	function handleFileChange(event) {
		const file = event.target.files?.[0]

		if (previewUrl) {
			URL.revokeObjectURL(previewUrl)
		}

		setSelectedFile(file?.name || "")

		if (file && file.type.startsWith("image/")) {
			setPreviewUrl(URL.createObjectURL(file))
			return
		}

		setPreviewUrl("")
	}

	return (
		<div className="space-y-6 rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
			<div className="overflow-x-auto">
				<table className="min-w-full bg-neutral-50 px-4 border-separate border-spacing-y-2 rounded-2xl">
					<thead>
						<tr className="text-left text-xs uppercase tracking-[0.18em] text-neutral-400">
							<th className="pb-2 pr-6">Quantity</th>
							{quantityOptions.map((quantity) => (
								<th key={quantity} className="pb-2 pr-6 font-medium">
									{quantity}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						<tr className=" text-sm text-neutral-700">
							<td className="rounded-l-2xl py-3 font-medium text-neutral-950">Per unit price</td>
							{quantityOptions.map((quantity) => (
								<td key={quantity} className="px-4 py-3">
									{formatCurrency(lowestPrice[quantity] / quantity, currencySymbol)}
								</td>
							))}
						</tr>
					</tbody>
				</table>
			</div>

			<div className="rounded-[1.5rem] bg-neutral-50 p-5">
				<p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Selected pricing</p>
				<div className="mt-3 flex flex-wrap items-end gap-6">
					<div>
						<p className="text-sm text-neutral-500">Total price</p>
						<p className="text-3xl font-semibold tracking-[-0.04em] text-neutral-950">{formatCurrency(selectedTotalPrice, currencySymbol)}</p>
					</div>
					<div>
						<p className="text-sm text-neutral-500">Per unit</p>
						<p className="text-lg font-medium text-neutral-950">{formatCurrency(selectedUnitPrice, currencySymbol)}</p>
					</div>
				</div>
			</div>

			<label className="grid gap-2">
				<span className="text-sm font-medium text-neutral-700">Select quantity</span>
				<select
					value={selectedQuantity}
					onChange={(event) => setSelectedQuantity(event.target.value)}
					className="h-12 rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-pink-400"
				>
					{quantityOptions.map((quantity) => (
						<option key={quantity} value={quantity}>
							{quantity} units
						</option>
					))}
				</select>
			</label>

			<label className="grid gap-2">
				<span className="text-sm font-medium text-neutral-700">Upload artwork</span>
				<input
					type="file"
					accept=".pdf,.png,.jpg,.jpeg,.psd,.ai,.svg"
					onChange={handleFileChange}
					className="block w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 file:mr-4 file:rounded-full file:border-0 file:bg-neutral-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-pink-500"
				/>
				<p className="text-sm leading-6 text-neutral-500">
					Use artwork at 300 DPI for best print quality. CMYK color mode, transparent backgrounds for stickers, and outlined fonts will help avoid production issues.
				</p>
				{selectedFile ? <p className="text-sm font-medium text-neutral-700">Selected file: {selectedFile}</p> : null}
				{previewUrl ? (
					<div className="overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-neutral-50 p-3">
						<p className="mb-3 text-sm font-medium text-neutral-700">Artwork preview</p>
						<div className="relative aspect-square w-full overflow-hidden rounded-[1rem] bg-white">
							<Image src={previewUrl} alt={selectedFile || "Uploaded artwork preview"} fill className="object-contain" unoptimized />
						</div>
					</div>
				) : null}
			</label>

			<div className="flex flex-col gap-3 sm:flex-row">
				<AddToCartButton
					item={cartItem}
					className="inline-flex h-13 w-full items-center justify-center rounded-full border border-neutral-200 px-6 text-base font-semibold text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50"
				>
					Add to cart
				</AddToCartButton>
				<a
					href={product.permalink || "#"}
					target="_blank"
					rel="noreferrer"
					className="inline-flex h-13 w-full items-center justify-center rounded-full bg-pink-500 px-6 text-base font-semibold text-white transition hover:bg-pink-600"
				>
					Buy Now
				</a>
			</div>
		</div>
	)
}
