import { cacheLife, cacheTag } from "next/cache";
import { categoryTagLink } from "@/data/menu";
import { buildQuantityPriceTable } from "./productHelpers";

const WC_BASE_URL = process.env.NEXT_PUBLIC_WC_URL;
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;
const EXCLUDED_PRODUCT_MENU_CATEGORY_SLUGS = new Set([
  "dtf-transfer",
  "uv-dtf-transfer",
]);

function buildApiUrl(path, query = {}) {
  if (!WC_BASE_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    return null;
  }

  const url = new URL(`/wp-json/wc/v3${path}`, WC_BASE_URL);

  url.searchParams.set("consumer_key", WC_CONSUMER_KEY);
  url.searchParams.set("consumer_secret", WC_CONSUMER_SECRET);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

function parseJsonFromText(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (char !== "{" && char !== "[") {
        continue;
      }

      try {
        return JSON.parse(text.slice(index));
      } catch {
        continue;
      }
    }
  }

  return null;
}

function isNumericTaxonomyValue(value) {
  return /^\d+$/.test(String(value || "").trim());
}

function matchesTaxonomyValue(item, value) {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();
  return (
    item?.slug?.toLowerCase() === normalizedValue ||
    item?.name?.toLowerCase() === normalizedValue
  );
}

async function resolveTaxonomyFilter(value, fetchItems) {
  if (!value) {
    return "";
  }

  if (isNumericTaxonomyValue(value)) {
    return value;
  }

  const { items } = await fetchItems();
  const matchedItem = items.find((item) => matchesTaxonomyValue(item, value));
  return matchedItem?.id ? String(matchedItem.id) : "";
}

async function fetchWooCommerce(path, query) {
  const url = buildApiUrl(path, query);

  if (!url) {
    return { data: [], error: "WooCommerce env vars are missing.", meta: {} };
  }

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return {
        data: [],
        error: `WooCommerce request failed with status ${response.status}.`,
        meta: {},
      };
    }

    const data = parseJsonFromText(await response.text());

    if (data === null) {
      return {
        data: [],
        error: "WooCommerce returned an invalid JSON response.",
        meta: {},
      };
    }

    return {
      data,
      error: null,
      meta: {
        total: Number(response.headers.get("x-wp-total") || 0),
        totalPages: Number(response.headers.get("x-wp-totalpages") || 0),
      },
    };
  } catch {
    return {
      data: [],
      error:
        "Could not connect to WooCommerce. Please verify the store URL and API credentials.",
      meta: {},
    };
  }
}

async function fetchWooCommerceCached(path, query, tags = []) {
  "use cache";

  cacheLife("hours");

  cacheTag("woocommerce");
  tags.forEach((tag) => cacheTag(tag));

  return fetchWooCommerce(path, query);
}

export async function getProductCategories() {
  const { data, error } = await fetchWooCommerceCached(
    "/products/categories",
    {
      per_page: 100,
      hide_empty: true,
      orderby: "name",
      order: "asc",
    },
    ["woocommerce-products", "woocommerce-filters"],
  );
  return { categories: Array.isArray(data) ? data : [], error };
}

export async function getProductTags() {
  const { data, error } = await fetchWooCommerceCached(
    "/products/tags",
    {
      per_page: 100,
      hide_empty: true,
      orderby: "name",
      order: "asc",
    },
    ["woocommerce-products", "woocommerce-filters"],
  );

  return { tags: Array.isArray(data) ? data : [], error };
}

export async function getProducts(filters = {}) {
  const [resolvedCategory, resolvedTag] = await Promise.all([
    resolveTaxonomyFilter(filters.category, async () => {
      const { categories } = await getProductCategories();
      return { items: categories };
    }),
    resolveTaxonomyFilter(filters.tag, async () => {
      const { tags } = await getProductTags();
      return { items: tags };
    }),
  ]);

  const query = {
    per_page: 12,
    status: "publish",
    page: filters.page,
    search: filters.search,
    category: resolvedCategory,
    tag: resolvedTag,
    orderby: filters.orderby,
    order: filters.order,
  };

  const { data, error, meta } = await fetchWooCommerceCached(
    "/products",
    query,
    ["woocommerce-products"],
  );

  const products = Array.isArray(data) ? data : [];
  const productsWithPricing = await Promise.all(
    products.map(async (product) => {
      if (!product?.id || product.type !== "variable") {
        return product;
      }

      const { variations } = await getProductVariations(product.id);

      return {
        ...product,
        variationPricingRows: buildQuantityPriceTable(product, variations),
      };
    }),
  );

  return {
    products: productsWithPricing,
    total: meta.total || 0,
    totalPages: meta.totalPages || 0,
    error,
  };
}

function taxonomyMap(items = []) {
  return new Map(
    items
      .filter((item) => item?.id && item?.slug && item?.name)
      .map((item) => [item.id, item]),
  );
}

function categoryMenuItem(term, children = []) {
  const item = {
    title: term.name,
    href: `/products?category=${term.slug}&sort=date-desc`,
  };

  if (children.length) {
    item.children = children;
  }

  return item;
}

async function getAllPublishedProductTaxonomies() {
  const firstPage = await fetchWooCommerceCached(
    "/products",
    {
      status: "publish",
      per_page: 100,
      page: 1,
      _fields: "id,categories,tags",
    },
    ["woocommerce-products", "woocommerce-menu"],
  );
  const totalPages = Math.min(firstPage.meta.totalPages || 1, 10);
  const pageResults =
    totalPages > 1
      ? await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            fetchWooCommerceCached(
              "/products",
              {
                status: "publish",
                per_page: 100,
                page: index + 2,
                _fields: "id,categories,tags",
              },
              ["woocommerce-products", "woocommerce-menu"],
            ),
          ),
        )
      : [];

  return [firstPage, ...pageResults].flatMap((result) =>
    Array.isArray(result.data) ? result.data : [],
  );
}

export async function getProductMenuItems() {
  "use cache";

  cacheLife("hours");
  cacheTag("woocommerce");
  cacheTag("woocommerce-products");
  cacheTag("woocommerce-menu");

  const [{ categories }, products] = await Promise.all([
    getProductCategories(),
    getAllPublishedProductTaxonomies(),
  ]);

  const categoryById = taxonomyMap(categories);
  const tagsByCategoryId = new Map();

  products.forEach((product) => {
    const productCategories = Array.isArray(product?.categories)
      ? product.categories
      : [];
    const productTags = Array.isArray(product?.tags) ? product.tags : [];

    productCategories.forEach((category) => {
      if (!categoryById.has(category?.id)) {
        return;
      }

      const categoryTags = tagsByCategoryId.get(category.id) || new Map();

      productTags.forEach((tag) => {
        if (tag?.id && tag?.slug && tag?.name) {
          categoryTags.set(tag.id, tag);
        }
      });

      tagsByCategoryId.set(category.id, categoryTags);
    });
  });

  return categories
    .filter(
      (category) =>
        category?.id &&
        category?.slug &&
        category?.name &&
        category.slug !== "uncategorized" &&
        !EXCLUDED_PRODUCT_MENU_CATEGORY_SLUGS.has(category.slug),
    )
    .map((category) => {
      const tags = Array.from(tagsByCategoryId.get(category.id)?.values() || [])
        .sort((first, second) => first.name.localeCompare(second.name))
        .map((tag) => ({
          title: tag.name,
          href: categoryTagLink(category.slug, tag.slug),
        }));

      return categoryMenuItem(category, tags);
    });
}

export async function getProductBySlug(slug) {
  const { data, error } = await fetchWooCommerce(
    "/products",
    {
      slug,
      status: "publish",
      per_page: 1,
    }
  );

  return {
    product: Array.isArray(data) ? data[0] || null : null,
    error,
  };
}

export async function getProductVariations(productId) {
  const { data, error } = await fetchWooCommerceCached(
    `/products/${productId}/variations`,
    {
      per_page: 100,
      orderby: "menu_order",
      order: "asc",
    },
    ["woocommerce-products", `woocommerce-product-${productId}-variations`],
  );

  return {
    variations: Array.isArray(data) ? data : [],
    error,
  };
}

export async function getRecommendedProducts({
  currentProductId,
  tagIds = [],
  categoryIds = [],
}) {
  const recommendationQueries = [];

  if (tagIds.length) {
    recommendationQueries.push({
      query: { tag: tagIds.join(",") },
      cacheKey: `tags-${tagIds.join("-")}`,
    });
  }

  if (categoryIds.length) {
    recommendationQueries.push({
      query: { category: categoryIds.join(",") },
      cacheKey: `categories-${categoryIds.join("-")}`,
    });
  }

  recommendationQueries.push({ query: {}, cacheKey: "catalog" });

  const results = await Promise.all(
    recommendationQueries.map(({ query, cacheKey }) =>
      fetchWooCommerceCached(
        "/products",
        {
          ...query,
          exclude: currentProductId,
          status: "publish",
          per_page: 4,
        },
        ["woocommerce-products", `woocommerce-recommendations-${cacheKey}`],
      ),
    ),
  );

  const products = [];
  const productIds = new Set();

  results.forEach(({ data }) => {
    (Array.isArray(data) ? data : []).forEach((product) => {
      if (products.length < 4 && product?.id && !productIds.has(product.id)) {
        productIds.add(product.id);
        products.push(product);
      }
    });
  });

  return {
    products,
    error: results.find((result) => result.error)?.error || null,
  };
}
