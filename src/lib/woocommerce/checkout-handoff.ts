import { getCurrentCart } from "@/lib/woocommerce/cart";
import {
  findMatchingWooCartItem,
  removeDuplicateGangSheetItems,
  reconcileWooCartToLocalItems,
} from "@/lib/woocommerce/cart-sync";

export type CheckoutLocalItem = {
  id: string;
  productId?: number;
  variationId?: number | null;
  variationAttributes?: Array<{ slug?: string; name?: string; option: string }>;
  name: string;
  productUrl?: string;
  image?: string;
  selectedQuantity?: number;
  checkoutQuantity?: number;
  cartQuantity: number;
  totalPrice: number;
  unitPrice?: number;
  currencySymbol?: string;
  artworkName?: string;
  wooCartKey?: string;
};

const emptyAddress = {
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "CA",
  postcode: "",
  country: "US",
  phone: "",
  email: "",
};

export function isLocalArtworkLoading({
  localItems,
  isArtworkReady,
}: {
  localItems: CheckoutLocalItem[];
  isArtworkReady: boolean;
}) {
  return (
    localItems.some((item) => Boolean(item.artworkName)) && !isArtworkReady
  );
}

export function hasMissingLocalArtwork({
  localItems,
  isArtworkReady,
  getArtworkFile,
}: {
  localItems: CheckoutLocalItem[];
  isArtworkReady: boolean;
  getArtworkFile: (id: string) => File | null;
}) {
  return localItems.some(
    (item) =>
      isArtworkReady && Boolean(item.artworkName) && !getArtworkFile(item.id),
  );
}

export async function createHostedCheckoutUrl({
  localItems,
  getArtworkFile,
}: {
  localItems: CheckoutLocalItem[];
  getArtworkFile: (id: string) => File | null;
}) {
  const searchParams = new URLSearchParams(window.location.search);
  const isBagsCartReturn = searchParams.get("cmyk_bags_cart") === "1";
  const currentCart = await getCurrentCart();
  let latestCart = isBagsCartReturn
    ? currentCart
    : await removeDuplicateGangSheetItems(currentCart);

  if (process.env.NODE_ENV === "development") {
    console.info("[CMYK Checkout Step 1] Preparing checkout handoff", JSON.stringify({
      isBagsCartReturn,
      wooItemsCount: latestCart.items_count,
    }));
  }

  const latestLocalItems = localItems.filter((localItem) =>
    Boolean(findMatchingWooCartItem(latestCart?.items, localItem)),
  );

  // Keep locally uploaded artwork products and builder-created Woo items,
  // then remove stale Woo rows before handing the cart to WordPress.
  if (latestLocalItems.length) {
    latestCart = await reconcileWooCartToLocalItems(
      latestCart,
      latestLocalItems,
    );
  }

  const latestLocalWooKeys = new Set(
    latestLocalItems
      .map((item) => findMatchingWooCartItem(latestCart?.items, item)?.key)
      .filter(Boolean),
  );
  const latestWooItems = (latestCart?.items || []).filter(
    (item) => !latestLocalWooKeys.has(item.key),
  );

  const checkoutItems = [
    ...latestLocalItems,
    ...latestWooItems.map((item) => ({
      id: item.id,
      type: item.type,
      quantity: item.quantity,
      key: item.key,
      name: item.name,
      permalink: item.permalink,
      variation: item.variation,
      item_data: item.item_data,
      extensions: item.extensions,
    })),
  ];

  if (!checkoutItems.length) {
    throw new Error("Your cart is empty.");
  }

  const formData = new FormData();
  formData.append("items", JSON.stringify(checkoutItems));
  formData.append("billing_address", JSON.stringify(emptyAddress));
  formData.append("shipping_address", JSON.stringify(emptyAddress));
  formData.append("customer_note", "");
  formData.append("source", isBagsCartReturn ? "bags-cart" : "next-cart");

  latestLocalItems.forEach((item, index) => {
    const artworkFile = getArtworkFile(item.id);
    if (artworkFile) {
      formData.append(`artwork-${index}`, artworkFile, artworkFile.name);
    }
  });

  const response = await fetch("/api/checkout/cart", {
    method: "POST",
    body: formData,
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.checkoutUrl) {
    throw new Error(
      result.error || "Unable to open secure WooCommerce payment.",
    );
  }

  if (process.env.NODE_ENV === "development") {
    const checkoutUrl = new URL(String(result.checkoutUrl));
    console.info("[CMYK Checkout Step 2] Redirect URL received", JSON.stringify({
      checkoutHost: checkoutUrl.origin,
      checkoutPath: checkoutUrl.pathname,
      hasCheckoutRef: checkoutUrl.searchParams.has("cmyk_checkout_ref"),
      source: isBagsCartReturn ? "bags-cart" : "next-cart",
    }));
  }

  return String(result.checkoutUrl);
}
