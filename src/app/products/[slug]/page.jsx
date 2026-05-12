import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"

import ProductImageZoom from "@/component/product/ProductImageZoom"
import ProductPurchasePanel from "@/component/product/ProductPurchasePanel"
import ProductRecommendations from "@/component/product/ProductRecommendations"
import { buildQuantityPriceTable, extractCurrencySymbol, formatCurrency, getLowestUnitPrice, stripHtml, toSlug } from "@/component/product/productHelpers"
import { getProductBySlug, getProductVariations, getRelatedProductsByTags } from "@/component/product/wooCommerce"

function buildQuantityMap(priceRows) {
	return priceRows.reduce((result, row) => {
		result[row.quantity] = row.unitPrice
		return result
	}, {})
}

function ProductDetailFallback() {
	return (
		<section className="bg-neutral-50 px-6 py-14 md:px-10 md:py-18 lg:px-16 lg:py-24">
			<div className="mx-auto max-w-[92rem]">
				<div className="mb-8 h-4 w-48 animate-pulse bg-neutral-200" />
				<div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)] lg:items-start">
					<div className="space-y-4">
						<div className="aspect-[4/5] animate-pulse bg-neutral-200" />
						<div className="grid grid-cols-4 gap-3">
							{Array.from({ length: 4 }).map((_, index) => (
								<div key={index} className="aspect-square animate-pulse bg-neutral-200" />
							))}
						</div>
					</div>
					<div className="space-y-4 border border-neutral-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
						<div className="h-4 w-28 animate-pulse  bg-neutral-200" />
						<div className="h-4 w-36 animate-pulse  bg-neutral-200" />
						<div className="h-12 w-3/4 animate-pulse rounded-2xl bg-neutral-200" />
						<div className="h-6 w-40 animate-pulse  bg-neutral-200" />
						<div className="h-28 animate-pulse rounded-2xl bg-neutral-200" />
						<div className="h-56 animate-pulse rounded-2xl bg-neutral-200" />
					</div>
				</div>
			</div>
		</section>
	)
}

async function ProductDetailContent({ slug }) {

	const { product, error } = await getProductBySlug(slug)

	if (error || !product || toSlug(product.slug || product.name) !== slug) {
		notFound()
	}

	const [{ variations }, { products: relatedProducts }] = await Promise.all([
		getProductVariations(product.id),
		getRelatedProductsByTags({
			currentProductId: product.id,
			tagIds: product.tags?.map((tag) => tag.id) || [],
		}),
	])

	const currencySymbol = extractCurrencySymbol(product)
	const lowestUnitPrice = getLowestUnitPrice(product, variations)
	const pricingRows = buildQuantityPriceTable(product, variations)
	const quantityOptions = pricingRows.map((row) => row.quantity)
	const quantityMap = buildQuantityMap(pricingRows)

	return (
		<section className="bg-neutral-50 px-6 py-14 md:px-10 md:py-18 lg:px-16 lg:py-24">
			<div className="mx-auto max-w-10/12">
				<nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
					<Link href="/" className="transition hover:text-neutral-950">
						Home
					</Link>
					<span>/</span>
					<Link href="/products" className="transition hover:text-neutral-950">
						Products
					</Link>
					<span>/</span>
					<span className="text-neutral-950">{product.name}</span>
				</nav>

				<div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)] lg:items-start">
					<div className="sticky top-20">
						<ProductImageZoom images={product.images} title={product.name} />
					</div>

					<div className="space-y-6">
						<div className="space-y-3">
							<p className="text-sm font-semibold uppercase tracking-[0.24em] text-pink-500">Product Detail</p>
							<p className="text-sm text-neutral-500">SKU: {product.sku || "Not available"}</p>
							<h1 className="text-4xl font-semibold tracking-[-0.05em] text-neutral-950 md:text-5xl">{product.name}</h1>
							<p className="text-2xl font-semibold text-neutral-950">
								As low as: {formatCurrency(lowestUnitPrice, "$")}
							</p>
							<p className="max-w-2xl text-base leading-8 text-neutral-600">{stripHtml(product.short_description || product.description) || "Product details will appear here once the WooCommerce description is available."}</p>
						</div>

						<ProductPurchasePanel
							product={product}
							quantityOptions={quantityOptions}
							lowestPrice={quantityMap}
							currencySymbol={currencySymbol}
						/>
					</div>
				</div>

				<ProductRecommendations products={relatedProducts} />
			</div>
		</section>
	)
}

export default function ProductDetailPage({ params }) {
	return (
		<Suspense fallback={<ProductDetailFallback />}>
			{params.then(({ slug }) => (
				<ProductDetailContent slug={slug} />
			))}
		</Suspense>
	)
}
