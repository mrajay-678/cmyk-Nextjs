"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ProductDetailLink({ href, className, children }) {
	const router = useRouter()

	function prefetchProduct() {
		router.prefetch(href)
	}

	return (
		<Link
			href={href}
			prefetch={true}
			onMouseEnter={prefetchProduct}
			onFocus={prefetchProduct}
			onTouchStart={prefetchProduct}
			className={className}
		>
			{children}
		</Link>
	)
}
