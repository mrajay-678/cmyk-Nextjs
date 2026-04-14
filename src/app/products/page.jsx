import { Suspense } from "react"

import ProductCatalog from "@/component/product/ProductCatalog"
import ProductGridSkeleton from "@/component/product/ProductGridSkeleton"
import ProductQueryProvider from "@/component/product/ProductQueryProvider"

function ProductCatalogFallback() {
	return (
		<div className="mx-auto grid max-w-[92rem] gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
			<div className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
				<div className="h-6 w-36 animate-pulse rounded-full bg-neutral-200" />
				<div className="mt-6 space-y-4">
					<div className="h-12 animate-pulse rounded-xl bg-neutral-200" />
					<div className="h-12 animate-pulse rounded-xl bg-neutral-200" />
					<div className="h-12 animate-pulse rounded-xl bg-neutral-200" />
					<div className="h-12 animate-pulse rounded-xl bg-neutral-200" />
				</div>
			</div>

			<div className="space-y-6">
				<div className="rounded-[1.5rem] border border-neutral-200 bg-white px-5 py-4">
					<div className="h-4 w-32 animate-pulse rounded-full bg-neutral-200" />
					<div className="mt-3 h-4 w-56 animate-pulse rounded-full bg-neutral-200" />
				</div>
				<ProductGridSkeleton />
			</div>
		</div>
	)
}

export default function ProductsPage() {
	return (
		<section className="min-h-screen bg-neutral-50 px-6 py-16 md:px-10 md:py-20 lg:px-16 lg:py-24">
			<div className="mx-auto max-w-10/12">
				<div className="mt-10">
					<ProductQueryProvider>
						<Suspense fallback={<ProductCatalogFallback />}>
							<ProductCatalog />
						</Suspense>
					</ProductQueryProvider>
				</div>
			</div>
		</section>
	)
}
