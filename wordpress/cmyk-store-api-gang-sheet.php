<?php
/**
 * Plugin Name: CMYK Store API Gang Sheet Metadata
 * Description: Exposes Build a Gang Sheet cart item metadata through the WooCommerce Store API and keeps it on order line items.
 * Version: 0.2.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Fields that may be supplied through the Store API extension.
 *
 * IMPORTANT:
 * Pricing fields are deliberately excluded. They must come from the
 * existing Gang Sheet plugin/server-side pricing logic, not the browser.
 */
function cmyk_gang_sheet_allowed_client_fields() {
    return array(
        'gs_design_id'          => 'Gang sheet design ID',
        'product_type'          => 'Gang sheet product type',
        'uploaded_file'         => 'Uploaded file',
        'print_ready'           => 'Print ready file',
        'gang_sheet_height'     => 'Gang sheet height',
        'sheet_weight'          => 'Sheet weight',
        'sheet_weight_unit'     => 'Sheet weight unit',
        'gs_image_count'        => 'Image count',
        'gs_image_services'     => 'Image services',
        'gs_image_service_ids'  => 'Image service IDs',
        'design_name'           => 'Design name',
    );
}

/**
 * These fields may already be written into the cart by the existing
 * Gang Sheet plugin. They are exposed to Next.js/order metadata, but
 * are NEVER accepted from the Store API client's extensions.
 */
function cmyk_gang_sheet_server_fields() {
    return array(
        'custom_price'     => 'Gang sheet custom price',
        'gs_price_tiers'   => 'Gang sheet price tiers',
        'gs_addon_fee'     => 'Gang sheet add-on fee',
        'gs_rush_fee'      => 'Rush fee',
        'gs_services_fee'  => 'Image services fee',
    );
}

/**
 * All fields exposed through the Store API.
 */
function cmyk_gang_sheet_public_fields() {
    return cmyk_gang_sheet_allowed_client_fields()
        + cmyk_gang_sheet_server_fields();
}

function cmyk_gang_sheet_public_cart_data($cart_item) {
    $keys = cmyk_gang_sheet_public_fields();
    $data = array();

    foreach ($keys as $key => $label) {
        if (!isset($cart_item[$key]) || '' === $cart_item[$key]) {
            continue;
        }

        $value = $cart_item[$key];

        $data[$key] = array(
            'label' => $label,
            'value' => is_scalar($value)
                ? (string) $value
                : wp_json_encode($value),
        );
    }

    return $data;
}

function cmyk_gang_sheet_schema() {
    return array(
        'properties' => array(
            'metadata' => array(
                'description' => 'Build a Gang Sheet metadata attached to this cart item.',
                'type' => 'object',
                'readonly' => true,
            ),
        ),
    );
}

add_action('woocommerce_blocks_loaded', function () {
    if (!function_exists('woocommerce_store_api_register_endpoint_data')) {
        return;
    }

    woocommerce_store_api_register_endpoint_data(
        array(
            'endpoint' => \Automattic\WooCommerce\StoreApi\Schemas\V1\CartItemSchema::IDENTIFIER,
            'namespace' => 'cmyk-gang-sheet',
            'data_callback' => function ($cart_item) {
                return array(
                    'metadata' => cmyk_gang_sheet_public_cart_data($cart_item),
                );
            },
            'schema_callback' => 'cmyk_gang_sheet_schema',
            'schema_type' => ARRAY_A,
        )
    );
});

/**
 * Accept only known non-pricing Gang Sheet fields from Store API extensions.
 *
 * Never accept client-supplied price/fee fields here.
 * The existing Gang Sheet plugin remains responsible for calculating
 * trusted pricing server-side.
 */
add_filter('woocommerce_store_api_add_to_cart_data', function ($add_to_cart_data, $request) {
    $extensions = $request->get_param('extensions');

    if (
        !is_array($extensions) ||
        !isset($extensions['cmyk-gang-sheet']) ||
        !is_array($extensions['cmyk-gang-sheet'])
    ) {
        return $add_to_cart_data;
    }

    $allowed_fields = cmyk_gang_sheet_allowed_client_fields();

    foreach ($allowed_fields as $key => $label) {
        if (!array_key_exists($key, $extensions['cmyk-gang-sheet'])) {
            continue;
        }

        $value = $extensions['cmyk-gang-sheet'][$key];

        if (is_array($value) || is_object($value)) {
            $value = wp_json_encode($value);
        } else {
            $value = sanitize_text_field((string) $value);
        }

        $add_to_cart_data['cart_item_data'][$key] = $value;
    }

    return $add_to_cart_data;
}, 20, 2);

add_filter('woocommerce_get_item_data', function ($item_data, $cart_item) {
    foreach (cmyk_gang_sheet_public_cart_data($cart_item) as $entry) {
        $item_data[] = array(
            'key' => $entry['label'],
            
            'name' => $entry['label'],
            'value' => $entry['value'],
            'display' => esc_html($entry['value']),
        );
    }

    return $item_data;
}, 20, 2);

add_action('woocommerce_checkout_create_order_line_item', function ($item, $cart_item_key, $values) {
    foreach (cmyk_gang_sheet_public_cart_data($values) as $entry) {
        $item->add_meta_data($entry['label'], $entry['value'], true);
    }
}, 20, 3);
