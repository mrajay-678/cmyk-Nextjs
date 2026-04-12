import Hero from "./component/Hero"
import WhatWeOffer from "./component/WhatWeOffer"
import ArtToCraft from "./component/ArtToCraft"

export default function Home() {
	return (
		<>
			<div className="">
				<Hero />
				<WhatWeOffer />
				<ArtToCraft />
			</div>
		</>
	)
}
