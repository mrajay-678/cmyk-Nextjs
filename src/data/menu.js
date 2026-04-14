function categoryLink(slug) {
	return `/products?category=${slug}`
}

export const menu = [
	{
		title: "Home",
		href: "/",
	},
	{
		title: "DTF Transfer",
		href: "#",
		children: [
			{
				title: "DTF By Size",
				href: "/dtf-by-size",
			},
			{
				title: "DTF Gang Sheet",
				href: "/dtf-gang-sheet",
			},
			{
				title: "DTF Gang Sheet Builder",
				href: "/dtf-gang-sheet-builder",
			},
		],
	},
	{
		title: "UV DTF Stickers",
		href: "#",
		children: [
			{
				title: "UV DTF By Size",
				href: "/uv-dtf-by-size",
			},
			{
				title: "UV DTF Gang Sheet",
				href: "/uv-dtf-gang-sheet",
			},
			{
				title: "UV DTF Gang Sheet Builder",
				href: "/uv-dtf-gang-sheet-builder",
			},
		],
	},
	{
		title: "Products",
		href: "/products",
		children: [
			{
				title: "Apparel",
				children: [
					{ title: "T-shirts", href: categoryLink("t-shirts") },
					{ title: "Polos", href: categoryLink("polos") },
					{ title: "Shirts", href: categoryLink("shirts") },
					{ title: "Hoodies", href: categoryLink("hoodies") },
					{ title: "Sweatpants", href: categoryLink("sweatpants") },
					{ title: "Shorts", href: categoryLink("shorts") },
					{ title: "Caps", href: categoryLink("caps") },
					{ title: "Safety Vests", href: categoryLink("safety-vests") },
				],
			},
			{
				title: "Drinkware",
				children: [
					{ title: "Bottles", href: categoryLink("bottles") },
					{ title: "Mugs", href: categoryLink("mugs") },
					{ title: "Glasses", href: categoryLink("glasses") },
					{ title: "Coasters", href: categoryLink("coasters") },
				],
			},
			{
				title: "Labels",
				children: [{ title: "Stickers / Decals", href: categoryLink("stickers-decals") }],
			},
			{
				title: "Marketing Material",
				children: [
					{ title: "Magnets", href: categoryLink("magnets") },
					{ title: "Buttons", href: categoryLink("buttons") },
					{ title: "Lanyards", href: categoryLink("lanyards") },
					{ title: "Booklets", href: categoryLink("booklets") },
					{ title: "Brochures", href: categoryLink("brochures") },
					{ title: "Flyers", href: categoryLink("flyers") },
					{ title: "Mylar Bags", href: categoryLink("mylar-bags") },
				],
			},
			{
				title: "Stationery",
				children: [
					{ title: "Business Cards", href: categoryLink("business-cards") },
					{ title: "Letterheads", href: categoryLink("letterheads") },
					{ title: "Envelopes", href: categoryLink("envelopes") },
					{ title: "Pens", href: categoryLink("pens") },
					{ title: "Writing Pads", href: categoryLink("writing-pads") },
				],
			},
		],
	},
	{
		title: "Support",
		href: "/support",
		children: [
			{
				title: "Pressing Instructions",
				href: "/pressing-instructions",
			},
			{
				title: "FAQs",
				href: "/faqs",
			},
			{
				title: "Contact Us",
				href: "/contact",
			},
		],
	},
]
