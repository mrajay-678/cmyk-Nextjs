import React from "react"
import Image from "next/image"
import Menu from "./Menu"
import { ShoppingCart } from "lucide-react"

const Header = () => {
	return (
		<header className="bg-white w-[95vw] mx-auto text-xl flex items-center">
			<div className="w-6/12">
				<Menu />
			</div>
			<div className="flex items-center justify-between w-6/12 -ms-20">
				<div className="relative h-24 w-36">
					<Image src="https://cmykprint.shop/wp-content/uploads/2025/11/cropped-logocymk-1.webp" fill objectFit="contain" alt="CMYK Print Shop" />
				</div>
				<div className="">
					<ShoppingCart color="#000000" />
				</div>
			</div>
		</header>
	)
}

export default Header
