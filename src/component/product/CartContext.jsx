"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "cmyk-cart-items";

const CartStateContext = createContext(null);
const CartActionsContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedItems = window.localStorage.getItem(STORAGE_KEY);
      return savedItems ? JSON.parse(savedItems) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((entry) => entry.id === item.id);

      if (!existingItem) {
        return [...currentItems, { ...item, cartQuantity: 1 }];
      }

      return currentItems.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              cartQuantity: entry.cartQuantity + 1,
            }
          : entry,
      );
    });
  }, []);

  const removeItem = useCallback((id) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const stateValue = useMemo(() => {
    const itemCount = items.reduce(
      (total, item) => total + item.cartQuantity,
      0,
    );
    const subtotal = items.reduce(
      (total, item) => total + item.totalPrice * item.cartQuantity,
      0,
    );

    return {
      items,
      itemCount,
      subtotal,
    };
  }, [items]);

  const actionsValue = useMemo(
    () => ({
      addItem,
      removeItem,
      clearCart,
    }),
    [addItem, removeItem, clearCart],
  );

  return (
    <CartActionsContext.Provider value={actionsValue}>
      <CartStateContext.Provider value={stateValue}>
        {children}
      </CartStateContext.Provider>
    </CartActionsContext.Provider>
  );
}

export function useCart() {
  const stateContext = useContext(CartStateContext);
  const actionsContext = useContext(CartActionsContext);

  if (!stateContext || !actionsContext) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return { ...stateContext, ...actionsContext };
}

export function useCartActions() {
  const context = useContext(CartActionsContext);

  if (!context) {
    throw new Error("useCartActions must be used within a CartProvider");
  }

  return context;
}
