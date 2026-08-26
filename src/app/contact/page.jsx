import { Mail, MapPin, Smartphone } from "lucide-react"
import ContactForm from "@/component/Contact/ContactForm"

export const metadata = {
	title: "Contact | CMYK Print Shop",
	description: "Contact CMYK Print Shop for DTF transfers, UV DTF stickers, apparel, and custom print projects.",
}

const contactItems = [
	{
		icon: MapPin,
		text: "9607 Canoga Ave, Chatsworth, CA 91311",
	},
	{
		icon: Smartphone,
		text: "+1 (818) 342-7822",
		href: "tel:+18183427822",
	},
	{
		icon: Mail,
		text: "hello@cmykprint.shop",
		href: "mailto:hello@cmykprint.shop",
	},
]

export default function ContactPage() {
	return (
		<main className="bg-white">
			
			<section className="relative overflow-hidden bg-[#4657f4] px-4 py-14 md:px-8 md:py-24">
				<div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(20,28,130,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(20,28,130,0.55)_1px,transparent_1px)] [background-size:28px_28px]" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_58%)]" />

				<div className="relative mx-auto grid w-full max-w-360 gap-10 rounded-[28px] bg-white px-5 py-8 shadow-[0_28px_90px_rgba(15,23,42,0.16)] sm:px-6 sm:py-10 md:grid-cols-[0.88fr_1.12fr] md:gap-14 md:rounded-[34px] md:px-12 md:py-14 lg:px-16">
					<div>
						<h1 className="text-3xl tracking-normal text-neutral-950 sm:text-4xl md:text-6xl">Let&apos;s Talk!</h1>
						<p className="mt-7 max-w-md text-base leading-7 text-neutral-500">
							Got questions? Drop us a line. We&apos;re real humans and we&apos;ll get back to you within 3 business days.
							Usually sooner.
						</p>

						<div className="mt-9 space-y-6">
							{contactItems.map(({ icon: Icon, text, href }) => {
								const content = (
									<>
										<Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-pink-500" strokeWidth={1.8} />
										<span>{text}</span>
									</>
								)

								return href ? (
									<a key={text} href={href} className="flex items-start gap-4 break-words text-sm font-medium text-neutral-700 hover:text-pink-500">
										{content}
									</a>
								) : (
									<div key={text} className="flex items-start gap-4 break-words text-sm font-medium text-neutral-700">
										{content}
									</div>
								)
							})}
						</div>
					</div>

					<div className="md:pt-8">
						<ContactForm />
					</div>
				</div>
			</section>

			<section className="h-[420px] overflow-hidden md:h-[460px]">
				<iframe
					title="CMYK Print Shop location"
					src="https://www.google.com/maps?q=9607%20Canoga%20Ave%2C%20Chatsworth%2C%20CA%2091311&output=embed"
					className="h-full w-full border-0"
					loading="lazy"
					referrerPolicy="no-referrer-when-downgrade"
					allowFullScreen
				/>
			</section>
		</main>
	)
}
