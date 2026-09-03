export function stripHtml(value = "") {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function toSlug(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseNumericPrice(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number.parseFloat(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function extractCurrencySymbol() {
  return "$";
}

function parseVariationQuantity(variation) {
  const quantityLabel = variation?.attributes
    ?.map((attribute) => attribute.option || attribute.name || "")
    .join(" ");
  const quantity = Number.parseInt(
    (quantityLabel || "").match(/\d+/)?.[0] || "",
    10,
  );
  return Number.isFinite(quantity) ? quantity : null;
}

function parseVariationUnitPrice(variation) {
  const quantity = parseVariationQuantity(variation);
  const totalPrice = parseNumericPrice(variation?.price);

  if (!quantity || totalPrice === null) {
    return null;
  }

  return totalPrice / quantity;
}

function findProductAttribute(product, variationAttribute) {
  const attributes = Array.isArray(product?.attributes) ? product.attributes : [];
  return attributes.find((attribute) => {
    if (attribute?.id && variationAttribute?.id) {
      return Number(attribute.id) === Number(variationAttribute.id);
    }

    return (
      attribute?.name &&
      variationAttribute?.name &&
      attribute.name.toLowerCase() === variationAttribute.name.toLowerCase()
    );
  });
}

function toWooGlobalAttributeSlug(attribute) {
  const slug = attribute?.slug || "";
  if (slug.startsWith("pa_") || slug.startsWith("attribute_")) {
    return slug;
  }

  if (attribute?.id && slug) {
    return `pa_${slug}`;
  }

  if (attribute?.id && attribute?.name) {
    return `pa_${toSlug(attribute.name)}`;
  }

  return "";
}

function normalizeVariationAttributes(product, variation) {
  return (variation?.attributes || []).map((attribute) => {
    const productAttribute = findProductAttribute(product, attribute);

    return {
      ...attribute,
      slug:
        toWooGlobalAttributeSlug(productAttribute) ||
        toWooGlobalAttributeSlug(attribute) ||
        attribute.name,
    };
  });
}

export function getLowestUnitPrice(product, variations = []) {
  const variationUnitPrices = variations
    .map(parseVariationUnitPrice)
    .filter((value) => value !== null);

  if (variationUnitPrices.length) {
    return Math.min(...variationUnitPrices);
  }

  const basePrices = [product?.price, product?.sale_price]
    .map(parseNumericPrice)
    .filter((value) => value !== null);

  if (!basePrices.length) {
    return null;
  }

  return Math.min(...basePrices);
}

export function formatCurrency(amount, symbol = "$") {
  if (amount === null || amount === undefined) {
    return "Contact us";
  }

  return `${symbol}${amount.toFixed(2)}`;
}

export function buildQuantityPriceTable(product, variations = []) {
  const mappedFromVariations = variations
    .map((variation) => {
      const quantity = parseVariationQuantity(variation);
      const totalPrice = parseNumericPrice(variation?.price);

      if (!quantity || totalPrice === null) {
        return null;
      }
      return {
        quantity,
        unitPrice: totalPrice,
        variationId: variation.id,
        variationAttributes: normalizeVariationAttributes(product, variation),
      };
    })
    .filter(Boolean);

  const uniqueRows = new Map();
  for (const row of mappedFromVariations) {
    const existingRow = uniqueRows.get(row.quantity);
    if (!existingRow || row.unitPrice < existingRow.unitPrice) {
      uniqueRows.set(row.quantity, row);
    }
  }

  const quantityRows = [...uniqueRows.values()].sort(
    (left, right) => left.quantity - right.quantity,
  );

  if (quantityRows.length >= 2) {
    return quantityRows;
  }

  const basePrice = getLowestUnitPrice(product, variations);

  if (!basePrice) {
    return [
      { quantity: 25, unitPrice: 0 },
      { quantity: 50, unitPrice: 0 },
      { quantity: 100, unitPrice: 0 },
      { quantity: 250, unitPrice: 0 },
    ];
  }

  return [
    { quantity: 25, unitPrice: basePrice },
    { quantity: 50, unitPrice: basePrice * 0.96 },
    { quantity: 100, unitPrice: basePrice * 0.92 },
    { quantity: 250, unitPrice: basePrice * 0.88 },
  ];
}
