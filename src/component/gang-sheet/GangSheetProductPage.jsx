"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { markWooCartIntentPending } from "@/lib/woocommerce/cart-sync";
import { getCurrentCart } from "@/lib/woocommerce/cart";
import { clearStoredCartToken } from "@/lib/woocommerce/store-api";
import GangSheetBuilder from "@/component/gang-sheet/GangSheetBuilder";
import styles from "@/app/products/dtf-gang-sheet-builder/Gangsheet.module.css";

function parsePrice(value) {
  const price = Number.parseFloat(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(price) ? price : 0;
}

function getVariationLabel(variation) {
  return (
    variation?.attributes
      ?.map((attribute) => attribute.option || attribute.name || "")
      .filter(Boolean)
      .join(" / ") ||
    variation?.name ||
    String(variation?.id || "")
  );
}

function mapVariationsToSizeOptions(variations) {
  return variations
    .map((variation) => ({
      id: variation.id,
      label: getVariationLabel(variation),
      price: parsePrice(variation.price || variation.regular_price),
      attributes: variation.attributes || [],
    }))
    .filter((option) => option.id && option.label);
}

function getWooAttributeKey(attribute) {
  const slug = attribute?.slug || "";

  if (slug.startsWith("pa_") || slug.startsWith("attribute_")) {
    return slug;
  }

  if (attribute?.id && slug) {
    return `pa_${slug}`;
  }

  if (attribute?.id && attribute?.name) {
    return `pa_${attribute.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}`;
  }

  return attribute?.name || "attribute_size";
}

function getGangSheetCheckoutUrl(productId, productType, productSlug) {
  const params = new URLSearchParams({
    product_id: String(productId || ""),
    product_type: String(productType || ""),
    product_slug: String(productSlug || ""),
  });

  return `/api/gang-sheet/add-to-cart?${params.toString()}`;
}

export default function GangSheetProductPage({ product, variations, config }) {
  const shopId =
    process.env.NEXT_PUBLIC_GS_SHOP_ID ||
    "e28e4f98-a0b2-4b75-b1fd-e809863d91de";
  const gallery = product?.images?.length
    ? product.images.map((image) => ({
        src: image.src,
        alt: image.alt || product.name || config.title,
      }))
    : config.gallery;
  const sizeOptions = mapVariationsToSizeOptions(variations);
  const [activeImage, setActiveImage] = useState(gallery[0]);
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [builderReady, setBuilderReady] = useState(false);
  const [error, setError] = useState(null);
  const [isOpening, setIsOpening] = useState(false);

  const totalPrice = useMemo(
    () => ((selectedSize?.price || 0) * quantity).toFixed(2),
    [selectedSize?.price, quantity],
  );
  const variants = useMemo(() => {
    if (!selectedSize) {
      return [];
    }

    return [
      selectedSize,
      ...sizeOptions.filter((option) => option.id !== selectedSize.id),
    ].map((option) => {
      const attribute = option.attributes[0];
      const attributeKey = getWooAttributeKey(attribute);
      return {
        id: option.id,
        title: option.label,
        attribute_key: attributeKey,
        attribute_value: option.label,
        attributes: {
          [attributeKey]: option.label,
        },
      };
    });
  }, [selectedSize, sizeOptions]);

  const handleOpenBuilder = async () => {
    try {
      markWooCartIntentPending(await getCurrentCart());
    } catch {
      markWooCartIntentPending();
    }
    clearStoredCartToken();
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
                style={{ objectFit: "contain", padding: "28px" }}
                priority
              />
            </div>
          </div>

          <div className={styles.info}>
            <div className={styles.breadcrumbs}>{config.breadcrumb}</div>
            <h1 className={styles.title}>{product?.name || config.title}</h1>
            <div className={styles.priceRange}>
              {sizeOptions.length > 1
                ? `$${sizeOptions[0].price.toFixed(2)} - $${sizeOptions[
                    sizeOptions.length - 1
                  ].price.toFixed(2)}`
                : `$${(selectedSize?.price || 0).toFixed(2)}`}
            </div>
            <p className={styles.copy}>
              {product?.short_description
                ? product.short_description.replace(/<[^>]*>/g, " ")
                : config.description}
            </p>

            <div className={styles.purchaseCard}>
              <div className={styles.formRow}>
                <label className={styles.label} htmlFor="size">
                  Size
                </label>
                <select
                  id="size"
                  className={styles.select}
                  value={selectedSize?.id || ""}
                  onChange={(event) => {
                    const next = sizeOptions.find(
                      (option) => option.id === Number(event.target.value),
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

              <div className={styles.priceRow}>
                <span className={styles.price}>${totalPrice}</span>
                <span className={styles.subtle}>based on selected size</span>
              </div>

              {error && <div className={styles.error}>{error}</div>}
              {isOpening && (
                <div className={styles.loader}>Launching builder...</div>
              )}

              <div className={styles.actions}>
                <GangSheetBuilder
                  mode="woo-product"
                  productId={String(product.id)}
                  productType={config.productType}
                  shopUuid={shopId}
                  variants={variants}
                  quantity={quantity}
                  cartUrl={getGangSheetCheckoutUrl(
                    product.id,
                    config.productType,
                    product.slug,
                  )}
                  buttonClassName={styles.primary}
                  disabled={!builderReady || isOpening || !selectedSize}
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
                <span className={styles.metaPill}>
                  Keeps your checkout flow
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
