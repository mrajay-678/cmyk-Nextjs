function getVisiblePages(currentPage, totalPages) {
	if (totalPages <= 5) {
		return Array.from({ length: totalPages }, (_, index) => index + 1)
	}

	if (currentPage <= 3) {
		return [1, 2, 3, 4, 5]
	}

	if (currentPage >= totalPages - 2) {
		return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
	}

	return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
}

export default function ProductPagination({ currentPage, totalPages, onPageChange }) {
	if (totalPages <= 1) {
		return null
	}

	const visiblePages = getVisiblePages(currentPage, totalPages)

	return (
		<nav aria-label="Products pagination" className="mt-10 flex flex-wrap items-center justify-center gap-3">
			<button
				type="button"
				onClick={() => onPageChange(Math.max(1, currentPage - 1))}
				aria-disabled={currentPage === 1}
				className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition ${currentPage === 1 ? "pointer-events-none border border-neutral-200 text-neutral-300" : "border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-white"}`}
			>
				Previous
			</button>

			{visiblePages[0] > 1 ? (
				<>
					<button
						type="button"
						onClick={() => onPageChange(1)}
						className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-white"
					>
						1
					</button>
					{visiblePages[0] > 2 ? <span className="px-1 text-neutral-400">...</span> : null}
				</>
			) : null}

			{visiblePages.map((page) => (
				<button
					type="button"
					key={page}
					onClick={() => onPageChange(page)}
					aria-current={page === currentPage ? "page" : undefined}
					className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium transition ${page === currentPage ? "bg-neutral-950 text-white" : "border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-white"}`}
				>
					{page}
				</button>
			))}

			{visiblePages[visiblePages.length - 1] < totalPages ? (
				<>
					{visiblePages[visiblePages.length - 1] < totalPages - 1 ? <span className="px-1 text-neutral-400">...</span> : null}
					<button
						type="button"
						onClick={() => onPageChange(totalPages)}
						className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-white"
					>
						{totalPages}
					</button>
				</>
			) : null}

			<button
				type="button"
				onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
				aria-disabled={currentPage === totalPages}
				className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition ${currentPage === totalPages ? "pointer-events-none border border-neutral-200 text-neutral-300" : "border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-white"}`}
			>
				Next
			</button>
		</nav>
	)
}
