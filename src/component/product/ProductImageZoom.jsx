"use client"

import Image from "next/image"
import { useState } from "react"

export default function ProductImageZoom({ images, title }) {
	const gallery = images?.length ? images : [{ src: "https://placehold.co/900x1100/F5F0EA/1F1F1F?text=Product+Image", alt: title }]
	const [activeImage, setActiveImage] = useState(gallery[0])
	const [isZoomed, setIsZoomed] = useState(false)
	const [position, setPosition] = useState({ x: 50, y: 50 })

	function handleMove(event) {
		const bounds = event.currentTarget.getBoundingClientRect()
		const x = ((event.clientX - bounds.left) / bounds.width) * 100
		const y = ((event.clientY - bounds.top) / bounds.height) * 100
		setPosition({ x, y })
	}

	return (
		<div className="space-y-4">
			<div
				onMouseEnter={() => setIsZoomed(true)}
				onMouseLeave={() => setIsZoomed(false)}
				onMouseMove={handleMove}
				className="relative overflow-hidden border border-neutral-200 bg-white"
			>
				<div className="relative aspect-[4/5]">
					<Image
						src={activeImage.src}
						alt={activeImage.alt || title}
						fill
						sizes="(max-width: 1023px) 100vw, 50vw"
						className={`object-cover transition duration-300 ${isZoomed ? "scale-[1.8]" : "scale-100"}`}
						style={isZoomed ? { transformOrigin: `${position.x}% ${position.y}%` } : undefined}
					/>
				</div>
				<div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-neutral-700 backdrop-blur-sm">
					Hover to zoom
				</div>
			</div>

			<div className="grid grid-cols-4 gap-3">
				{gallery.map((image) => (
					<button
						key={image.id || image.src}
						type="button"
						onClick={() => setActiveImage(image)}
						className={`relative overflow-hidden rounded-[1.25rem] border ${activeImage.src === image.src ? "border-neutral-950" : "border-neutral-200"}`}
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
