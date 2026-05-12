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
		<section className="bg-gray-50 px-6 py-16 text-center md:pt-28">
			<div className="mb-6">
				<h2 className="inline-block px-4 py-1 text-4xl font-semibold leading-tight text-gray-600 sm:text-5xl md:text-6xl">What we offer</h2>
			</div>

			<p className="mx-auto mb-12 max-w-3xl text-base leading-7 text-gray-600 sm:text-lg md:text-xl">Be it team uniforms, corporate gifts or trade show giveaways, there are three ways to get what you need.</p>

			<div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
				{items.map((item, index) => (
					<div key={index} className="flex flex-col items-center">
						<div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white sm:h-36 sm:w-36 md:h-40 md:w-40">{item.icon}</div>

						<h3 className="text-2xl font-semibold mb-3">{item.title}</h3>

						<p className="mb-6 text-base leading-7 text-gray-600 sm:text-lg">{item.desc}</p>

						<button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full font-medium transition">Start Creating</button>
					</div>
				))}
			</div>
		</section>
	)
}
