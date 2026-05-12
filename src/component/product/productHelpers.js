export function stripHtml(value = "") {
	return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

export function toSlug(value = "") {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}

export function parseNumericPrice(value) {
	if (value === null || value === undefined || value === "") {
		return null
	}

	const parsed = Number.parseFloat(String(value).replace(/[^0-9.]/g, ""))
	return Number.isFinite(parsed) ? parsed : null
}

export function extractCurrencySymbol(product) {
	const match = product?.price_html?.replace(/<[^>]*>/g, " ").match(/[^0-9.,\s-]+/)
	return match?.[0] || "$"
}

function parseVariationQuantity(variation) {
	const quantityLabel = variation?.attributes?.map((attribute) => attribute.option || attribute.name || "").join(" ")
	const quantity = Number.parseInt((quantityLabel || "").match(/\d+/)?.[0] || "", 10)
	return Number.isFinite(quantity) ? quantity : null
}

function parseVariationUnitPrice(variation) {
	const quantity = parseVariationQuantity(variation)
	const totalPrice = parseNumericPrice(variation?.price)

	if (!quantity || totalPrice === null) {
		return null
	}

	return totalPrice / quantity
}

export function getLowestUnitPrice(product, variations = []) {
	const variationUnitPrices = variations.map(parseVariationUnitPrice).filter((value) => value !== null)

	if (variationUnitPrices.length) {
		return Math.min(...variationUnitPrices)
	}

	const basePrices = [product?.price, product?.sale_price].map(parseNumericPrice).filter((value) => value !== null)

	if (!basePrices.length) {
		return null
	}

	return Math.min(...basePrices)
}

export function formatCurrency(amount, symbol = "$") {
	if (amount === null || amount === undefined) {
		return "Contact us"
	}

	return `$${amount.toFixed(2)}`
}

export function buildQuantityPriceTable(product, variations = []) {
	const mappedFromVariations = variations
		.map((variation) => {
			const quantity = parseVariationQuantity(variation)
			const totalPrice = parseNumericPrice(variation?.price)

			if (!quantity || totalPrice === null) {
				return null
			}

			return {
				quantity,
				unitPrice: totalPrice,
				variationId: variation.id,
				variationAttributes: variation.attributes || [],
			}
		})
		.filter(Boolean)
		.sort((left, right) => left.quantity - right.quantity)

	if (mappedFromVariations.length >= 2) {
		return mappedFromVariations
	}

	const basePrice = getLowestUnitPrice(product, variations)

	if (!basePrice) {
		return [
			{ quantity: 25, unitPrice: 0 },
			{ quantity: 50, unitPrice: 0 },
			{ quantity: 100, unitPrice: 0 },
			{ quantity: 250, unitPrice: 0 },
		]
	}

	return [
		{ quantity: 25, unitPrice: basePrice },
		{ quantity: 50, unitPrice: basePrice * 0.96 },
		{ quantity: 100, unitPrice: basePrice * 0.92 },
		{ quantity: 250, unitPrice: basePrice * 0.88 },
	]
}
