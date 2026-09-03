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
const ARTWORK_DB_NAME = "cmyk-cart-artwork";
const ARTWORK_DB_VERSION = 1;
const ARTWORK_STORE_NAME = "files";

const CartStateContext = createContext(null);
const CartActionsContext = createContext(null);

function clearPersistedCartItems() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

function openArtworkDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(ARTWORK_DB_NAME, ARTWORK_DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(ARTWORK_STORE_NAME)) {
        database.createObjectStore(ARTWORK_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withArtworkStore(mode, callback) {
  const database = await openArtworkDatabase();
  if (!database) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ARTWORK_STORE_NAME, mode);
    const store = transaction.objectStore(ARTWORK_STORE_NAME);
    const result = callback(store);

    transaction.oncomplete = () => {
      database.close();
      resolve(result);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

async function loadSavedArtworkFiles(itemIds) {
  const database = await openArtworkDatabase();
  if (!database) {
    return new Map();
  }

  return new Promise((resolve, reject) => {
    const files = new Map();
    const transaction = database.transaction(ARTWORK_STORE_NAME, "readonly");
    const store = transaction.objectStore(ARTWORK_STORE_NAME);

    itemIds.forEach((id) => {
      const request = store.get(id);
      request.onsuccess = () => {
        if (request.result instanceof File) {
          files.set(id, request.result);
        }
      };
    });

    transaction.oncomplete = () => {
      database.close();
      resolve(files);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

function saveArtworkFile(id, artworkFile) {
  return withArtworkStore("readwrite", (store) => store.put(artworkFile, id));
}

function deleteArtworkFile(id) {
  return withArtworkStore("readwrite", (store) => store.delete(id));
}

function clearArtworkFiles() {
  return withArtworkStore("readwrite", (store) => store.clear());
}

export function CartProvider({ children }) {
  const artworkFilesRef = useRef(new Map());
  const hasLoadedSavedCartRef = useRef(false);
  const [isArtworkReady, setIsArtworkReady] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    window.queueMicrotask(async () => {
      window.localStorage.removeItem(STORAGE_KEY);
      setItems([]);
      hasLoadedSavedCartRef.current = true;

      try {
        artworkFilesRef.current = await loadSavedArtworkFiles([]);
      } catch {
        artworkFilesRef.current = new Map();
      } finally {
        setIsArtworkReady(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedCartRef.current) {
      return;
    }

    clearPersistedCartItems();
  }, [items]);

  const addItem = useCallback((item, artworkFile = null) => {
    if (artworkFile instanceof File) {
      artworkFilesRef.current.set(item.id, artworkFile);
      saveArtworkFile(item.id, artworkFile).catch(() => undefined);
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find((entry) => entry.id === item.id);
      let nextItems;

      if (!existingItem) {
        nextItems = [...currentItems, { ...item, cartQuantity: 1 }];
        clearPersistedCartItems();
        return nextItems;
      }

      nextItems = currentItems.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              ...item,
              cartQuantity: entry.cartQuantity + 1,
            }
          : entry,
      );
      clearPersistedCartItems();
      return nextItems;
    });
  }, []);

  const removeItem = useCallback((id) => {
    artworkFilesRef.current.delete(id);
    deleteArtworkFile(id).catch(() => undefined);
    setItems((currentItems) => {
      const nextItems = currentItems.filter((item) => item.id !== id);
      clearPersistedCartItems();
      return nextItems;
    });
  }, []);

  const updateItemQuantity = useCallback((id, quantity) => {
    const nextQuantity = Math.max(1, Number.parseInt(String(quantity), 10) || 1);
    setItems((currentItems) => {
      const nextItems = currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              cartQuantity: nextQuantity,
            }
          : item,
      );
      clearPersistedCartItems();
      return nextItems;
    });
  }, []);

  const updateArtworkFile = useCallback((id, artworkFile) => {
    if (!(artworkFile instanceof File)) {
      return;
    }

    artworkFilesRef.current.set(id, artworkFile);
    saveArtworkFile(id, artworkFile).catch(() => undefined);
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
    clearArtworkFiles().catch(() => undefined);
    clearPersistedCartItems();
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
      isArtworkReady,
    };
  }, [isArtworkReady, items]);

  const actionsValue = useMemo(
    () => ({
      addItem,
      removeItem,
      updateItemQuantity,
      updateArtworkFile,
      clearCart,
      getArtworkFile,
    }),
    [
      addItem,
      removeItem,
      updateItemQuantity,
      updateArtworkFile,
      clearCart,
      getArtworkFile,
    ],
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
