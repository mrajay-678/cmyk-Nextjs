import Link from "next/link"

import ProductCard from "./ProductCard"

export default function ProductRecommendations({ products }) {
	if (!products.length) {
		return null
	}

	return (
		<section className="mt-12 space-y-6 md:mt-18">
			<div>
				<p className="text-sm font-semibold uppercase tracking-[0.24em] text-pink-500">Recommended for you</p>
				<h2 className="mt-3 text-2xl font-semibold leading-tight text-neutral-950 md:text-3xl">Related products you may also want</h2>
			</div>

			<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
				{products.map((product) => (
					<ProductCard key={product.id} product={product} />
				))}
			</div>

			<div>
				<Link href="/products" className="inline-flex rounded-full border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-white">
					Back to all products
				</Link>
			</div>
		</section>
	)
}
