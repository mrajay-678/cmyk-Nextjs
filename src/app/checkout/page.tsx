import CheckoutExperience from "@/component/checkout/CheckoutExperience";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Checkout",
  description: "CMYK Print Shop checkout.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutPage() {
  return <CheckoutExperience />;
}
