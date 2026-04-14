"use client"

import { useEffect, useState } from "react"

import { useCart } from "./CartContext"

export default function AddToCartButton({ item, className, children }) {
	const { addItem } = useCart()
	const [wasAdded, setWasAdded] = useState(false)

	useEffect(() => {
		if (!wasAdded) {
			return
		}

		const timeoutId = window.setTimeout(() => setWasAdded(false), 1800)
		return () => window.clearTimeout(timeoutId)
	}, [wasAdded])

	function handleAddToCart() {
		addItem(item)
		setWasAdded(true)
	}

	return (
		<button type="button" onClick={handleAddToCart} className={className}>
			{wasAdded ? "Added to cart" : children}
		</button>
	)
}
