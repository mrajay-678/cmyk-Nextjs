"use client"

import { useEffect, useRef } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { defaultSort } from "./catalogConfig"
import ProductFilters from "./ProductFilters"
import ProductGrid from "./ProductGrid"
import ProductGridSkeleton from "./ProductGridSkeleton"

async function fetchJson(url) {
	const response = await fetch(url)

	if (!response.ok) {
		throw new Error(`Request failed with status ${response.status}`)
	}

	return response.json()
}

export default function ProductCatalog() {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const activeSearch = searchParams.get("q") || ""
	const activeCategory = searchParams.get("category") || ""
	const activeTag = searchParams.get("tag") || ""
	const activeSort = searchParams.get("sort") || defaultSort
	const loadMoreRef = useRef(null)

	const filtersQuery = useQuery({
		queryKey: ["product-filters"],
		queryFn: () => fetchJson("/api/products/filters"),
		staleTime: 1000 * 60 * 30,
		gcTime: 1000 * 60 * 60,
		refetchOnWindowFocus: false,
	})

	const productsQuery = useInfiniteQuery({
		queryKey: ["products", { q: activeSearch, category: activeCategory, tag: activeTag, sort: activeSort }],
		queryFn: ({ pageParam = 1 }) =>
			fetchJson(
				`/api/products?q=${encodeURIComponent(activeSearch)}&category=${encodeURIComponent(activeCategory)}&tag=${encodeURIComponent(activeTag)}&sort=${encodeURIComponent(activeSort)}&page=${pageParam}`
			),
		initialPageParam: 1,
		getNextPageParam: (lastPage, allPages) => {
			const totalPages = lastPage?.totalPages || 0
			const nextPage = allPages.length + 1
			return nextPage <= totalPages ? nextPage : undefined
		},
	})
	const { fetchNextPage, hasNextPage, isFetchingNextPage } = productsQuery

	const products = productsQuery.data?.pages?.flatMap((page) => page.products || []) || []
	const productsError = productsQuery.data?.pages?.find((page) => page?.error)?.error || null
	const error = productsQuery.error?.message || productsError || filtersQuery.error?.message || filtersQuery.data?.error || null
	const categories = filtersQuery.data?.categories || []
	const tags = filtersQuery.data?.tags || []
	const filtersKey = `${activeSearch}-${activeCategory}-${activeTag}-${activeSort}`

	useEffect(() => {
		const node = loadMoreRef.current

		if (!node || !hasNextPage || isFetchingNextPage) {
			return
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					fetchNextPage()
				}
			},
			{ rootMargin: "240px 0px" }
		)

		observer.observe(node)

		return () => observer.disconnect()
	}, [fetchNextPage, hasNextPage, isFetchingNextPage])

	function updateParams(nextValues) {
		const params = new URLSearchParams(searchParams.toString())

		Object.entries(nextValues).forEach(([key, value]) => {
			if (value) {
				params.set(key, value)
			} else {
				params.delete(key)
			}
		})

		params.delete("page")

		const nextQueryString = params.toString()
		router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, { scroll: false })
	}

	function handleApply(event) {
		event.preventDefault()
		const formData = new FormData(event.currentTarget)

		updateParams({
			q: String(formData.get("q") || "").trim(),
			category: String(formData.get("category") || ""),
			tag: String(formData.get("tag") || ""),
			sort: String(formData.get("sort") || defaultSort),
		})
	}

	function handleReset() {
		router.replace(pathname, { scroll: false })
	}

	return (
		<div className="mx-auto grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
			<aside className="lg:sticky lg:top-28 lg:h-fit">
				<ProductFilters
					key={filtersKey}
					categories={categories}
					tags={tags}
					search={activeSearch}
					category={activeCategory}
					tag={activeTag}
					sort={activeSort}
					onSubmit={handleApply}
					onReset={handleReset}
					isLoading={filtersQuery.isLoading}
					isFetching={productsQuery.isFetching && !isFetchingNextPage}
				/>
			</aside>

			<div className="space-y-6">
				{error ? <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">{error}</div> : null}
				{productsQuery.isLoading ? <ProductGridSkeleton /> : <ProductGrid products={products} />}
				{isFetchingNextPage ? <ProductGridSkeleton /> : null}
				{products.length ? <div ref={loadMoreRef} className="h-4" aria-hidden="true" /> : null}
				{hasNextPage ? (
					<div className="flex justify-center">
						<button
							type="button"
							onClick={() => fetchNextPage()}
							disabled={isFetchingNextPage}
							className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-200 bg-white px-6 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-60"
						>
							{isFetchingNextPage ? "Loading more products..." : "Load more products"}
						</button>
					</div>
				) : null}
			</div>
		</div>
	)
}
