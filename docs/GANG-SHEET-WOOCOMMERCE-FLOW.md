# Gang Sheet WooCommerce Checkout Flow

This document describes the DTF Gang Sheet and UV DTF Gang Sheet checkout flow.
Normal products and By Size products should continue to use the existing Next.js
cart review flow unless a shared WooCommerce session fix is required.

## Scope

- Applies to `dtf-gang-sheet-builder`.
- Applies to `uv-dtf-gang-sheet-builder`.
- Does not apply to regular product `Add to cart` or `Buy Now`.
- Does not apply to `dtf-by-size` or `uv-dtf-by-size`; those can still use the
  BAGS upload UI but should land in the Next.js cart review.

## Current Flow

1. The Next.js product page renders `GangSheetProductPage`.
2. `GangSheetProductPage` renders `GangSheetBuilder` in `woo-product` mode.
3. The BAGS/Drip Woo script posts to WooCommerce through
   `/api/woocommerce/admin-ajax`.
4. WooCommerce creates the BAGS cart item and returns Woo session cookies.
5. BAGS redirects the browser to the configured `cart_url`.
6. For DTF/UV DTF gang sheets, `cart_url` is
   `/api/gang-sheet/add-to-cart?...`.
7. That route fetches the Woo cart using the browser Woo session cookies.
8. The route verifies a matching gang sheet item exists in Woo.
9. The route creates a secure checkout handoff through the WordPress plugin.
10. The browser is redirected to `https://wp.cmykprint.shop/checkout/` with the
    handoff reference.
11. WooCommerce owns shipping, tax, payment, and order creation.

## Session Rules

- WooCommerce is the source of truth for gang sheet checkout.
- The BAGS-created Woo session cookie is forwarded back to Woo during cart
  verification.
- The local Store API `Cart-Token` is not forwarded into the gang sheet redirect
  verification, because it can represent a different Next.js cart session.
- The handoff plugin supports `replace_cart`.
- Normal Next.js cart checkout sends `replace_cart: true`.
- Direct gang sheet checkout sends `replace_cart: false` so existing live Woo
  checkout items are preserved.

## Metadata

The redirect handler preserves metadata exposed by the existing WordPress
integration under the Store API extension namespace `cmyk-gang-sheet`.

Allowed gang sheet fields are:

- `gs_design_id`
- `product_type`
- `uploaded_file`
- `print_ready`
- `gang_sheet_height`
- `sheet_weight`
- `sheet_weight_unit`
- `gs_image_count`
- `gs_image_services`
- `gs_image_service_ids`
- `design_name`

If the Store API extension metadata is not present, the handler falls back to
safe cart item display metadata such as uploaded file, print-ready file, gang
sheet product type, and gang sheet height.

## Duplicate Protection

The WordPress checkout handoff creates a stable identity for each item:

- Prefer `gs_design_id`.
- Fall back to uploaded file plus product and variation.
- Fall back to the Woo line key.

When `replace_cart` is false, the handoff skips adding a row if the same
identity already exists in the live Woo cart. This protects against double
redirects, repeated SDK callbacks, and refreshes.

## Verification

Before redirecting to Woo checkout, the Next.js route verifies:

- Woo cart response is valid JSON, including defensive recovery from polluted
  WordPress output.
- Cart has at least one matching gang sheet item.
- Product slug matches the expected DTF or UV DTF product when available.
- Product type matches the existing configured BAGS value when available.

The route does not trust client-provided price and does not set arbitrary Woo
prices. WooCommerce remains responsible for pricing.

## Known Operational Requirement

The live WordPress Store API previously returned non-JSON text before the JSON
cart payload. The Next.js proxy and WooCommerce fetch helper now recover from
that polluted response, but the live WordPress source of that output should
still be removed from the server. WordPress REST responses should be clean JSON.

## Test Notes

Validated locally:

- `npm run lint`
- `npm run build`
- DTF Gang Sheet builder page returns `200`.
- UV DTF Gang Sheet builder page returns `200`.
- UV DTF By Size page returns `200`.
- `/api/store/cart` returns JSON with `items`.
- Empty gang sheet redirect returns to `/cart` with a useful error instead of
  sending the user to the WooCommerce home page.

Not fully validated in this environment:

- A complete browser BAGS design creation followed by Woo checkout payment.
- Live Woo order creation after payment.
