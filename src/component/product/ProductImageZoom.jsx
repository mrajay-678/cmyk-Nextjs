"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

import { ProductMediaSkeleton } from "./ProductDetailSkeleton"

export default function ProductImageZoom({ images, title }) {
	const gallery = images?.length ? images : [{ src: "https://placehold.co/900x1100/F5F0EA/1F1F1F?text=Product+Image", alt: title }]
	const [activeImage, setActiveImage] = useState(gallery[0])
	const [isZoomed, setIsZoomed] = useState(false)
	const [position, setPosition] = useState({ x: 50, y: 50 })
	const [isGalleryReady, setIsGalleryReady] = useState(false)

	useEffect(() => {
		const frameId = window.requestAnimationFrame(() => setIsGalleryReady(true))
		return () => window.cancelAnimationFrame(frameId)
	}, [])

	function handleMove(event) {
		const bounds = event.currentTarget.getBoundingClientRect()
		const x = ((event.clientX - bounds.left) / bounds.width) * 100
		const y = ((event.clientY - bounds.top) / bounds.height) * 100
		setPosition({ x, y })
	}

	if (!isGalleryReady) {
		return <ProductMediaSkeleton />
	}

	return (
		<div className="space-y-3 sm:space-y-4">
			<div
				onMouseEnter={() => setIsZoomed(true)}
				onMouseLeave={() => setIsZoomed(false)}
				onMouseMove={handleMove}
				className="relative overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white sm:rounded-none"
			>
				<div className="relative aspect-square sm:aspect-[4/5]">
					<Image
						src={activeImage.src}
						alt={activeImage.alt || title}
						fill
						sizes="(max-width: 640px) 92vw, (max-width: 1023px) 70vw, 50vw"
						className={`object-contain transition duration-300 sm:object-cover p-5 ${isZoomed ? "scale-[1.8]" : "scale-100"}`}
						style={isZoomed ? { transformOrigin: `${position.x}% ${position.y}%` } : undefined}
					/>
				</div>
				<div className="pointer-events-none absolute bottom-4 left-4 hidden rounded-full bg-white/90 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-neutral-700 backdrop-blur-sm sm:block">
					Hover to zoom
				</div>
			</div>

			<div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:pb-0">
				{gallery.map((image) => (
					<button
						key={image.id || image.src}
						type="button"
						onClick={() => setActiveImage(image)}
						className={`relative w-20 shrink-0 overflow-hidden rounded-2xl border sm:w-auto sm:rounded-[1.25rem] ${activeImage.src === image.src ? "border-neutral-950" : "border-neutral-200"}`}
					>
						<div className="relative aspect-square">
							<Image src={image.src} alt={image.alt || title} fill sizes="25vw" className="object-cover" />
						</div>
					</button>
				))}
			</div>
		</div>
	)
}
