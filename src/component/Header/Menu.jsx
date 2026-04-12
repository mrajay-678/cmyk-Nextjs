"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { menu } from "@/data/menu"
export default function Menu() {
	const [activeMenu, setActiveMenu] = useState(null)
	const [activeSubMenu, setActiveSubMenu] = useState(null)

	return (
		<div className="relative">
			{/* TOP NAV */}
			<nav className="flex gap-8 text-sm font-medium">
				{menu.map((item) => (
					<div
						key={item.title}
						className="relative"
						onMouseEnter={() => setActiveMenu(item)}
						onMouseLeave={() => {
							setActiveMenu(null)
							setActiveSubMenu(null)
						}}
					>
						<Link href={item.href || "#"} className="hover:text-pink-500 pb-1 border-b-2 border-transparent hover:border-pink-500">
							{item.title}
						</Link>

						{/* DROPDOWN */}
						{activeMenu?.title === item.title && item.children && (
							<div className="absolute top-3 left-0 mt-4 flex gap-4 z-50">
								{/* FIRST PANEL */}
								<div className="bg-black text-white rounded-2xl p-6 w-64 shadow-xl">
									{item.children.map((child) => (
										<div key={child.title} onMouseEnter={() => setActiveSubMenu(child)} onClick={() => setActiveSubMenu(child)} className="flex items-center justify-between py-2 cursor-pointer hover:text-gray-300">
											<span>{child.title}</span>

											{child.children && <ChevronRight size={16} />}
										</div>
									))}
								</div>

								{/* SECOND PANEL */}
								{activeSubMenu?.children && (
									<div className="bg-black text-white rounded-2xl p-6 w-64 shadow-xl">
										{activeSubMenu.children.map((sub) => (
											<Link key={sub.title} href={sub.href || "#"} className="block py-2 hover:text-gray-300">
												{sub.title}
											</Link>
										))}
									</div>
								)}
							</div>
						)}
					</div>
				))}
			</nav>
		</div>
	)
}
