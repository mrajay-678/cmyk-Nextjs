function SkeletonCard() {
	return (
		<div className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
			<div className="aspect-[4/3] animate-pulse bg-neutral-200" />
			<div className="space-y-4 p-5">
				<div className="h-6 w-2/3 animate-pulse rounded-full bg-neutral-200" />
				<div className="flex items-center justify-between gap-4">
					<div className="h-5 w-24 animate-pulse rounded-full bg-neutral-200" />
					<div className="h-10 w-28 animate-pulse rounded-full bg-neutral-200" />
				</div>
			</div>
		</div>
	)
}

export default function ProductGridSkeleton() {
	return (
		<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
			{Array.from({ length: 8 }).map((_, index) => (
				<SkeletonCard key={index} />
			))}
		</div>
	)
}
