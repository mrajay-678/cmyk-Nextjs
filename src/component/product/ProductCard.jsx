"use client"

import Image from "next/image"
import { memo, useMemo } from "react"
import Link from "next/link"
import { formatCurrency, getLowestUnitPrice, toSlug } from "./productHelpers"

function ProductCard({ product }) {
	const image = product.images?.[0]
	const productMeta = useMemo(() => {
		const productSlug = toSlug(product.slug || product.name)
		const quantityPricing = product.variationPricingRows || []
		const price = quantityPricing.length
			? Math.min(...quantityPricing.map((row) => row.unitPrice / row.quantity))
			: getLowestUnitPrice(product)
		  console.log("price", quantityPricing)

		return {
			productSlug,
			price,
		}
	}, [product])


	return (
		<Link
			className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
			style={{ contentVisibility: "auto", containIntrinsicSize: "420px" }}
			href={`/products/${productMeta.productSlug}`}
		>
			<div className="relative aspect-[4/3] bg-white m-5">
				{image ? (
					<Image
						src={image.src}
						alt={image.alt || product.name}
						fill
						sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
						className="object-contain"
					/>
				) : (
					<div className="flex h-full items-center aspect-[4/3] justify-center bg-neutral-100 text-sm text-neutral-400">No image</div>
				)}
			</div>

			<div className="space-y-4 p-5">
				<div className="space-y-2">
					<p className="text-xl tracking-[-0.03em] text-neutral-950">{product.name}</p>
				</div>

				<div className="space-y-3">
					<div className="text-lg font-medium text-neutral-950">As low as {formatCurrency(productMeta.price, "$")}</div>
					<div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
						<div
							className="inline-flex justify-center rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-500"
						>
							Customize
						</div>
						<span className="inline-flex justify-center rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50">
							Upload artwork
						</span>
					</div>
				</div>
			</div>
		</Link>
	)
}

export default memo(ProductCard)
