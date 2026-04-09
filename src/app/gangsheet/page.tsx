"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import Image from "next/image";
import Script from "next/script";
import { useCallback, useMemo, useState } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import styles from "@/styles/Gangsheet.module.css";

declare const gs_builder: any;

type SizeOption = {
  id: number;
  width: number;
  height: number;
  label: string;
  price: number;
};

const sizeOptions: SizeOption[] = [
  { id: 1, width: 22, height: 24, label: '22" x 24"', price: 8.77 },
  { id: 2, width: 22, height: 60, label: '22" x 60"', price: 29.5 },
  { id: 3, width: 22, height: 120, label: '22" x 120"', price: 58 },
];

const gallery = [
  { src: "/assets/image/shirt-banner.png", alt: "Gang sheet builder on laptop" },
  { src: "/assets/image/your-art.png", alt: "Artwork thumbnails" },
  { src: "/assets/image/our-craft.png", alt: "Print crew at work" },
  { src: "/assets/image/mug.png", alt: "Printed mug" },
];

export default function GangsheetPage() {
  const shopId = process.env.NEXT_PUBLIC_GS_SHOP_ID;
  const [activeImage, setActiveImage] = useState(gallery[0]);
  const [selectedSize, setSelectedSize] = useState<SizeOption>(sizeOptions[0]);
  const [quantity, setQuantity] = useState(1);
  const [builderReady, setBuilderReady] = useState(false);
  const [latestDesignId, setLatestDesignId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  const totalPrice = useMemo(
    () => (selectedSize.price * quantity).toFixed(2),
    [selectedSize.price, quantity],
  );

  const openBuilder = useCallback(() => {
    setError(null);
    setIsOpening(true);
    if (!shopId) {
      setError("Shop ID missing. Set NEXT_PUBLIC_GS_SHOP_ID and refresh.");
      setIsOpening(false);
      return;
    }
    if (typeof window === "undefined" || typeof gs_builder === "undefined") {
      setError("Builder script not loaded. Please wait and try again.");
      setIsOpening(false);
      return;
    }

    gs_builder
      .open({
        // let the SDK manage its own modal container to avoid zero-size canvas issues
        mode: "production",
        shop_id: shopId,
        size_id: selectedSize.id,
        quantity,
        sizes: sizeOptions.map((s) => ({
          id: s.id,
          width: s.width,
          height: s.height,
          unit: "in",
          title: s.label,
        })),
        settings: {
          showStartModal: false,
          enableQuantity: false,
        },
      })
      .on("design:created", (e: any) => {
        if (e?.design_id) setLatestDesignId(String(e.design_id));
        gs_builder.close();
        setIsOpening(false);
      })
      .on("design:updated", (e: any) => {
        if (e?.design_id) setLatestDesignId(String(e.design_id));
        gs_builder.close();
        setIsOpening(false);
      })
      .on("closed", () => {
        setIsOpening(false);
      })
      .on("error", (e: any) => {
        setError(e?.reason ?? "Builder error");
        setIsOpening(false);
      });
  }, [quantity, selectedSize.id, shopId]);

  return (
    <div className={styles.page}>
      <Script
        src="https://app.buildagangsheet.com/assets/v1/scripts/gs-builder.min.js"
        strategy="afterInteractive"
        onLoad={() => setBuilderReady(true)}
        onError={() => setError("Failed to load builder script.")}
        style={{height: "80vh"}}
      />
      <Header />
      <main className={styles.wrapper}>
        <section className={styles.hero}>
          <div className={styles.media}>
            <div className={styles.thumbnailRail}>
              {gallery.map((item) => (
                <button
                  key={item.src}
                  type="button"
                  className={
                    item.src === activeImage.src
                      ? `${styles.thumbnail} ${styles.thumbnailActive}`
                      : styles.thumbnail
                  }
                  onClick={() => setActiveImage(item)}
                  aria-label={`Preview ${item.alt}`}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={96}
                    height={96}
                    className={styles.thumbnailImg}
                  />
                </button>
              ))}
            </div>

            <div className={styles.mainImage}>
              <Image
                src={activeImage.src}
                alt={activeImage.alt}
                fill
                sizes="(max-width: 900px) 100vw, 720px"
                style={{ objectFit: "cover" }}
                priority
              />
            </div>
          </div>

          <div className={styles.info}>
            <div className={styles.breadcrumbs}>Home / DTF Transfer / DTF Gang Sheet Builder</div>
            <h1 className={styles.title}>DTF Gang Sheet Builder</h1>
            <div className={styles.priceRange}>
              ${sizeOptions[0].price.toFixed(2)} - ${sizeOptions[sizeOptions.length - 1].price.toFixed(2)}
            </div>
            <p className={styles.copy}>
              Launch the official DripApps Gang Sheet Builder modal, create your sheet, and check out
              without leaving the page.
            </p>

            <div className={styles.formRow}>
              <label className={styles.label} htmlFor="size">
                Size
              </label>
              <select
                id="size"
                className={styles.select}
                value={selectedSize.id}
                onChange={(e) => {
                  const next = sizeOptions.find((o) => o.id === Number(e.target.value));
                  if (next) setSelectedSize(next);
                }}
              >
                {sizeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formRow}>
              <label className={styles.label} htmlFor="qty">
                Quantity
              </label>
              <div className={styles.quantityWrap}>
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                >
                  -
                </button>
                <input
                  id="qty"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((v) => v + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div className={styles.priceRow}>
              <span className={styles.price}>${totalPrice}</span>
              <span className={styles.subtle}>based on selected size</span>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {latestDesignId && (
              <div className={styles.success}>Saved design ID: {latestDesignId}</div>
            )}
            {isOpening && <div className={styles.loader}>Launching builder…</div>}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primary}
                onClick={openBuilder}
                disabled={!builderReady || isOpening}
              >
                Build Your Own Gang Sheet
              </button>
              <button type="button" className={styles.secondary}>
                Product Inquiry
              </button>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaPill}>Uses official DripApps builder</span>
              <span className={styles.metaPill}>Size + quantity sent automatically</span>
              <span className={styles.metaPill}>Keeps your checkout flow</span>
            </div>
          </div>
        </section>

        <section className={styles.builderSection}>
          <div className={styles.panel}>
            <div className={styles.subtitle}>
              The builder opens in a modal. We pass size, quantity, and shop ID to their SDK.
            </div>
            <div id="gs-builder-modal" className={styles.modalHost + " " + (isOpening && styles.isOpen)} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
