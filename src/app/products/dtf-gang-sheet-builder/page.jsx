import { notFound } from "next/navigation";

import GangSheetProductPage from "@/component/gang-sheet/GangSheetProductPage";
import { gangSheetProductConfigs } from "@/component/gang-sheet/gangSheetProductConfig";
import {
  getProductBySlug,
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

  return (
    <GangSheetProductPage
      product={product}
      variations={variations}
      config={config}
    />
  );
}
