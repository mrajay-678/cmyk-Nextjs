"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "cmyk-cart-items"

const CartContext = createContext(null)

export function CartProvider({ children }) {
	const [items, setItems] = useState([])
	const [isHydrated, setIsHydrated] = useState(false)

	useEffect(() => {
		try {
			const savedItems = window.localStorage.getItem(STORAGE_KEY)
			setItems(savedItems ? JSON.parse(savedItems) : [])
		} catch {
			setItems([])
		} finally {
			setIsHydrated(true)
		}
	}, [])

	useEffect(() => {
		if (!isHydrated) return
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
	}, [items, isHydrated])

	function addItem(item) {
		setItems((currentItems) => {
			const existingItem = currentItems.find((entry) => entry.id === item.id)

			if (!existingItem) {
				return [...currentItems, { ...item, cartQuantity: 1 }]
			}

			return currentItems.map((entry) =>
				entry.id === item.id
					? {
							...entry,
							cartQuantity: entry.cartQuantity + 1,
					  }
					: entry
			)
		})
	}

	function removeItem(id) {
		setItems((currentItems) => currentItems.filter((item) => item.id !== id))
	}

	function clearCart() {
		setItems([])
	}

	const value = useMemo(() => {
		const itemCount = items.reduce((total, item) => total + item.cartQuantity, 0)
		const subtotal = items.reduce((total, item) => total + item.totalPrice * item.cartQuantity, 0)

		return {
			items,
			itemCount,
			subtotal,
			addItem,
			removeItem,
			clearCart,
		}
	}, [items])

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
	const context = useContext(CartContext)

	if (!context) {
		throw new Error("useCart must be used within a CartProvider")
	}

	return context
}
