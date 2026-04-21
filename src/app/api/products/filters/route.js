import { NextResponse } from "next/server"

import { getProductCategories, getProductTags } from "../../../../component/product/wooCommerce"

export async function GET(request) {
	void request.url

	const [{ categories, error: categoriesError }, { tags, error: tagsError }] = await Promise.all([getProductCategories(), getProductTags()])

	return NextResponse.json({
		categories,
		tags,
		error: categoriesError || tagsError || null,
	})
}
