import { Suspense } from "react";
import { notFound } from "next/navigation";

import GangSheetProductPage from "@/component/gang-sheet/GangSheetProductPage";
import { gangSheetProductConfigs } from "@/component/gang-sheet/gangSheetProductConfig";
import ProductRecommendations from "@/component/product/ProductRecommendations";
import { ProductRecommendationsSkeleton } from "@/component/product/ProductDetailSkeleton";
import {
  getProductBySlug,
  getRecommendedProducts,
  getProductVariations,
} from "@/component/product/wooCommerce";
import { buildMetadata } from "@/lib/seo";

const config = gangSheetProductConfigs.dtf;

export const metadata = buildMetadata({
  title: config.title,
  description: config.description,
  path: `/products/${config.slug}`,
  image: config.gallery[0].src,
});

export default async function DtfGangSheetBuilderProductPage() {
  const { product, error } = await getProductBySlug(config.slug);

  if (error || !product) {
    notFound();
  }

  const { variations } = await getProductVariations(product.id);
  const relatedProductsPromise = getRecommendedProducts({
    currentProductId: product.id,
    tagIds: product.tags?.map((tag) => tag.id) || [],
    categoryIds: product.categories?.map((category) => category.id) || [],
  });

  return (
    <div className="bg-neutral-50">
      <GangSheetProductPage
        product={product}
        variations={variations}
        config={config}
      />
      <section className=" px-5 pb-20">
        <div className="mx-auto w-full max-w-7xl">
          <Suspense fallback={<ProductRecommendationsSkeleton />}>
            <GangSheetRecommendations
              relatedProductsPromise={relatedProductsPromise}
            />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

async function GangSheetRecommendations({ relatedProductsPromise }) {
  const { products } = await relatedProductsPromise;
  return <ProductRecommendations products={products} />;
}
