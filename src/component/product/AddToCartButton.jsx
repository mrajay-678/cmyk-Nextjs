"use client"

import { memo, useCallback, useEffect, useState } from "react"

import { useCartActions } from "./CartContext"

function AddToCartButton({
	item,
	artworkFile = null,
	disabled = false,
	className,
	children,
}) {
	const { addItem } = useCartActions()
	const [wasAdded, setWasAdded] = useState(false)

	useEffect(() => {
		if (!wasAdded) {
			return
		}

		const timeoutId = window.setTimeout(() => setWasAdded(false), 1800)
		return () => window.clearTimeout(timeoutId)
	}, [wasAdded])

	const handleAddToCart = useCallback(() => {
		if (disabled) {
			return
		}

		addItem(item, artworkFile)
		setWasAdded(true)
	}, [addItem, artworkFile, disabled, item])

	return (
		<button
			type="button"
			onClick={handleAddToCart}
			disabled={disabled}
			className={className}
		>
			{wasAdded ? "Added to cart" : children}
		</button>
	)
}

export default memo(AddToCartButton)
