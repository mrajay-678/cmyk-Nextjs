import { cacheLife, cacheTag } from "next/cache";
import { buildQuantityPriceTable } from "./productHelpers";

const WC_BASE_URL = process.env.NEXT_PUBLIC_WC_URL;
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

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

    return {
      data: await response.json(),
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
  console.log("categories", data);
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

export async function getProductBySlug(slug) {
  const { data, error } = await fetchWooCommerceCached(
    "/products",
    {
      slug,
      status: "publish",
      per_page: 1,
    },
    ["woocommerce-products", `woocommerce-product-${slug}`],
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
