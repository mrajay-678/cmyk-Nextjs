"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { defaultSort } from "./catalogConfig"

const DEFAULT_PRODUCT_PARAMS = {
	q: "",
	category: "",
	tag: "",
	sort: defaultSort,
}

async function fetchJson(url) {
	const response = await fetch(url)

	if (!response.ok) {
		throw new Error(`Request failed with status ${response.status}`)
	}

	return response.json()
}

function buildProductsUrl(page = 1) {
	const params = new URLSearchParams({
		...DEFAULT_PRODUCT_PARAMS,
		page: String(page),
	})

	return `/api/products?${params.toString()}`
}

export default function ProductCatalogPrefetch() {
	const queryClient = useQueryClient()
	const router = useRouter()

	useEffect(() => {
		const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

		if (connection?.saveData) {
			return
		}

		let isCancelled = false

		const prefetchCatalog = () => {
			if (isCancelled) {
				return
			}

			router.prefetch("/products")

			void queryClient.prefetchQuery({
				queryKey: ["product-filters"],
				queryFn: () => fetchJson("/api/products/filters"),
				staleTime: 1000 * 60 * 30,
			})

			void queryClient.prefetchInfiniteQuery({
				queryKey: ["products", DEFAULT_PRODUCT_PARAMS],
				queryFn: ({ pageParam = 1 }) => fetchJson(buildProductsUrl(pageParam)),
				initialPageParam: 1,
				getNextPageParam: (lastPage, allPages) => {
					const totalPages = lastPage?.totalPages || 0
					const nextPage = allPages.length + 1
					return nextPage <= totalPages ? nextPage : undefined
				},
				staleTime: 1000 * 60 * 5,
			})
		}

		const idleCallbackId =
			"requestIdleCallback" in window
				? window.requestIdleCallback(prefetchCatalog, { timeout: 2500 })
				: window.setTimeout(prefetchCatalog, 1200)

		return () => {
			isCancelled = true

			if ("cancelIdleCallback" in window) {
				window.cancelIdleCallback(idleCallbackId)
			} else {
				window.clearTimeout(idleCallbackId)
			}
		}
	}, [queryClient, router])

	return null
}
