import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-primary",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CMYK Prints | DTF & Personalization",
  description:
    "Custom DTF transfers, UV DTF stickers, and print-on-demand products with zero hassle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen bg-white text-text antialiased flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
