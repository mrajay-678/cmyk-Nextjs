"use client"

import { ReactLenis } from "lenis/react"
import "lenis/dist/lenis.css"

import { CartProvider } from "./product/CartContext"

export default function AppProviders({ children }) {
	return (
		<CartProvider>
			<ReactLenis root options={{ duration: 2.2 }}>
				{children}
			</ReactLenis>
		</CartProvider>
	)
}
