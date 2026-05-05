import ProductCard from "./ProductCard"

export default function ProductGrid({ products }) {
	if (!products.length) {
		return (
			<div className="rounded-[2rem] border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
				<h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950">No products found</h2>
				<p className="mx-auto mt-3 max-w-xl text-neutral-500">Try a different search term or switch to another category to see more products.</p>
			</div>
		)
	}

	return (
		<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
			{products.map((product) => (
				<ProductCard key={product.id} product={product} />
			))}
		</div>
	)
}
