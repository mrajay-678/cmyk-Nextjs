"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { defaultSort } from "./catalogConfig";
import ProductFilters from "./ProductFilters";
import ProductGrid from "./ProductGrid";
import ProductGridSkeleton from "./ProductGridSkeleton";

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export default function ProductCatalog({
  initialProductsData = null,
  initialFiltersData = null,
  initialParams = null,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeSearch = searchParams.get("q") || "";
  const activeCategory = searchParams.get("category") || "";
  const activeTag = searchParams.get("tag") || "";
  const activeSort = searchParams.get("sort") || defaultSort;
  const loadMoreRef = useRef(null);
  const productQueryKey = useMemo(
    () => [
      "products",
      {
        q: activeSearch,
        category: activeCategory,
        tag: activeTag,
        sort: activeSort,
      },
    ],
    [activeCategory, activeSearch, activeSort, activeTag],
  );
  const isUsingInitialParams =
    initialParams?.q === activeSearch &&
    initialParams?.category === activeCategory &&
    initialParams?.tag === activeTag &&
    initialParams?.sort === activeSort;

  const filtersQuery = useQuery({
    queryKey: ["product-filters"],
    queryFn: () => fetchJson("/api/products/filters"),
    initialData: initialFiltersData || undefined,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const productsQuery = useInfiniteQuery({
    queryKey: productQueryKey,
    queryFn: ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        q: activeSearch,
        category: activeCategory,
        tag: activeTag,
        sort: activeSort,
        page: String(pageParam),
      });

      return fetchJson(`/api/products?${params.toString()}`);
    },
    initialData:
      isUsingInitialParams && initialProductsData
        ? {
            pages: [initialProductsData],
            pageParams: [1],
          }
        : undefined,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = lastPage?.totalPages || 0;
      const nextPage = allPages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
  });
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = productsQuery;

  const products = useMemo(
    () =>
      productsQuery.data?.pages?.flatMap((page) => page.products || []) || [],
    [productsQuery.data],
  );
  const productsError = useMemo(
    () => productsQuery.data?.pages?.find((page) => page?.error)?.error || null,
    [productsQuery.data],
  );
  const filtersError =
    filtersQuery.error?.message || filtersQuery.data?.error || null;
  const error =
    productsQuery.error?.message ||
    productsError ||
    (!products.length ? filtersError : null);
  const categories = filtersQuery.data?.categories || [];
  const tags = filtersQuery.data?.tags || [];


  useEffect(() => {
    const node = loadMoreRef.current;

    if (!node || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const updateParams = useCallback(
    (nextValues) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(nextValues).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      params.delete("page");

      const nextQueryString = params.toString();
      router.replace(
        nextQueryString ? `${pathname}?${nextQueryString}` : pathname,
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const handleApply = useCallback(
    (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);

      updateParams({
        q: String(formData.get("q") || "").trim(),
        category: String(formData.get("category") || ""),
        tag: String(formData.get("tag") || ""),
        sort: String(formData.get("sort") || defaultSort),
      });
    },
    [updateParams],
  );

  const handleReset = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return (
    <div className="mx-auto grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-28 lg:h-fit">
        <ProductFilters
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
          error={filtersError}
        />
      </aside>

      <div className="space-y-6">
        {error ? (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            {error}
          </div>
        ) : null}
        {productsQuery.isLoading ? (
          <ProductGridSkeleton />
        ) : (
          <ProductGrid products={products} />
        )}
        {isFetchingNextPage ? <ProductGridSkeleton count={3} /> : null}
        {products.length ? (
          <div ref={loadMoreRef} className="h-4" aria-hidden="true" />
        ) : null}
        {hasNextPage ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-200 bg-white px-6 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-60"
            >
              {isFetchingNextPage
                ? "Loading more products..."
                : "Load more products"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
