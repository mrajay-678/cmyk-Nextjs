import { redirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Checkout",
  description: "CMYK Print Shop checkout.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutPage() {
  // Cart is the only review step; payment handoff starts from /cart.
  redirect("/cart");
}
