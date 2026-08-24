"use client"

import { memo } from "react"

import { sortOptions } from "./catalogConfig"

function ProductFilters({ categories, tags, search, category, tag, sort, onSubmit, onReset, isLoading, isFetching, error }) {
	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
			<div>
				<p className="text-lg font-semibold tracking-[-0.03em] text-neutral-950">Filter Products</p>
				<p className="mt-1 text-sm text-neutral-500">{isFetching ? "Filters are active and results refresh in the background." : "Use category and tags to narrow the catalog fast."}</p>
			</div>
			{error ? <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Filter options are temporarily unavailable. You can still browse products.</p> : null}

			<label className="grid gap-2">
				<span className="text-sm font-medium text-neutral-700">Search products</span>
				<input
					key={`search-${search}`}
					type="search"
					name="q"
					defaultValue={search}
					placeholder="Search tees, mugs, stickers..."
					className="h-12 rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-pink-400"
				/>
			</label>

			<label className="grid gap-2">
				<span className="text-sm font-medium text-neutral-700">Category</span>
				<select
					key={`category-${category}`}
					name="category"
					defaultValue={category}
					disabled={isLoading}
					className="h-12 rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-pink-400"
				>
					<option value="">All categories</option>
					{categories.map((item) => (
						<option key={item.id} value={item.slug || item.id}>
							{item.name}
						</option>
					))}
				</select>
			</label>

			<label className="grid gap-2">
				<span className="text-sm font-medium text-neutral-700">Tags</span>
				<select
					key={`tag-${tag}`}
					name="tag"
					defaultValue={tag}
					disabled={isLoading}
					className="h-12 rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-pink-400"
				>
					<option value="">All tags</option>
					{tags.map((item) => (
						<option key={item.id} value={item.slug || item.id}>
							{item.name}
						</option>
					))}
				</select>
			</label>

			<label className="grid gap-2">
				<span className="text-sm font-medium text-neutral-700">Sort by</span>
				<select
					key={`sort-${sort}`}
					name="sort"
					defaultValue={sort}
					className="h-12 rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-pink-400"
				>
					{sortOptions.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</label>

			<div className="flex flex-wrap gap-3">
				<button type="submit" className="h-12 rounded-full bg-pink-500 px-6 text-sm font-semibold text-white transition hover:bg-pink-600">
					Apply
				</button>
				<button
					type="button"
					onClick={onReset}
					className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-200 px-5 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
				>
					Reset
				</button>
			</div>
		</form>
	)
}

export default memo(ProductFilters)
