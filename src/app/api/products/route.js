import { NextResponse } from "next/server"

import { defaultSort, sortMap } from "../../../component/product/catalogConfig"
import { getProducts } from "../../../component/product/wooCommerce"

export async function GET(request) {
	const { searchParams } = new URL(request.url)

	const search = searchParams.get("q") || ""
	const category = searchParams.get("category") || ""
	const tag = searchParams.get("tag") || ""
	const sort = searchParams.get("sort") || defaultSort
	const parsedPage = Number.parseInt(searchParams.get("page") || "1", 10)
	const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
	const selectedSort = sortMap[sort] || sortMap[defaultSort]

	const result = await getProducts({
		page,
		search,
		category,
		tag,
		orderby: selectedSort.orderby,
		order: selectedSort.order,
	})

	return NextResponse.json(result)
}
