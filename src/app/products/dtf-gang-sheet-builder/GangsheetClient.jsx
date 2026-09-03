"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { markWooCartIntentPending } from "@/lib/woocommerce/cart-sync";
import { getCurrentCart } from "@/lib/woocommerce/cart";
import GangSheetBuilder from "@/component/gang-sheet/GangSheetBuilder";
import styles from "./Gangsheet.module.css";

const sizeOptions = [
  { id: 28748, width: 22, height: 12, label: '22" x 12"', price: 8.77 },
  { id: 28776, width: 22, height: 18, label: '22" x 18"', price: 11.17 },
  { id: 28777, width: 22, height: 24, label: '22" x 24"', price: 14.77 },
  { id: 28778, width: 22, height: 36, label: '22" x 36"', price: 20.77 },
  { id: 28779, width: 22, height: 48, label: '22" x 48"', price: 25.77 },
  { id: 28780, width: 22, height: 60, label: '22" x 60"', price: 35.77 },
  { id: 28781, width: 22, height: 72, label: '22" x 72"', price: 40.77 },
  { id: 28782, width: 22, height: 84, label: '22" x 84"', price: 45.77 },
  { id: 28783, width: 22, height: 108, label: '22" x 108"', price: 57.77 },
  { id: 28756, width: 22, height: 120, label: '22" x 120"', price: 62.77 },
  { id: 28757, width: 22, height: 144, label: '22" x 144"', price: 84.77 },
  { id: 28784, width: 22, height: 180, label: '22" x 180"', price: 101.97 },
  { id: 28761, width: 22, height: 240, label: '22" x 240"', price: 117.77 },
];

const gallery = [
  {
    src: "/assets/image/shirt-banner.png",
    alt: "Gang sheet builder on laptop",
  },
  { src: "/assets/image/your-art.png", alt: "Artwork thumbnails" },
  { src: "/assets/image/our-craft.png", alt: "Print crew at work" },
  { src: "/assets/image/mug.png", alt: "Printed mug" },
];

function getGangSheetCheckoutUrl(productId, productType) {
  const params = new URLSearchParams({
    product_id: String(productId || ""),
    product_type: String(productType || ""),
  });

  return `/api/gang-sheet/checkout?${params.toString()}`;
}

export default function GangsheetPage() {
  const shopId =
    process.env.NEXT_PUBLIC_GS_SHOP_ID ||
    "e28e4f98-a0b2-4b75-b1fd-e809863d91de";
  const [activeImage, setActiveImage] = useState(gallery[0]);
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0]);
  const [quantity, setQuantity] = useState(1);
  const [builderReady, setBuilderReady] = useState(false);
  const [error, setError] = useState(null);
  const [isOpening, setIsOpening] = useState(false);

  const totalPrice = useMemo(
    () => (selectedSize.price * quantity).toFixed(2),
    [selectedSize.price, quantity],
  );
  const variants = useMemo(
    () =>
      [
        selectedSize,
        ...sizeOptions.filter((option) => option.id !== selectedSize.id),
      ].map((option) => ({
        id: option.id,
        title: option.label,
        attribute_key: "attribute_size",
        attribute_value: option.label,
        attributes: {
          attribute_size: option.label,
        },
      })),
    [selectedSize],
  );

  const handleOpenBuilder = async () => {
    try {
      markWooCartIntentPending(await getCurrentCart());
    } catch {
      markWooCartIntentPending();
    }
    setError(null);
  };

  return (
    <div className={styles.page}>
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
            <div className={styles.breadcrumbs}>
              Home / DTF Transfer / DTF Gang Sheet Builder
            </div>
            <h1 className={styles.title}>DTF Gang Sheet Builder</h1>
            <div className={styles.priceRange}>
              ${sizeOptions[0].price.toFixed(2)} - $
              {sizeOptions[sizeOptions.length - 1].price.toFixed(2)}
            </div>
            <p className={styles.copy}>
              Launch the official DripApps Gang Sheet Builder modal, create your
              sheet, and check out without leaving the page.
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
                  const next = sizeOptions.find(
                    (o) => o.id === Number(e.target.value),
                  );
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
                  onChange={(e) =>
                    setQuantity(Math.max(1, Number(e.target.value) || 1))
                  }
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
            {isOpening && (
              <div className={styles.loader}>Launching builder…</div>
            )}

            <div className={styles.actions}>
              <GangSheetBuilder
                mode="woo-product"
                productId="28471"
                productType="1"
                shopUuid={shopId}
                variants={variants}
                cartUrl={getGangSheetCheckoutUrl("28471", "1")}
                buttonClassName={styles.primary}
                disabled={!builderReady || isOpening}
                onReady={() => setBuilderReady(true)}
                onOpen={handleOpenBuilder}
                onClose={() => setIsOpening(false)}
                onError={(event) => {
                  setError(event?.reason ?? "Builder error");
                  setIsOpening(false);
                }}
              >
                Build Your Own Gang Sheet
              </GangSheetBuilder>
              <button type="button" className={styles.secondary}>
                Product Inquiry
              </button>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaPill}>
                Uses official DripApps builder
              </span>
              <span className={styles.metaPill}>
                Size + quantity sent automatically
              </span>
              <span className={styles.metaPill}>Keeps your checkout flow</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
