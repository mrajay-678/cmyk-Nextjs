"use client";

import { memo, useCallback, useEffect, useState } from "react";

import { useCartActions } from "./CartContext";
import { addCartItem } from "@/lib/woocommerce/cart";

function AddToCartButton({
  item,
  artworkFile = null,
  disabled = false,
  className,
  children,
}) {
  const { addItem } = useCartActions();
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
    if (disabled || isAdding) {
      return;
    }

    const addItemToWooCart = async () => {
      setIsAdding(true);
      setError("");

      try {
        await addCartItem({
          id: Number(item.variationId || item.productId || item.id),
          quantity: Number(item.checkoutQuantity || item.cartQuantity || 1),
          variation: (item.variationAttributes || []).map((attribute) => ({
            attribute: attribute.slug || attribute.name,
            value: attribute.option,
          })),
        });
        addItem(item, artworkFile);
        setWasAdded(true);
      } catch (cartError) {
        setError(
          cartError instanceof Error
            ? cartError.message
            : "Unable to add this item to the WooCommerce cart.",
        );
      } finally {
        setIsAdding(false);
      }
    };

    addItemToWooCart();
  }, [addItem, artworkFile, disabled, isAdding, item]);

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
