export const defaultSort = "date-desc"

export const sortOptions = [
	{ label: "Newest First", value: "date-desc" },
	{ label: "Oldest First", value: "date-asc" },
	{ label: "Price: Low to High", value: "price-asc" },
	{ label: "Price: High to Low", value: "price-desc" },
	{ label: "Name: A to Z", value: "title-asc" },
	{ label: "Name: Z to A", value: "title-desc" },
]

export const sortMap = {
	"date-desc": { orderby: "date", order: "desc" },
	"date-asc": { orderby: "date", order: "asc" },
	"price-asc": { orderby: "price", order: "asc" },
	"price-desc": { orderby: "price", order: "desc" },
	"title-asc": { orderby: "title", order: "asc" },
	"title-desc": { orderby: "title", order: "desc" },
}
