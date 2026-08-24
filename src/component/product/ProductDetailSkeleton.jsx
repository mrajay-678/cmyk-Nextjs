export function ProductMediaSkeleton() {
	return (
		<div className="space-y-4" aria-hidden="true">
			<div className="aspect-square animate-pulse rounded-[1.5rem] bg-neutral-200 sm:aspect-[4/5] sm:rounded-none" />
			<div className="grid grid-cols-4 gap-3">
				{Array.from({ length: 4 }).map((_, index) => (
					<div key={index} className="aspect-square animate-pulse bg-neutral-200" />
				))}
			</div>
		</div>
	)
}

export function ProductPurchaseSkeleton() {
	return (
		<div className="space-y-5 rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:p-6" aria-label="Loading pricing options">
			<div className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
			<div className="h-12 animate-pulse rounded-xl bg-neutral-100" />
			<div className="h-24 animate-pulse rounded-xl bg-neutral-100" />
		</div>
	)
}

export function ProductRecommendationsSkeleton() {
	return (
		<section className="mt-12 space-y-6 md:mt-18" aria-label="Loading related products">
			<div className="space-y-3">
				<div className="h-4 w-44 animate-pulse bg-neutral-200" />
				<div className="h-8 w-80 max-w-full animate-pulse rounded bg-neutral-200" />
			</div>
			<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
				{Array.from({ length: 4 }).map((_, index) => (
					<div key={index} className="h-80 animate-pulse rounded-[1.75rem] bg-neutral-200" />
				))}
			</div>
		</section>
	)
}

export default function ProductDetailSkeleton() {
	return (
		<section className="overflow-hidden bg-neutral-50 px-4 py-8 sm:px-6 sm:py-12 md:px-10 md:py-18 lg:px-16 lg:py-24">
			<div className="mx-auto max-w-[92rem]">
				<div className="mb-6 h-4 w-40 animate-pulse bg-neutral-200 md:mb-8 md:w-48" />
				<div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)] lg:items-start xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)]">
					<ProductMediaSkeleton />
					<div className="space-y-4 border border-neutral-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6">
						<div className="h-4 w-28 animate-pulse bg-neutral-200" />
						<div className="h-12 w-3/4 animate-pulse rounded-2xl bg-neutral-200" />
						<div className="h-6 w-40 animate-pulse bg-neutral-200" />
						<div className="h-28 animate-pulse rounded-2xl bg-neutral-200" />
						<div className="h-56 animate-pulse rounded-2xl bg-neutral-200" />
					</div>
				</div>
			</div>
		</section>
	)
}
