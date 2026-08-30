export type WooAddress = {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  email?: string;
};

export type WooMoney = {
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
};

export type WooTotals = WooMoney & {
  total_items: string;
  total_items_tax: string;
  total_fees: string;
  total_fees_tax: string;
  total_discount: string;
  total_discount_tax: string;
  total_shipping: string | null;
  total_shipping_tax: string | null;
  total_price: string;
  total_tax: string;
  tax_lines: Array<{ name: string; price: string; rate: string }>;
};

export type WooCartItemData = {
  name: string;
  value: string;
  display?: string;
};

export type WooCartItem = {
  key: string;
  id: number;
  type: string;
  quantity: number;
  name: string;
  sku: string;
  permalink: string;
  images: Array<{ id: number; src: string; thumbnail: string; alt: string; name: string }>;
  variation: Array<{ raw_attribute: string; attribute: string; value: string }>;
  item_data: WooCartItemData[];
  prices: WooMoney & { price: string; regular_price: string; sale_price: string };
  totals: WooMoney & {
    line_subtotal: string;
    line_subtotal_tax: string;
    line_total: string;
    line_total_tax: string;
  };
  quantity_limits: {
    minimum: number;
    maximum: number;
    multiple_of: number;
    editable: boolean;
  };
  extensions?: Record<string, unknown>;
};

export type WooCoupon = {
  code: string;
  discount_type: string;
  totals: WooMoney & {
    total_discount: string;
    total_discount_tax: string;
  };
};

export type WooShippingRate = WooMoney & {
  rate_id: string;
  name: string;
  description: string;
  delivery_time: string;
  price: string;
  taxes: string;
  method_id: string;
  instance_id: number;
  selected: boolean;
};

export type WooShippingPackage = {
  package_id: string | number;
  name: string;
  destination: Partial<WooAddress>;
  items: Array<{ key: string; name: string; quantity: number }>;
  shipping_rates: WooShippingRate[];
};

export type WooCart = {
  items: WooCartItem[];
  coupons: WooCoupon[];
  fees: unknown[];
  totals: WooTotals;
  shipping_address: WooAddress;
  billing_address: WooAddress;
  needs_payment: boolean;
  needs_shipping: boolean;
  payment_requirements: string[];
  has_calculated_shipping: boolean;
  shipping_rates: WooShippingPackage[];
  items_count: number;
  items_weight: number;
  errors: Array<{ code: string; message: string }>;
  payment_methods: string[];
  extensions?: Record<string, unknown>;
};

export type WooVariationInput = Array<{ attribute: string; value: string }>;

export type WooCheckoutPayload = {
  billing_address: WooAddress & { email: string };
  shipping_address?: WooAddress;
  payment_method?: string;
  payment_data?: Array<{ key: string; value: string | boolean }>;
  customer_note?: string;
  order_notes?: string;
  create_account?: boolean;
  additional_fields?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
};

export type WooCheckoutResult = {
  order_id: number;
  status: string;
  order_key: string;
  redirect_url?: string;
  payment_result?: {
    payment_status: string;
    payment_details?: Array<{ key: string; value: string }>;
    redirect_url?: string;
  };
};

export type WooOrder = {
  id: number;
  order_key?: string;
  number: string;
  status: string;
  payment_status?: string;
  total: string;
  totals?: WooTotals;
  billing_address?: WooAddress;
  shipping_address?: WooAddress;
  items: WooCartItem[];
};
