import GangsheetClient from "./GangsheetClient";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "DTF Gang Sheet Builder",
  description:
    "Build custom DTF gang sheets online with CMYK Print Shop and send your artwork into checkout.",
  path: "/dtf-gang-sheet-builder",
  image: "/assets/image/shirt-banner.png",
});

export default function GangsheetPage() {
  return <GangsheetClient />;
}
