import { Suspense } from "react";

import ProductCatalog from "@/component/product/ProductCatalog";
import ProductCatalogFallback from "@/component/product/ProductCatalogFallback";
import ProductQueryProvider from "@/component/product/ProductQueryProvider";

export default function ProductsPage() {
  return (
    <section className="min-h-screen bg-neutral-50 px-6 py-16 md:px-10 md:py-20 lg:px-16 lg:py-24">
      <div className="mx-auto xl:max-w-368">
        <div className="mt-10">
          <ProductQueryProvider>
            <Suspense fallback={<ProductCatalogFallback />}>
              <ProductCatalog />
            </Suspense>
          </ProductQueryProvider>
        </div>
      </div>
    </section>
  );
}
