"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "cmyk-cart-items";

const CartStateContext = createContext(null);
const CartActionsContext = createContext(null);

export function CartProvider({ children }) {
  const artworkFilesRef = useRef(new Map());
  const hasLoadedSavedCartRef = useRef(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    window.queueMicrotask(() => {
      try {
        const savedItems = window.localStorage.getItem(STORAGE_KEY);
        setItems(savedItems ? JSON.parse(savedItems) : []);
      } catch {
        setItems([]);
      } finally {
        hasLoadedSavedCartRef.current = true;
      }
    });
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedCartRef.current) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item, artworkFile = null) => {
    if (artworkFile instanceof File) {
      artworkFilesRef.current.set(item.id, artworkFile);
    }

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
    artworkFilesRef.current.delete(id);
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }, []);

  const updateArtworkFile = useCallback((id, artworkFile) => {
    if (!(artworkFile instanceof File)) {
      return;
    }

    artworkFilesRef.current.set(id, artworkFile);
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              artworkName: artworkFile.name,
            }
          : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    artworkFilesRef.current.clear();
    setItems([]);
  }, []);

  const getArtworkFile = useCallback((id) => {
    return artworkFilesRef.current.get(id) || null;
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
      updateArtworkFile,
      clearCart,
      getArtworkFile,
    }),
    [addItem, removeItem, updateArtworkFile, clearCart, getArtworkFile],
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
