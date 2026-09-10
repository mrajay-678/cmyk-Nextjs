"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import AddToCartButton from "./AddToCartButton";
import { useCart } from "@/component/product/CartContext";
import { formatCurrency, parseNumericPrice } from "./productHelpers";
import GangSheetBuilder from "@/component/gang-sheet/GangSheetBuilder";
import {
  addCartItem,
  buildAddCartItemInput,
} from "@/lib/woocommerce/cart";
import {
  findNewWooCartItem,
  markWooCartIntentPending,
  mergeLocalCartItems,
  rememberWooCartItems,
  reconcileWooCartToLocalItems,
} from "@/lib/woocommerce/cart-sync";
import { clearStoredCartToken } from "@/lib/woocommerce/store-api";
import { Headset } from "lucide-react";
import Link from "next/link";

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

function getVariationLabel(variationItem) {
  return (
    variationItem?.attributes
      ?.map((attribute) => attribute.option || attribute.name || "")
      .filter(Boolean)
      .join(" / ") ||
    variationItem?.name ||
    ""
  );
}

function normalizeVariationAttributes(attributes = []) {
  return attributes.map((attribute) => ({
    ...attribute,
    slug: getWooAttributeKey(attribute),
  }));
}

export default function ProductPurchasePanel({
  product,
  quantityOptions,
  quantityRows = [],
  lowestPrice,
  currencySymbol,
  variation,
}) {
  const productSlug = product.slug || "";
  const productAttributeOptions = product.attributes?.[0]?.options || [];
  const sizeOptions = productAttributeOptions.includes('22" x 12"')
    ? productAttributeOptions
    : [];
  const router = useRouter();
  const { items, addItem } = useCart();
  const isBuyingNowRef = useRef(false);
  const [selectedQuantity, setSelectedQuantity] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const isSizeBasedProduct = sizeOptions.length > 0;
  const numericQuantity = Number.parseInt(selectedQuantity, 10);
  const hasSelectedQuantity =
    Number.isFinite(numericQuantity) && numericQuantity > 0;
  const selectedSizeVariation = isSizeBasedProduct
    ? variation?.find(
        (variationItem) => getVariationLabel(variationItem) === selectedSize,
      )
    : null;
  const selectedQuantityRow = isSizeBasedProduct
    ? selectedSizeVariation
      ? {
          quantity: 1,
          unitPrice: parseNumericPrice(
            selectedSizeVariation.price || selectedSizeVariation.regular_price,
          ),
          variationId: selectedSizeVariation.id,
          variationAttributes: normalizeVariationAttributes(
            selectedSizeVariation.attributes || [],
          ),
        }
      : null
    : quantityRows.find((row) => row.quantity === numericQuantity);
  const selectedTotalPrice = isSizeBasedProduct
    ? selectedQuantityRow?.unitPrice
    : hasSelectedQuantity
      ? (lowestPrice[numericQuantity] ?? null)
      : null;
  const selectedUnitPrice = isSizeBasedProduct
    ? selectedTotalPrice
    : selectedTotalPrice && numericQuantity
      ? selectedTotalPrice / numericQuantity
      : null;
  const isCheckoutReady = isSizeBasedProduct
    ? Boolean(selectedSizeVariation) && Boolean(selectedFile)
    : hasSelectedQuantity && Boolean(selectedFile);
  const cartQuantity = 1;
  const selectedOptionLabel = isSizeBasedProduct
    ? selectedSize
    : selectedQuantity || "no-quantity";
  const selectedQuantityForDisplay = isSizeBasedProduct
    ? 1
    : numericQuantity;
  const selectedQuantityForPrice = 1;
  const cartItem = {
    id: [
      product.id,
      selectedOptionLabel,
      selectedFile?.name || "no-artwork",
      selectedFile?.size || 0,
      selectedFile?.lastModified || 0,
    ].join("-"),
    productId: product.id,
    variationId: selectedQuantityRow?.variationId || null,
    variationAttributes: selectedQuantityRow?.variationAttributes || [],
    name: product.name,
    productUrl: `/products/${product.slug || ""}`,
    image: product.images?.[0]?.src || "",
    selectedQuantity: selectedQuantityForDisplay,
    cartQuantity,
    checkoutQuantity: selectedQuantityForPrice,
    totalPrice: selectedTotalPrice || 0,
    unitPrice: selectedUnitPrice || 0,
    currencySymbol,
    artworkName: selectedFile?.name || "",
  };
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const isBySizeBuilderProduct = new Set(["dtf-by-size", "uv-dtf-by-size"]).has(
    productSlug,
  );
  const gangSheetVariants = (variation || []).map((variationItem) => {
    const attribute = variationItem.attributes?.[0];
    const attributeKey = getWooAttributeKey(attribute);
    const attributeValue =
      attribute?.option || variationItem.name || String(variationItem.id);

    return {
      id: variationItem.id,
      title: attributeValue,
      attribute_key: attributeKey,
      attribute_value: attributeValue,
      attributes: {
        [attributeKey]: attributeValue,
      },
    };
  });
  function markGangSheetIntent() {
    // The BAGS SDK owns the actual add-to-cart request; clear the Store API token
    // before it runs so the cart page reads the WooCommerce session cookie it creates.
    markWooCartIntentPending();
    clearStoredCartToken();
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file || null);

    if (file && file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
      return;
    }

    setPreviewUrl("");
  }

  async function handleBuyNow() {
    if (!isCheckoutReady || isBuyingNowRef.current) {
      return;
    }

    isBuyingNowRef.current = true;
    setCheckoutError("");
    setIsBuyingNow(true);

    try {
      if (items.some((item) => item.id === cartItem.id)) {
        router.push("/checkout");
        return;
      }

      const nextLocalItems = mergeLocalCartItems(items, cartItem);
      const wooCart = await addCartItem(buildAddCartItemInput(cartItem));
      const wooItem = findNewWooCartItem(wooCart?.items, cartItem, items);
      const keyedLocalItems = nextLocalItems.map((item) =>
        item.id === cartItem.id ? { ...item, wooCartKey: wooItem?.key } : item,
      );
      await reconcileWooCartToLocalItems(wooCart, keyedLocalItems);
      if (wooItem) {
        rememberWooCartItems([wooItem]);
      }
      addItem({ ...cartItem, wooCartKey: wooItem?.key }, selectedFile);
      router.push("/checkout");
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Unable to add this item to the WooCommerce cart.",
      );
    } finally {
      isBuyingNowRef.current = false;
      setIsBuyingNow(false);
    }
  }

  if (isBySizeBuilderProduct) {
    return (
      <div className="space-y-5 rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:p-6">
        <GangSheetBuilder
          mode="woo-product"
          productId={String(product.id)}
          productType="7"
          variants={gangSheetVariants}
          sdkVersion="1.7.7"
          cartUrl="/cart?cmyk_bags_cart=1"
          label="Upload Image By Size"
          onOpen={markGangSheetIntent}
          buttonClassName="inline-flex h-13 w-full items-center justify-center rounded-full bg-pink-500 px-6 text-base font-semibold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
        >
          Upload Image By Size
        </GangSheetBuilder>
      </div>
    );
  }
  const shortDescription = product.short_description;

  const parser = new DOMParser();
  const doc = parser.parseFromString(shortDescription, "text/html");

  const text = doc
    .querySelector("table tbody tr td:first-child")
    ?.textContent.trim();

  const actualOptions = product["attributes"][0].options.map((item) =>
    item.replace(/[^0-9]/g, ""),
  );

  return (
    <section>
      <div className="space-y-6 rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:p-6">
        <div className="grid grid-cols-2 gap-2 md:hidden">
          {quantityOptions.map((quantity) => (
            <div key={quantity} className="p-3 rounded-2xl bg-neutral-50">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                {quantity} units
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-950">
                {formatCurrency(
                  lowestPrice[quantity] / quantity,
                  currencySymbol,
                )}
              </p>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full px-4 border-separate rounded-2xl border-spacing-y-2 bg-neutral-50">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-neutral-400">
                <th className="pb-2">Quantity</th>
                {sizeOptions?.length === 0 &&
                  actualOptions.map((quantity) => (
                    <th
                      key={quantity}
                      className="px-4 py-3 font-medium text-center"
                    >
                      {quantity}
                    </th>
                  ))}
                {sizeOptions?.length !== 0 &&
                  variation.map((variation) => (
                    <th
                      key={variation.id}
                      className="px-4 py-3 font-medium text-center min-w-32"
                    >
                      {variation.attributes[0].option}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              <tr className="text-sm text-neutral-700">
                <td className="py-3 font-medium rounded-l-2xl text-neutral-950">
                  {text ? `${text}` : "Per unit price"}
                </td>
                {sizeOptions?.length === 0 &&
                  quantityOptions.map((quantity) => (
                    <td key={quantity} className="px-4 py-3 text-center">
                      {formatCurrency(lowestPrice[quantity] / quantity, "$")}
                    </td>
                  ))}
                {sizeOptions?.length !== 0 &&
                  variation.map((variationItem, index) => (
                    <td
                      key={variationItem.id}
                      className="px-4 py-3 text-center"
                    >
                      $ {variation[index]?.regular_price}
                    </td>
                  ))}
              </tr>
            </tbody>
          </table>
        </div>

        {sizeOptions?.length === 0 && selectedQuantity && (
          <div className="rounded-[1.5rem] bg-neutral-50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Selected pricing
            </p>
            <div className="grid gap-4 mt-3 sm:flex sm:flex-wrap sm:items-end sm:gap-6">
              <div>
                <p className="text-sm text-neutral-500">Total Price</p>
                <p className="text-2xl font-semibold text-neutral-950 sm:text-3xl">
                  {formatCurrency(selectedTotalPrice, "$")}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Per unit</p>
                <p className="text-lg font-medium text-neutral-950">
                  {formatCurrency(selectedUnitPrice, "$")}
                </p>
              </div>
            </div>
          </div>
        )}
        {sizeOptions?.length !== 0 && selectedQuantity && (
          <div className="rounded-[1.5rem] bg-neutral-50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Selected pricing
            </p>
            <div className="grid gap-4 mt-3 sm:flex sm:flex-wrap sm:items-end sm:gap-6">
              <div>
                <p className="text-sm text-neutral-500">Size</p>
                <p className="text-2xl font-semibold text-neutral-950 sm:text-3xl">
                  {selectedSize}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Per unit</p>
                <p className="text-lg font-medium text-neutral-950">
                  ${" "}
                  {
                    variation?.find((item) => item.name === selectedSize)
                      ?.regular_price
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        <label className="grid gap-2">
          <span className="text-sm font-medium text-neutral-700">
            Select quantity
          </span>
          <select
            value={selectedQuantity}
            onChange={(event) => {
              setSelectedQuantity(event.target.value);
              setSelectedSize(event.target.value);
            }}
            className="h-12 px-4 text-sm transition bg-white border outline-none rounded-xl border-neutral-200 text-neutral-900 focus:border-pink-400"
            required
          >
            <option value="" disabled>
              Select quantity
            </option>

            {sizeOptions &&
              sizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            {sizeOptions?.length === 0 &&
              actualOptions.map((quantity) => (
                <option key={quantity} value={quantity}>
                  {quantity} units
                </option>
              ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-neutral-700">
            Upload artwork
          </span>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.psd,.ai,.svg"
            onChange={handleFileChange}
            className="block w-full px-3 py-3 text-sm bg-white border rounded-xl border-neutral-200 text-neutral-700 file:mb-2 file:mr-4 file:rounded-full file:border-0 file:bg-neutral-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-pink-500 sm:px-4 sm:file:mb-0"
          />
          <p className="text-sm leading-6 text-neutral-500">
            Use artwork at 300 DPI for best print quality. CMYK color mode,
            transparent backgrounds for stickers, and outlined fonts will help
            avoid production issues.
          </p>
          {selectedFile ? (
            <p className="text-sm font-medium text-neutral-700">
              Selected file: {selectedFile.name}
            </p>
          ) : null}
          {previewUrl ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-neutral-50 p-3">
              <p className="mb-3 text-sm font-medium text-neutral-700">
                Artwork preview
              </p>
              <div className="relative aspect-square w-full overflow-hidden rounded-[1rem] bg-white">
                <Image
                  src={previewUrl}
                  alt={selectedFile || "Uploaded artwork preview"}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          ) : null}
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <AddToCartButton
            item={cartItem}
            artworkFile={selectedFile}
            disabled={!isCheckoutReady}
            className="inline-flex items-center justify-center w-full px-6 text-base font-semibold transition border rounded-full h-13 border-neutral-200 text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:border-neutral-100 disabled:bg-neutral-100 disabled:text-neutral-400"
          >
            Add to cart
          </AddToCartButton>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!isCheckoutReady || isBuyingNow}
            className="inline-flex items-center justify-center w-full px-6 text-base font-semibold text-white transition bg-pink-500 rounded-full h-13 hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            {isBuyingNow ? "Adding..." : "Buy Now"}
          </button>
        </div>
        {checkoutError ? (
          <p className="text-sm font-medium text-red-700">{checkoutError}</p>
        ) : null}

        <div>
          <div>Guaranteed safe checkout</div>
          <div className="flex gap-2 pt-5">
            <Image
              src="https://wp.cmykprint.shop/wp-content/uploads/2026/01/download.png"
              alt="Secure checkout"
              width={60}
              className="object-contain border-2 "
              height={60}
            />
            <Image
              src="https://printy.themerex.net/wp-content/uploads/2024/01/ps-2.png"
              alt="Secure checkout"
              width={60}
              className="object-contain border-2 "
              height={60}
            />
            <Image
              src="https://printy.themerex.net/wp-content/uploads/2024/01/ps-3.png"
              alt="Secure checkout"
              width={60}
              className="object-contain border-2 "
              height={60}
            />
            <Image
              src="https://printy.themerex.net/wp-content/uploads/2024/01/ps-4.png"
              alt="Secure checkout"
              width={60}
              className="object-contain border-2 "
              height={60}
            />
          </div>
          <div className="flex gap-3 p-2 mt-5 rounded-lg bg-neutral-100 text-neutral-500 tex">
            <Headset strokeWidth={1} size={50} />
            <div>
              Need Help? Call Us{" "}
              <Link
                href="tel:+18183427822"
                className="transition-colors hover:text-pink-500"
              >
                +1 (818) 342-7822
              </Link>{" "}
              <br />
              Monday - Friday 9:00 AM - 5:00 PM
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
