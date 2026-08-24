import { Suspense } from "react";

import { defaultSort, sortMap } from "@/component/product/catalogConfig";
import ProductCatalog from "@/component/product/ProductCatalog";
import ProductCatalogFallback from "@/component/product/ProductCatalogFallback";
import { getProductCategories, getProducts, getProductTags } from "@/component/product/wooCommerce";

function getParamValue(searchParams, key, fallback = "") {
  const value = searchParams?.[key];

  if (Array.isArray(value)) {
    return value[0] || fallback;
  }

  return value || fallback;
}

export default async function ProductsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const activeParams = {
    q: getParamValue(resolvedSearchParams, "q"),
    category: getParamValue(resolvedSearchParams, "category"),
    tag: getParamValue(resolvedSearchParams, "tag"),
    sort: getParamValue(resolvedSearchParams, "sort", defaultSort),
  };
  const selectedSort = sortMap[activeParams.sort] || sortMap[defaultSort];

  const [initialProductsData, categoriesResult, tagsResult] = await Promise.all([
    getProducts({
      page: 1,
      search: activeParams.q,
      category: activeParams.category,
      tag: activeParams.tag,
      orderby: selectedSort.orderby,
      order: selectedSort.order,
    }),
    getProductCategories(),
    getProductTags(),
  ]);
  const initialFiltersData = {
    categories: categoriesResult.categories,
    tags: tagsResult.tags,
    error: categoriesResult.error || tagsResult.error || null,
  };

  return (
    <section className="min-h-screen bg-neutral-50 px-6 py-16 md:px-10 md:py-20 lg:px-16 lg:py-24">
      <div className="mx-auto xl:max-w-368">
        <div className="mt-10">
          <Suspense fallback={<ProductCatalogFallback />}>
            <ProductCatalog initialProductsData={initialProductsData} initialFiltersData={initialFiltersData} initialParams={activeParams} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
