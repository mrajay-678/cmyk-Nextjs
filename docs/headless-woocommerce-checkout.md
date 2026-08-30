# Headless WooCommerce Checkout Architecture

WordPress and WooCommerce remain the ecommerce source of truth. Next.js does not store products, prices, carts, coupons, shipping rates, taxes, payment state, or orders in a separate ecommerce database.

## Store API Flow

The browser talks to the local Next.js proxy at `/api/store/*`.

The proxy forwards requests to `https://cmykprint.shop/wp-json/wc/store/v1/*`, copies `Cart-Token` into WooCommerce requests, persists the returned token in the `cmyk_cart_token` httpOnly cookie, and exposes the returned `Cart-Token` header back to browser code so guest carts survive refreshes.

Customer-facing operations use the Store API:

- Cart: `GET /cart`, `POST /cart/add-item`, `POST /cart/update-item`, `POST /cart/remove-item`
- Coupons: `POST /cart/apply-coupon`, `POST /cart/remove-coupon`
- Customer/address updates: `POST /cart/update-customer`
- Shipping selection: `POST /cart/select-shipping-rate`
- Checkout/order creation: `POST /checkout`
- Order success: `GET /order/:id`

## Payment Gateway Finding

The live Store API cart response advertises these payment methods:

- `woocommerce_payments`
- `paypal`

The live site does not expose a `GET /wp-json/wc/store/v1/payment-methods` route. The checkout schema accepts `payment_method` and `payment_data`, but WooPayments and PayPal need their official block/headless client integrations to tokenize/authorize payment details and populate gateway-specific `payment_data`.

The Next.js checkout intentionally does not invent card fields, PayPal buttons, client secrets, or payment tokens. Until the gateway-specific integration is wired, order creation is ready at the Store API layer, but paid checkout is blocked with a clear message.

## Gang Sheet Compatibility

The Build a Gang Sheet Woo SDK adds cart items through WordPress `admin-ajax.php` with `action=gang_sheet_add_to_cart`. It sends fields such as:

- `gs_design_id`
- `product_type`
- `uploaded_file`
- `print_ready`
- `custom_price`
- `gang_sheet_height`
- `sheet_weight`
- `gs_price_tiers`
- service/rush fee fields

WooCommerce Store API exposes standard public line-item `item_data`, but private plugin cart keys may not appear unless WordPress registers them. The companion plugin `wordpress/cmyk-store-api-gang-sheet.php` uses WooCommerce Store API extensibility to expose the required BAGS metadata under each cart item’s `extensions["cmyk-gang-sheet"]` namespace and also mirrors those values into order line-item meta.

## Security

- No WooCommerce REST consumer secret is used in browser code.
- No payment gateway secret is exposed.
- Cart identity is handled with `Cart-Token`.
- Prices, discounts, taxes, shipping, payment processing, order creation, and order status remain WooCommerce responsibilities.
- Next.js submits user/customer data to WooCommerce and displays WooCommerce-calculated responses.
