import { NextResponse } from "next/server"

import { getProductCategories, getProductTags } from "../../../../component/product/wooCommerce"

export const dynamic = "force-dynamic"

export async function GET() {
	const [{ categories, error: categoriesError }, { tags, error: tagsError }] = await Promise.all([getProductCategories(), getProductTags()])

	return NextResponse.json({
		categories,
		tags,
		error: categoriesError || tagsError || null,
	})
}
