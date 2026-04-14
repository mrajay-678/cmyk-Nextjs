import Hero from "../component/Hero"
import WhatWeOffer from "../component/WhatWeOffer"
import ArtToCraft from "../component/ArtToCraft"
import ProductGallery from "../component/ProductGallery"
import TestimonialSection from "../component/TestimonialSection"
import TypeWriter from "../component/UI/TypeWriter"
import ServiceGuide from "../component/ServiceGuide"

export default function Home() {
	return (
		<>
			<div className="">
				<Hero />
				<WhatWeOffer />
				<ArtToCraft />
				<TypeWriter appendClass={""} prefix={""}/>
				<ServiceGuide />
				<ProductGallery />
				<TestimonialSection />
			</div>
		</>
	)
}
