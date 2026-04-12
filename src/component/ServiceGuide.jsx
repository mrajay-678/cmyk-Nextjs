import { PackageCheck, Shirt, Sticker } from "lucide-react"

const services = [
	{
		icon: Shirt,
		title: "DTF Transfers",
		description: "If you have a heat press and want to apply the transfers to your own apparel, get DTF Transfers.",
	},
	{
		icon: Sticker,
		title: "UV DTF Stickers",
		description: "If you're decorating hard surfaces like glasses, bottles or phone cases, go with UV DTF Stickers.",
	},
	{
		icon: PackageCheck,
		title: "Custom Products",
		description: "If you want us to handle everything and ship the finished products ready to hand out, shop Custom Products.",
	},
]

export default function ServiceGuide() {
	return (
		<section className="px-6 py-20 bg-white md:px-10 lg:px-16 lg:py-28">
			<div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-24">
				<div className="max-w-2xl">
					<div className="w-full text-6xl font-semibold leading-[0.95] tracking-[-0.04em] text-neutral-900">
						Not sure which
						service you need?
					</div>
					<p className="mt-5 text-2xl text-neutral-800 md:text-4xl md:leading-tight">Think of it this way:</p>
				</div>

				<div className="relative">
					<div className="space-y-8">
						{services.map((service, index) => {
							const Icon = service.icon

							return (
								<div key={service.title} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-5 md:grid-cols-[5.5rem_minmax(0,1fr)] md:gap-8">
									<div className="flex flex-col items-center">
										<div className="flex items-center justify-center w-16 h-16 text-pink-500 rounded-full bg-pink-50 md:h-18 md:w-18">
											<Icon className="h-7 w-7" strokeWidth={1.8} />
										</div>
										{index < services.length - 1 ? <div className="w-px h-24 mt-3 bg-neutral-200 md:h-28" /> : null}
									</div>

									<div className="pt-1">
										<h3 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 ">{service.title}</h3>
										<p className="max-w-xl mt-4 text-xl leading-8 text-neutral-500">{service.description}</p>
									</div>
								</div>
							)
						})}

						<div className="lg:pl-[5.5rem]">
							<button className="py-4 text-base font-semibold text-white transition bg-pink-500 rounded-full px-7 hover:bg-pink-600 md:px-9 md:text-lg">
								Still confused? We got you
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
