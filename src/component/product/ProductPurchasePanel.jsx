"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AddToCartButton from "./AddToCartButton";
import { useCartActions } from "@/component/product/CartContext";
import { formatCurrency } from "./productHelpers";
import GangSheetBuilder from "@/component/gang-sheet/GangSheetBuilder";
import { addCartItem } from "@/lib/woocommerce/cart";
import { Headset } from "lucide-react";
import Link from "next/link";

export default function ProductPurchasePanel({
  product,
  quantityOptions,
  quantityRows = [],
  lowestPrice,
  currencySymbol,
  variation,
}) {
  const sizeOptions = product.attributes[0].options.includes('22" x 12"')
    ? product.attributes[0].options
    : [];
  const router = useRouter();
  const { addItem } = useCartActions();
  const [selectedQuantity, setSelectedQuantity] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const numericQuantity = Number.parseInt(selectedQuantity, 10);
  const hasSelectedQuantity =
    Number.isFinite(numericQuantity) && numericQuantity > 0;
  const selectedQuantityRow = quantityRows.find(
    (row) => row.quantity === numericQuantity,
  );
  const selectedTotalPrice = hasSelectedQuantity
    ? (lowestPrice[numericQuantity] ?? null)
    : null;
  const selectedUnitPrice =
    selectedTotalPrice && numericQuantity
      ? selectedTotalPrice / numericQuantity
      : null;
  const isCheckoutReady = hasSelectedQuantity && Boolean(selectedFile);
  const cartItem = {
    id: [
      product.id,
      numericQuantity,
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
    selectedQuantity: numericQuantity,
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

  const isDtfBySize =
    Number(product.id) === 28426 || product.slug === "dtf-by-size";

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

  function getWooCartPayload() {
    return {
      id: Number(cartItem.variationId || cartItem.productId || cartItem.id),
      quantity: Number(cartItem.checkoutQuantity || cartItem.cartQuantity || 1),
      variation: (cartItem.variationAttributes || []).map((attribute) => ({
        attribute: attribute.slug || attribute.name,
        value: attribute.option,
      })),
    };
  }

  async function handleBuyNow() {
    if (!isCheckoutReady || isBuyingNow) {
      return;
    }

    setCheckoutError("");
    setIsBuyingNow(true);

    try {
      await addCartItem(getWooCartPayload());
      addItem(cartItem, selectedFile);
      router.push("/checkout");
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Unable to add this item to the WooCommerce cart.",
      );
    } finally {
      setIsBuyingNow(false);
    }
  }

  if (isDtfBySize) {
    return (
      <div className="space-y-5 rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:p-6">
        <GangSheetBuilder
          mode="woo-product"
          productId="28426"
          productType="7"
          sdkVersion="1.7.7"
          label="Upload Image By Size"
          buttonClassName="inline-flex h-13 w-full items-center justify-center rounded-full bg-pink-500 px-6 text-base font-semibold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
        >
          Upload Image By Size
        </GangSheetBuilder>
      </div>
    );
  }

  return (
    <section>
      <div className="space-y-6 rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:p-6">
        <div className="grid grid-cols-2 gap-2 md:hidden">
          {quantityOptions.map((quantity) => (
            <div key={quantity} className="rounded-2xl bg-neutral-50 p-3">
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
          <table className="min-w-full rounded-2xl border-separate border-spacing-y-2 bg-neutral-50 px-4">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-neutral-400">
                <th className="pb-2 pr-6">Quantity</th>
                {sizeOptions?.length === 0 &&
                  quantityOptions.map((quantity) => (
                    <th
                      key={quantity}
                      className="px-4 py-3 text-center font-medium"
                    >
                      {quantity}
                    </th>
                  ))}
                {sizeOptions?.length !== 0 &&
                  variation.map((variation) => (
                    <th
                      key={variation.id}
                      className="px-4 min-w-[8rem] py-3 text-center font-medium"
                    >
                      {variation.attributes[0].option}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              <tr className=" text-sm text-neutral-700">
                <td className="rounded-l-2xl py-3 font-medium text-neutral-950">
                  Per unit price
                </td>
                {sizeOptions?.length === 0 &&
                  quantityOptions.map((quantity) => (
                    <td key={quantity} className="px-4 py-3">
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
            <div className="mt-3 grid gap-4 sm:flex sm:flex-wrap sm:items-end sm:gap-6">
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
            <div className="mt-3 grid gap-4 sm:flex sm:flex-wrap sm:items-end sm:gap-6">
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
            className="h-12 rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-pink-400"
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
              quantityOptions.map((quantity) => (
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
            className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-700 file:mb-2 file:mr-4 file:rounded-full file:border-0 file:bg-neutral-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-pink-500 sm:px-4 sm:file:mb-0"
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

        <div className="flex flex-col gap-3 sm:flex-row">
          <AddToCartButton
            item={cartItem}
            artworkFile={selectedFile}
            disabled={!isCheckoutReady}
            className="inline-flex w-full h-13 items-center justify-center rounded-full border border-neutral-200 px-6 text-base font-semibold text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:border-neutral-100 disabled:bg-neutral-100 disabled:text-neutral-400"
          >
            Add to cart
          </AddToCartButton>
          <div className="w-full">
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!isCheckoutReady || isBuyingNow}
              className="inline-flex w-full h-13 items-center justify-center rounded-full bg-pink-500 px-6 text-base font-semibold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
            >
              {isBuyingNow ? "Adding..." : "Buy Now"}
            </button>
          </div>
        </div>
        {checkoutError ? (
          <p className="text-sm font-medium text-red-700">{checkoutError}</p>
        ) : null}

        <div>
          <div>Guaranteed safe checkout</div>
          <div className="flex gap-2 pt-5">
            <Image
              src="https://cmykprint.shop/wp-content/uploads/2026/01/download.png"
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
          <div className="bg-neutral-100 p-2 text-neutral-500 rounded-lg flex gap-3 mt-5 tex">
            <Headset strokeWidth={1} size={50} />
            <div>
              Need Help? Call Us{" "}
              <Link
                href="tel:+18183427822"
                className="hover:text-pink-500 transition-colors"
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
