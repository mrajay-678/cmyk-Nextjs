import ProductCatalogFallback from "@/component/product/ProductCatalogFallback"

export default function Loading() {
	return (
		<section className="min-h-screen bg-neutral-50 px-6 py-16 md:px-10 md:py-20 lg:px-16 lg:py-24">
			<div className="mx-auto xl:max-w-[92rem]">
				<div className="mt-10">
					<ProductCatalogFallback />
				</div>
			</div>
		</section>
	)
}
