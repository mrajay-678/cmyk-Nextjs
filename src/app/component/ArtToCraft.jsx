import Image from "next/image"

export default function ArtToCraft() {
	return (
		<section className="py-20 px-6 bg-white">
			<div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
				{/* LEFT SIDE */}
				<div className="relative flex flex-col items-center md:items-start">
					{/* Arrow + Text */}
					<div className="flex items-center gap-3 mb-4">
						<span className="text-4xl">↗</span>
						<h2 className="text-4xl font-semibold">Your Art</h2>
					</div>

					{/* Image */}
					<div className="relative w-[300px] h-[380px] bg-black">
						<Image src="https://cmykprint.shop/wp-content/uploads/2025/11/Mask-group-1-2.png" alt="Your Art" fill className="object-cover" />
					</div>
				</div>

				{/* RIGHT SIDE */}
				<div className="relative flex flex-col items-center md:items-end">
					{/* Image */}
					<div className="relative w-[350px] h-[420px] bg-gray-100 mb-6">
						<Image src="https://cmykprint.shop/wp-content/uploads/2025/11/Mask-group-2-1.png" alt="Our Craft" fill className="object-contain" />
					</div>

					{/* Arrow + Text */}
					<div className="flex items-center gap-3 mb-6">
						<h2 className="text-4xl font-semibold">Our Craft</h2>
						<span className="text-4xl">↘</span>
					</div>

					{/* Button */}
					<button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full transition">Start Creating</button>
				</div>
			</div>
		</section>
	)
}
