import CartExperience from "@/component/cart/CartExperience";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Cart",
  description: "CMYK Print Shop cart.",
  path: "/cart",
  noIndex: true,
});

export default function CartPage() {
  return <CartExperience />;
}
