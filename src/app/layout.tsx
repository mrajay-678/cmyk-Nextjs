import type { Metadata } from "next";
import "./globals.css";
import Header from "../component/Header/Header";
import Footer from "../component/Footer/Footer";
import AppProviders from "../component/AppProviders";
import "animate.css";
import ScrollToTopOnRouteChange from "../component/scroll-to-top-on-route-change";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  icons: {
    icon: [
      {
        url: "https://cmykprint.shop/wp-content/uploads/2025/11/cropped-Vector-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "https://cmykprint.shop/wp-content/uploads/2025/11/cropped-Vector-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: {
      url: "https://cmykprint.shop/wp-content/uploads/2025/11/cropped-Vector-180x180.png",
      sizes: "180x180",
      type: "image/png",
    },
  },

  openGraph: {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: DEFAULT_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`bg-gray`}>
      <body>
        <AppProviders>
          <ScrollToTopOnRouteChange />
          <Header />
          {children}
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
