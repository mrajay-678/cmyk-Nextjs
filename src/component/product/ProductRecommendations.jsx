import ProductCard from "./ProductCard"

export default function ProductRecommendations({ products }) {
	if (!products.length) {
		return null
	}

	return (
		<section className="mt-12 space-y-6 md:mt-18">
			<div>
				<h2 className="mt-3 text-2xl leading-tight text-neutral-950 md:text-4xl">Related products</h2>
			</div>

			<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
				{products.map((product) => (
					<ProductCard key={product.id} product={product} />
				))}
			</div>
		</section>
	)
}
