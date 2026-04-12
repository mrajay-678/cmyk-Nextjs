import Image from "next/image"

export default function ArtToCraft() {
	return (
		<section className="py-20 pt-30 px-6 bg-white">
			<div className="grid items-center">
				<div className="relative flex flex-col items-center md:items-center">
					{/* Image */}
					<div className="relative min-w-100 w-[75vw] max-v-[75vw]  min-h-100 h-[75vh] max-h-[75vh] mb-6">
						<Image src="https://cmykprint.shop/wp-content/uploads/2025/12/6-3.png" alt="Our Craft" fill className="object-contain" />
					</div>
					<div className="max-w-[75vw] w-full text-end">
						<button className="bg-pink-500 hover:bg-pink-600 text-white ms-auto px-6 py-3 rounded-full transition">Start Creating</button>
					</div>
				</div>
			</div>
		</section>
	)
}
