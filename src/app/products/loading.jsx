import ProductCatalogFallback from "@/component/product/ProductCatalogFallback"

export default function Loading() {
	return (
		<section className="min-h-screen bg-neutral-50 px-6 py-10">
			<div className="mx-auto xl:max-w-[92rem]">
				<div className="mt-10">
					<ProductCatalogFallback />
				</div>
			</div>
		</section>
	)
}
