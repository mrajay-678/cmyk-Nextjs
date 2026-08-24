import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"

import ProductImageZoom from "@/component/product/ProductImageZoom"
import ProductPurchasePanel from "@/component/product/ProductPurchasePanel"
import ProductRecommendations from "@/component/product/ProductRecommendations"
import { ProductPurchaseSkeleton, ProductRecommendationsSkeleton } from "@/component/product/ProductDetailSkeleton"
import { buildQuantityPriceTable, extractCurrencySymbol, toSlug } from "@/component/product/productHelpers"
import { getProductBySlug, getProductVariations, getRecommendedProducts } from "@/component/product/wooCommerce"

function buildQuantityMap(priceRows) {
	return priceRows.reduce((result, row) => {
		result[row.quantity] = row.unitPrice
		return result
	}, {})
}

async function ProductPurchaseSection({ product, variationsPromise }) {
	const { variations } = await variationsPromise
	const currencySymbol = extractCurrencySymbol(product)
	const pricingRows = buildQuantityPriceTable(product, variations)
	const quantityOptions = pricingRows.map((row) => row.quantity)

	return (
		<ProductPurchasePanel
			product={product}
			quantityOptions={quantityOptions}
			quantityRows={pricingRows}
			lowestPrice={buildQuantityMap(pricingRows)}
			currencySymbol={currencySymbol}
		/>
	)
}

async function ProductRecommendationsSection({ relatedProductsPromise }) {
	const { products } = await relatedProductsPromise
	return <ProductRecommendations products={products} />
}

async function ProductDetailContent({ slug }) {

	const { product, error } = await getProductBySlug(slug)

	if (error || !product || toSlug(product.slug || product.name) !== slug) {
		notFound()
	}

	const variationsPromise = getProductVariations(product.id)
	const relatedProductsPromise = getRecommendedProducts({
		currentProductId: product.id,
		tagIds: product.tags?.map((tag) => tag.id) || [],
		categoryIds: product.categories?.map((category) => category.id) || [],
	})
	return (
		<section className="overflow-hidden bg-neutral-50 px-4 py-8 sm:px-6 sm:py-12 md:px-10 md:py-18 lg:px-16 lg:py-24">
			<div className="mx-auto w-full max-w-[92rem]">
				<nav aria-label="Breadcrumb" className="mb-6 flex min-w-0 flex-wrap items-center gap-2 text-xs text-neutral-500 sm:text-sm md:mb-8">
					<Link href="/" className="transition hover:text-neutral-950">
						Home
					</Link>
					<span>/</span>
					<Link href="/products" className="transition hover:text-neutral-950">
						Products
					</Link>
					<span>/</span>
					<span className="min-w-0 break-words text-neutral-950">{product.name}</span>
				</nav>

				<div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)]">
					<div className="min-w-0 lg:sticky lg:top-28">
						<ProductImageZoom images={product.images} title={product.name} />
					</div>

					<div className="min-w-0 space-y-5 sm:space-y-6">
						<div className="space-y-3">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500 sm:text-sm sm:tracking-[0.24em]">Product Detail</p>
							<p className="break-words text-sm text-neutral-500">SKU: {product.sku || "Not available"}</p>
							<h1 className="break-words text-2xl font-semibold leading-tight text-neutral-950 sm:text-4xl md:text-4xl">{product.name}</h1>
							<p className="max-w-2xl break-words text-sm leading-7 text-neutral-600 sm:text-base sm:leading-8" dangerouslySetInnerHTML={ {__html: product.short_description || "Product details will appear here once the WooCommerce description is available."}}></p>
						</div>

						<Suspense fallback={<ProductPurchaseSkeleton />}>
							<ProductPurchaseSection product={product} variationsPromise={variationsPromise} />
						</Suspense>
					</div>
				</div>

				<Suspense fallback={<ProductRecommendationsSkeleton />}>
					<ProductRecommendationsSection relatedProductsPromise={relatedProductsPromise} />
				</Suspense>
			</div>
		</section>
	)
}

export default async function ProductDetailPage({ params }) {
	const { slug } = await params
	return <ProductDetailContent slug={slug} />
}
