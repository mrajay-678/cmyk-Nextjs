import type { Metadata } from "next";

export const SITE_URL = "https://cmykprint.shop";
export const SITE_NAME = "CMYK Print Shop";
export const DEFAULT_TITLE = SITE_NAME;
export const DEFAULT_DESCRIPTION =
  "Order custom DTF transfers, UV DTF stickers, gang sheets, apparel, and print products from CMYK Print Shop.";
export const DEFAULT_IMAGE = "/assets/image/shirt-banner.png";

export function cleanSeoText(value?: string | null, fallback = DEFAULT_DESCRIPTION) {
  const text = String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  return text || fallback;
}

export function titleFromSlug(slug?: string | null, fallback = "Products") {
  const title = String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return title || fallback;
}

export function canonical(path = "/") {
  return path;
}

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_IMAGE,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: canonical(path) },
    openGraph: {
      title: title || DEFAULT_TITLE,
      description,
      url: canonical(path),
      siteName: SITE_NAME,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: title || DEFAULT_TITLE,
      description,
      images: image ? [image] : undefined,
    },
  };

  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    };
  }

  return metadata;
}
