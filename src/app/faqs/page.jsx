import FaqsClient from "./FaqsClient";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "FAQs",
  description:
    "Find answers about CMYK Print Shop DTF transfers, artwork files, order quantities, pressing, care, and turnaround.",
  path: "/faqs",
});

export default function FaqsPage() {
  return <FaqsClient />;
}
