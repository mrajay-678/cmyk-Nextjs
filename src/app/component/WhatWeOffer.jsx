import { Shirt, Printer, Settings } from "lucide-react"

export default function WhatWeOffer() {
	const items = [
		{
			icon: <Shirt size={40} />,
			title: "DTF Transfers",
			desc: "Perfect for events, businesses and DIY lovers. We print the film and you press it onto the apparel yourself.",
		},
		{
			icon: <Printer size={40} />,
			title: "UV DTF Stickers",
			desc: "Great for tumblers, phone cases and accessories. These are peel-and-stick transfers for solid surfaces.",
		},
		{
			icon: <Settings size={40} />,
			title: "Custom Products",
			desc: "For anyone who wants the finished product. Pick your product, upload your design, we’ll print and ship it.",
		},
	]

	return (
		<section className="pt-40 pb-16 px-6 bg-gray-50 text-center">
			{/* Heading */}
			<div className="mb-6">
				<h2 className="inline-block text-gray-600 px-4 py-1 text-6xl font-semibold">What we offer</h2>
			</div>

			{/* Subtitle */}
			<p className="text-xl text-center text-gray-600 mb-12">Be it team uniforms, corporate gifts or trade show giveaways, there are three ways to get what you need.</p>

			{/* Cards */}
			<div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
				{items.map((item, index) => (
					<div key={index} className="flex flex-col items-center">
						{/* Icon Circle */}
						<div className="w-40 h-40 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-6">{item.icon}</div>

						{/* Title */}
						<h3 className="text-2xl font-semibold mb-3">{item.title}</h3>

						{/* Description */}
						<p className="text-xl text-gray-600 mb-6 ">{item.desc}</p>

						{/* Button */}
						<button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full font-medium transition">Start Creating</button>
					</div>
				))}
			</div>
		</section>
	)
}
