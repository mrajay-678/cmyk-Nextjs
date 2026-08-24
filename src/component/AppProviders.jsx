"use client"

import { ReactLenis } from "lenis/react"
import "lenis/dist/lenis.css"

import { CartProvider } from "./product/CartContext"
import ProductQueryProvider from "./product/ProductQueryProvider"

export default function AppProviders({ children }) {
	return (
		<CartProvider>
			<ProductQueryProvider>
				<ReactLenis root options={{ duration: 2.2 }}>
					{children}
				</ReactLenis>
			</ProductQueryProvider>
		</CartProvider>
	)
}
