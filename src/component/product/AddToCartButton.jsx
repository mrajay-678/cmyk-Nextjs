"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "./CartContext";
import { addCartItem, buildAddCartItemInput } from "@/lib/woocommerce/cart";
import {
  findNewWooCartItem,
  mergeLocalCartItems,
  rememberWooCartItems,
  reconcileWooCartToLocalItems,
} from "@/lib/woocommerce/cart-sync";

function AddToCartButton({
  item,
  artworkFile = null,
  disabled = false,
  className,
  children,
}) {
  const router = useRouter();
  const { items, addItem } = useCart();
  const isAddingRef = useRef(false);
  const [wasAdded, setWasAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!wasAdded) {
      return;
    }

    const timeoutId = window.setTimeout(() => setWasAdded(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [wasAdded]);

  const handleAddToCart = useCallback(() => {
    if (disabled || isAddingRef.current) {
      return;
    }

    const addItemToWooCart = async () => {
      isAddingRef.current = true;
      setIsAdding(true);
      setError("");

      try {
        const nextLocalItems = mergeLocalCartItems(items, item);
        const wooCart = await addCartItem(buildAddCartItemInput(item));
        const wooItem = findNewWooCartItem(wooCart.items, item, items);
        const keyedLocalItems = nextLocalItems.map((entry) =>
          entry.id === item.id ? { ...entry, wooCartKey: wooItem?.key } : entry,
        );
        await reconcileWooCartToLocalItems(wooCart, keyedLocalItems);
        if (wooItem) {
          rememberWooCartItems([wooItem]);
        }
        addItem({ ...item, wooCartKey: wooItem?.key }, artworkFile);
        setWasAdded(true);
        router.push("/cart");
      } catch (cartError) {
        setError(
          cartError instanceof Error
            ? cartError.message
            : "Unable to add this item to the WooCommerce cart.",
        );
      } finally {
        isAddingRef.current = false;
        setIsAdding(false);
      }
    };

    addItemToWooCart();
  }, [addItem, artworkFile, disabled, item, items, router]);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || isAdding}
        className={className}
      >
        {isAdding ? "Adding..." : wasAdded ? "Added to cart" : children}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

export default memo(AddToCartButton);
