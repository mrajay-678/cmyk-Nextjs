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
					<div className="w-full text-4xl font-semibold leading-tight text-neutral-900 sm:text-5xl lg:text-6xl lg:leading-[0.95]">
						Not sure which
						service you need?
					</div>
					<p className="mt-5 text-xl text-neutral-800 md:text-3xl md:leading-tight lg:text-4xl">Think of it this way:</p>
				</div>

				<div className="relative">
					<div className="space-y-8">
						{services.map((service, index) => {
							const Icon = service.icon

							return (
								<div key={service.title} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 md:grid-cols-[5.5rem_minmax(0,1fr)] md:gap-8">
									<div className="flex flex-col items-center">
										<div className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-50 text-pink-500 md:h-18 md:w-18">
											<Icon className="h-7 w-7" strokeWidth={1.8} />
										</div>
										{index < services.length - 1 ? <div className="w-px h-24 mt-3 bg-neutral-200 md:h-28" /> : null}
									</div>

									<div className="pt-1">
										<h3 className="text-xl font-semibold text-neutral-950 md:text-2xl">{service.title}</h3>
										<p className="mt-3 max-w-xl text-base leading-7 text-neutral-500 md:mt-4 md:text-xl md:leading-8">{service.description}</p>
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
