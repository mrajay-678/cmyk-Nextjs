<?php
/**
 * Plugin Name: CMYK Checkout Artwork
 * Description: Securely hands off Next.js uploaded artwork to WooCommerce checkout and order line items.
 * Version: 1.1.6
 */

if (!defined('ABSPATH')) {
    exit;
}

const CMYK_CHECKOUT_ARTWORK_TRANSIENT_PREFIX = 'cmyk_artwork_';
const CMYK_CHECKOUT_HANDOFF_TRANSIENT_PREFIX = 'cmyk_checkout_';
const CMYK_CHECKOUT_TTL = 2 * HOUR_IN_SECONDS;
const CMYK_CHECKOUT_PLUGIN_VERSION = '1.1.6';

function cmyk_checkout_artwork_secret() {
    if (defined('CMYK_ARTWORK_UPLOAD_SECRET')) {
        return (string) CMYK_ARTWORK_UPLOAD_SECRET;
    }

    $secret = getenv('CMYK_ARTWORK_UPLOAD_SECRET');
    return is_string($secret) ? $secret : '';
}

function cmyk_checkout_authorized($request) {
    $configured_secret = cmyk_checkout_artwork_secret();
    $request_secret = (string) $request->get_header('x-cmyk-artwork-secret');

    return $configured_secret && hash_equals($configured_secret, $request_secret);
}

function cmyk_checkout_token() {
    return bin2hex(random_bytes(32));
}

function cmyk_checkout_transient_key($prefix, $token) {
    return $prefix . hash('sha256', (string) $token);
}

function cmyk_checkout_allowed_mimes() {
    return array(
        'pdf' => 'application/pdf',
        'png' => 'image/png',
        'jpg|jpeg' => 'image/jpeg',
        'psd' => 'image/vnd.adobe.photoshop',
        'ai' => 'application/postscript',
        'svg' => 'image/svg+xml',
    );
}

function cmyk_checkout_clean_line_id($value) {
    $line_id = preg_replace('/[^a-zA-Z0-9._:-]/', '-', (string) $value);
    return substr($line_id ?: wp_generate_uuid4(), 0, 120);
}

function cmyk_checkout_clean_options($value, $depth = 0) {
    if ($depth > 4) {
        return array();
    }

    if (is_string($value)) {
        $decoded = json_decode(wp_unslash($value), true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return cmyk_checkout_clean_options($decoded, $depth + 1);
        }

        return sanitize_text_field($value);
    }

    if (is_bool($value) || is_numeric($value)) {
        return $value;
    }

    if (!is_array($value)) {
        return array();
    }

    $clean = array();
    foreach ($value as $key => $entry) {
        $safe_key = sanitize_key((string) $key);
        if (!$safe_key) {
            continue;
        }
        $clean[$safe_key] = cmyk_checkout_clean_options($entry, $depth + 1);
    }

    return $clean;
}

function cmyk_checkout_disallowed_metadata_keys() {
    return array(
        'custom_price',
        'gs_price_tiers',
        'gs_addon_fee',
        'gs_rush_fee',
        'gs_services_fee',
        'gang_sheet_add_on_fee',
        'rush_fee',
        'image_services_fee',
    );
}

function cmyk_checkout_allowed_gang_sheet_fields() {
    return array(
        'gs_design_id',
        'product_type',
        'uploaded_file',
        'print_ready',
        'gang_sheet_height',
        'sheet_weight',
        'sheet_weight_unit',
        'gs_image_count',
        'gs_image_services',
        'gs_image_service_ids',
        'design_name',
    );
}

function cmyk_checkout_clean_gang_sheet_data($value) {
    if (!is_array($value)) {
        return array();
    }

    $clean = array();
    $allowed_fields = cmyk_checkout_allowed_gang_sheet_fields();

    foreach ($allowed_fields as $field) {
        if (!array_key_exists($field, $value) || !is_scalar($value[$field])) {
            continue;
        }

        $clean[$field] = sanitize_text_field((string) $value[$field]);
    }

    return $clean;
}

function cmyk_checkout_clean_metadata($value) {
    if (!is_array($value)) {
        return array();
    }

    $clean = array();
    foreach ($value as $entry) {
        if (!is_array($entry)) {
            continue;
        }

        $name = sanitize_text_field($entry['name'] ?? $entry['key'] ?? '');
        $field_key = trim(preg_replace('/[^a-z0-9]+/', '_', strtolower($name)), '_');
        if (!$name || in_array($field_key, cmyk_checkout_disallowed_metadata_keys(), true)) {
            continue;
        }

        $raw_value = $entry['value'] ?? '';
        $metadata_value = is_scalar($raw_value)
            ? sanitize_text_field((string) $raw_value)
            : wp_json_encode(cmyk_checkout_clean_options($raw_value));

        if ('' === $metadata_value) {
            continue;
        }

        $clean[] = array(
            'name' => $name,
            'value' => $metadata_value,
        );
    }

    return $clean;
}

function cmyk_checkout_clean_custom_price($value) {
    if ('' === $value || null === $value) {
        return null;
    }

    $decimal = function_exists('wc_format_decimal')
        ? wc_format_decimal($value)
        : preg_replace('/[^0-9.]/', '', (string) $value);
    $price = (float) $decimal;
    return $price > 0 ? $price : null;
}

function cmyk_checkout_clean_variation_attributes($value) {
    if (!is_array($value)) {
        return array();
    }

    $clean = array();
    foreach ($value as $key => $attribute_value) {
        $safe_key = sanitize_key((string) $key);
        if (!$safe_key || !is_scalar($attribute_value)) {
            continue;
        }

        $clean[$safe_key] = sanitize_text_field((string) $attribute_value);
    }

    return $clean;
}

function cmyk_checkout_clean_address($address) {
    if (!is_array($address)) {
        return array();
    }

    $fields = array(
        'first_name',
        'last_name',
        'company',
        'address_1',
        'address_2',
        'city',
        'state',
        'postcode',
        'country',
        'phone',
        'email',
    );
    $clean = array();

    foreach ($fields as $field) {
        if (!isset($address[$field])) {
            continue;
        }

        $clean[$field] = 'email' === $field
            ? sanitize_email($address[$field])
            : sanitize_text_field($address[$field]);
    }

    return $clean;
}

function cmyk_checkout_apply_customer_address($type, $address) {
    if (!function_exists('WC') || !WC()->customer || !is_array($address)) {
        return;
    }

    foreach ($address as $field => $value) {
        $method = 'set_' . $type . '_' . $field;
        if (method_exists(WC()->customer, $method)) {
            WC()->customer->{$method}($value);
        }
    }
}

function cmyk_checkout_product_exists($product_id, $variation_id) {
    if (!function_exists('wc_get_product')) {
        return false;
    }

    if ($variation_id) {
        $variation = wc_get_product($variation_id);
        return $variation && absint($variation->get_parent_id()) === absint($product_id);
    }

    return (bool) wc_get_product($product_id);
}

function cmyk_checkout_variation_attributes($variation_id) {
    if (!$variation_id || !function_exists('wc_get_product')) {
        return array();
    }

    $variation = wc_get_product($variation_id);
    if (!$variation || !method_exists($variation, 'get_variation_attributes')) {
        return array();
    }

    return $variation->get_variation_attributes();
}

function cmyk_checkout_get_artwork_record($token) {
    if (!$token) {
        return false;
    }

    return get_transient(cmyk_checkout_transient_key(CMYK_CHECKOUT_ARTWORK_TRANSIENT_PREFIX, $token));
}

function cmyk_checkout_save_artwork_record($token, $record) {
    set_transient(
        cmyk_checkout_transient_key(CMYK_CHECKOUT_ARTWORK_TRANSIENT_PREFIX, $token),
        $record,
        CMYK_CHECKOUT_TTL
    );
}

function cmyk_checkout_delete_artwork_record($token) {
    delete_transient(cmyk_checkout_transient_key(CMYK_CHECKOUT_ARTWORK_TRANSIENT_PREFIX, $token));
}

function cmyk_checkout_validate_artwork_record($record, $item) {
    if (!is_array($record) || empty($record['media_id'])) {
        return false;
    }

    if (($record['used'] ?? false)) {
        return false;
    }

    return (
        cmyk_checkout_clean_line_id($record['line_id'] ?? '') === cmyk_checkout_clean_line_id($item['line_id'] ?? '') &&
        absint($record['checkout_product_id'] ?? 0) === absint($item['id'] ?? 0) &&
        absint($record['product_id'] ?? 0) === absint($item['product_id'] ?? 0) &&
        absint($record['variation_id'] ?? 0) === absint($item['variation_id'] ?? 0)
    );
}

add_action('rest_api_init', function () {
    register_rest_route('cmyk/v1', '/checkout-health', array(
        'methods' => 'GET',
        'callback' => 'cmyk_checkout_health',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('cmyk/v1', '/artwork', array(
        'methods' => 'POST',
        'callback' => 'cmyk_checkout_artwork_upload',
        'permission_callback' => 'cmyk_checkout_authorized',
    ));

    register_rest_route('cmyk/v1', '/checkout-handoff', array(
        'methods' => 'POST',
        'callback' => 'cmyk_checkout_create_handoff',
        'permission_callback' => 'cmyk_checkout_authorized',
    ));
});

function cmyk_checkout_health() {
    return array(
        'plugin' => 'cmyk-checkout-artwork',
        'version' => CMYK_CHECKOUT_PLUGIN_VERSION,
        'checkout_url' => function_exists('wc_get_checkout_url') ? wc_get_checkout_url() : '',
        'cart_url' => function_exists('wc_get_cart_url') ? wc_get_cart_url() : '',
        'replace_cart_supported' => true,
        'gang_sheet_supported' => true,
        'custom_price_supported' => true,
    );
}

function cmyk_checkout_artwork_upload($request) {
    $files = $request->get_file_params();

    if (empty($files['artwork'])) {
        return new WP_Error('cmyk_artwork_missing', 'Artwork file is required.', array('status' => 400));
    }

    $product_id = absint($request->get_param('product_id'));
    $variation_id = absint($request->get_param('variation_id'));
    $checkout_product_id = absint($request->get_param('checkout_product_id'));
    $line_id = cmyk_checkout_clean_line_id($request->get_param('line_id'));

    if (!$product_id || !$checkout_product_id || !cmyk_checkout_product_exists($product_id, $variation_id)) {
        return new WP_Error('cmyk_artwork_product_invalid', 'Artwork product reference is invalid.', array('status' => 400));
    }

    if ($variation_id && $checkout_product_id !== $variation_id) {
        return new WP_Error('cmyk_artwork_variation_invalid', 'Artwork variation reference is invalid.', array('status' => 400));
    }

    if (!$variation_id && $checkout_product_id !== $product_id) {
        return new WP_Error('cmyk_artwork_product_mismatch', 'Artwork product reference does not match.', array('status' => 400));
    }

    $file = $files['artwork'];
    $filetype = wp_check_filetype($file['name'], cmyk_checkout_allowed_mimes());

    if (empty($filetype['ext'])) {
        return new WP_Error('cmyk_artwork_type_not_allowed', 'This artwork file type is not allowed.', array('status' => 400));
    }

    if (!function_exists('wp_handle_upload')) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
    }

    $uploaded = wp_handle_upload($file, array(
        'test_form' => false,
        'mimes' => cmyk_checkout_allowed_mimes(),
    ));

    if (!empty($uploaded['error'])) {
        return new WP_Error('cmyk_artwork_upload_failed', $uploaded['error'], array('status' => 500));
    }

    $attachment = array(
        'guid' => $uploaded['url'],
        'post_mime_type' => $uploaded['type'],
        'post_title' => sanitize_file_name(pathinfo($file['name'], PATHINFO_FILENAME)),
        'post_content' => '',
        'post_status' => 'private',
    );
    $attachment_id = wp_insert_attachment($attachment, $uploaded['file']);

    if (is_wp_error($attachment_id) || !$attachment_id) {
        return new WP_Error('cmyk_artwork_attachment_failed', 'Artwork attachment could not be created.', array('status' => 500));
    }

    require_once ABSPATH . 'wp-admin/includes/image.php';
    wp_update_attachment_metadata(
        $attachment_id,
        wp_generate_attachment_metadata($attachment_id, $uploaded['file'])
    );
    update_post_meta($attachment_id, '_cmyk_checkout_artwork', '1');
    update_post_meta($attachment_id, '_cmyk_checkout_line_id', $line_id);
    update_post_meta($attachment_id, '_cmyk_checkout_product_id', $product_id);
    update_post_meta($attachment_id, '_cmyk_checkout_variation_id', $variation_id);

    $token = cmyk_checkout_token();
    cmyk_checkout_save_artwork_record($token, array(
        'media_id' => absint($attachment_id),
        'line_id' => $line_id,
        'product_id' => $product_id,
        'variation_id' => $variation_id,
        'checkout_product_id' => $checkout_product_id,
        'quantity' => max(1, absint($request->get_param('quantity'))),
        'name' => sanitize_file_name($request->get_param('artwork_name') ?: $file['name']),
        'options' => cmyk_checkout_clean_options($request->get_param('artwork_options')),
        'created_at' => time(),
        'used' => false,
    ));

    return array(
        'artwork_token' => $token,
        'line_id' => $line_id,
        'expires_in' => CMYK_CHECKOUT_TTL,
    );
}

function cmyk_checkout_create_handoff($request) {
    $items = $request->get_param('items');
    $billing_address = cmyk_checkout_clean_address($request->get_param('billing_address'));
    $shipping_address = cmyk_checkout_clean_address($request->get_param('shipping_address'));
    $customer_note = sanitize_textarea_field($request->get_param('customer_note'));
    $replace_cart = $request->get_param('replace_cart');

    // Normal Next.js cart checkout replaces Woo's cart. Direct Gang Sheet
    // checkout sends false so existing Woo checkout items are preserved.
    if (null === $replace_cart) {
        $replace_cart = true;
    } else {
        $replace_cart = filter_var($replace_cart, FILTER_VALIDATE_BOOLEAN);
    }

    if (!is_array($items) || empty($items)) {
        return new WP_Error('cmyk_checkout_items_missing', 'Checkout items are required.', array('status' => 400));
    }

    $handoff_items = array();

    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }

        $checkout_product_id = absint($item['id'] ?? 0);
        $product_id = absint($item['product_id'] ?? 0);
        $variation_id = absint($item['variation_id'] ?? 0);
        $line_id = cmyk_checkout_clean_line_id($item['line_id'] ?? '');
        $quantity = max(1, absint($item['quantity'] ?? 1));
        $artwork_token = sanitize_text_field($item['artwork_token'] ?? '');
        $variation_attributes = cmyk_checkout_clean_variation_attributes($item['variation_attributes'] ?? array());
        $gang_sheet_data = cmyk_checkout_clean_gang_sheet_data($item['gang_sheet_data'] ?? array());
        $metadata = cmyk_checkout_clean_metadata($item['metadata'] ?? array());
        $custom_price = cmyk_checkout_clean_custom_price($item['custom_price'] ?? null);

        if (!$checkout_product_id || !$product_id || !cmyk_checkout_product_exists($product_id, $variation_id)) {
            return new WP_Error('cmyk_checkout_product_invalid', 'Checkout product reference is invalid.', array('status' => 400));
        }

        if ($variation_id && $checkout_product_id !== $variation_id) {
            return new WP_Error('cmyk_checkout_variation_invalid', 'Checkout variation reference is invalid.', array('status' => 400));
        }

        if (!$variation_id && $checkout_product_id !== $product_id) {
            return new WP_Error('cmyk_checkout_product_mismatch', 'Checkout product reference does not match.', array('status' => 400));
        }

        if ($artwork_token) {
            $record = cmyk_checkout_get_artwork_record($artwork_token);
            if (!cmyk_checkout_validate_artwork_record($record, array(
                'line_id' => $line_id,
                'id' => $checkout_product_id,
                'product_id' => $product_id,
                'variation_id' => $variation_id,
            ))) {
                return new WP_Error('cmyk_checkout_artwork_invalid', 'Artwork reference does not match the checkout item.', array('status' => 400));
            }
        }

        $handoff_items[] = array(
            'line_id' => $line_id,
            'id' => $checkout_product_id,
            'quantity' => $quantity,
            'product_id' => $product_id,
            'variation_id' => $variation_id,
            'variation_attributes' => $variation_attributes,
            'gang_sheet_data' => $gang_sheet_data,
            'metadata' => $metadata,
            'custom_price' => $custom_price,
            'artwork_token' => $artwork_token,
        );
    }

    if (empty($handoff_items)) {
        return new WP_Error('cmyk_checkout_items_invalid', 'No checkout-ready products were found.', array('status' => 400));
    }

    $handoff_token = cmyk_checkout_token();
    set_transient(
        cmyk_checkout_transient_key(CMYK_CHECKOUT_HANDOFF_TRANSIENT_PREFIX, $handoff_token),
        array(
            'items' => $handoff_items,
            'billing_address' => $billing_address,
            'shipping_address' => $shipping_address,
            'customer_note' => $customer_note,
            'replace_cart' => (bool) $replace_cart,
            'created_at' => time(),
        ),
        CMYK_CHECKOUT_TTL
    );

    $checkout_link = add_query_arg(
        'cmyk_checkout_ref',
        rawurlencode($handoff_token),
        wc_get_checkout_url()
    );

    return array(
        'checkout_url' => $checkout_link,
        'checkout_ref' => $handoff_token,
        'expires_in' => CMYK_CHECKOUT_TTL,
    );
}

function cmyk_checkout_get_handoff($token) {
    if (!$token) {
        return false;
    }

    return get_transient(cmyk_checkout_transient_key(CMYK_CHECKOUT_HANDOFF_TRANSIENT_PREFIX, $token));
}

function cmyk_checkout_delete_handoff($token) {
    delete_transient(cmyk_checkout_transient_key(CMYK_CHECKOUT_HANDOFF_TRANSIENT_PREFIX, $token));
}

function cmyk_checkout_is_handoff_request() {
    return !empty($_GET['cmyk_checkout_ref']);
}

function cmyk_checkout_handoff_item_identity($item) {
    $product_id = absint($item['product_id'] ?? 0);
    $variation_id = absint($item['variation_id'] ?? 0);
    $gang_sheet_data = cmyk_checkout_clean_gang_sheet_data($item['gang_sheet_data'] ?? array());

    if (!empty($gang_sheet_data['gs_design_id'])) {
        return 'gang_design:' . sanitize_text_field((string) $gang_sheet_data['gs_design_id']);
    }

    if (!empty($gang_sheet_data['uploaded_file'])) {
        return 'gang_file:' . hash(
            'sha256',
            $product_id . '|' . $variation_id . '|' . sanitize_text_field((string) $gang_sheet_data['uploaded_file'])
        );
    }

    return 'line:' . cmyk_checkout_clean_line_id($item['line_id'] ?? '');
}

function cmyk_checkout_cart_has_identity($identity) {
    if (!$identity || !function_exists('WC') || !WC()->cart) {
        return false;
    }

    foreach (WC()->cart->get_cart() as $cart_item) {
        if (($cart_item['cmyk_checkout_identity'] ?? '') === $identity) {
            return true;
        }
    }

    return false;
}

add_action('template_redirect', function () {
    if (!cmyk_checkout_is_handoff_request() || empty($_GET['cmyk_checkout_ref'])) {
        return;
    }

    if (!function_exists('WC') || !WC()->cart) {
        wp_die(
            esc_html__('WooCommerce cart is not available.', 'cmyk'),
            '',
            array('response' => 500)
        );
    }

    $handoff_token = sanitize_text_field(wp_unslash($_GET['cmyk_checkout_ref']));
    $handoff = cmyk_checkout_get_handoff($handoff_token);

    if (!is_array($handoff) || empty($handoff['items']) || !is_array($handoff['items'])) {
        wp_die(
            esc_html__('This checkout link is expired or invalid.', 'cmyk'),
            '',
            array('response' => 400)
        );
    }

    if (!empty($handoff['replace_cart'])) {
        WC()->cart->empty_cart();
    }
    cmyk_checkout_apply_customer_address('billing', $handoff['billing_address'] ?? array());
    cmyk_checkout_apply_customer_address('shipping', $handoff['shipping_address'] ?? array());

    if (!empty($handoff['customer_note']) && WC()->session) {
        WC()->session->set('cmyk_customer_note', sanitize_textarea_field($handoff['customer_note']));
    }

    foreach ($handoff['items'] as $item) {
        $product_id = absint($item['product_id'] ?? 0);
        $variation_id = absint($item['variation_id'] ?? 0);
        $quantity = max(1, absint($item['quantity'] ?? 1));
        $line_id = cmyk_checkout_clean_line_id($item['line_id'] ?? '');
        $handoff_identity = cmyk_checkout_handoff_item_identity($item);

        if (empty($handoff['replace_cart']) && cmyk_checkout_cart_has_identity($handoff_identity)) {
            continue;
        }

        $cart_item_data = array(
            'cmyk_checkout_line_id' => $line_id,
            'cmyk_checkout_identity' => $handoff_identity,
            'unique_key' => hash(
                'sha256',
                $handoff_identity . '|' . wp_json_encode($item['metadata'] ?? array()) . '|' . wp_json_encode($item['gang_sheet_data'] ?? array()) . '|' . ($item['artwork_token'] ?? '')
            ),
        );
        $variation_attributes = $variation_id
            ? cmyk_checkout_variation_attributes($variation_id)
            : cmyk_checkout_clean_variation_attributes($item['variation_attributes'] ?? array());
        $metadata = cmyk_checkout_clean_metadata($item['metadata'] ?? array());

        if (!empty($metadata)) {
            $cart_item_data['cmyk_handoff_metadata'] = $metadata;
        }

        if (!empty($item['custom_price'])) {
            $cart_item_data['cmyk_custom_unit_price'] = cmyk_checkout_clean_custom_price($item['custom_price']);
        }

        foreach (cmyk_checkout_clean_gang_sheet_data($item['gang_sheet_data'] ?? array()) as $key => $value) {
            $cart_item_data[$key] = $value;
        }

        foreach ($variation_attributes as $key => $value) {
            if (is_scalar($value)) {
                $cart_item_data[$key] = sanitize_text_field((string) $value);
            }
        }

        if (!empty($item['artwork_token'])) {
            $record = cmyk_checkout_get_artwork_record($item['artwork_token']);
            if (!cmyk_checkout_validate_artwork_record($record, $item)) {
                wp_die(
                    esc_html__('Artwork does not match this checkout item.', 'cmyk'),
                    '',
                    array('response' => 400)
                );
            }

            $media_id = absint($record['media_id']);
            $artwork_url = wp_get_attachment_url($media_id);
            if (!$artwork_url) {
                wp_die(
                    esc_html__('Artwork file is unavailable.', 'cmyk'),
                    '',
                    array('response' => 400)
                );
            }

            $cart_item_data['cmyk_artwork'] = array(
                'media_id' => $media_id,
                'name' => sanitize_file_name($record['name'] ?? basename($artwork_url)),
                'url' => esc_url_raw($artwork_url),
                'options' => is_array($record['options'] ?? null) ? $record['options'] : array(),
                'line_id' => $line_id,
            );
        }

        $added_key = WC()->cart->add_to_cart(
            $product_id,
            $quantity,
            $variation_id,
            $variation_attributes,
            $cart_item_data
        );

        if (!$added_key) {
            wp_die(
                esc_html__('A checkout item could not be added to the cart.', 'cmyk'),
                '',
                array('response' => 400)
            );
        }

        if (!empty($item['artwork_token'])) {
            cmyk_checkout_delete_artwork_record($item['artwork_token']);
        }
    }

    WC()->cart->calculate_totals();

    if (WC()->cart->is_empty()) {
        wp_die(
            esc_html__('Checkout handoff completed but the WooCommerce cart is empty.', 'cmyk'),
            '',
            array('response' => 400)
        );
    }

    // Persist the cart before redirecting so the checkout page sees it.
    if (method_exists(WC()->cart, 'set_session')) {
        WC()->cart->set_session();
    }

    if (WC()->session && method_exists(WC()->session, 'save_data')) {
        WC()->session->save_data();
    }

    cmyk_checkout_delete_handoff($handoff_token);
    WC()->customer->save();
    wp_safe_redirect(wc_get_checkout_url());
    exit;
}, 1);

add_action('woocommerce_before_calculate_totals', function ($cart) {
    if (is_admin() && !defined('DOING_AJAX')) {
        return;
    }

    if (!$cart || !method_exists($cart, 'get_cart')) {
        return;
    }

    foreach ($cart->get_cart() as $cart_item) {
        $custom_price = cmyk_checkout_clean_custom_price($cart_item['cmyk_custom_unit_price'] ?? null);
        if (!$custom_price || empty($cart_item['data']) || !method_exists($cart_item['data'], 'set_price')) {
            continue;
        }

        $cart_item['data']->set_price($custom_price);
    }
}, 20);

add_filter('woocommerce_checkout_get_value', function ($value, $input) {
    if ('order_comments' === $input && function_exists('WC') && WC()->session) {
        return WC()->session->get('cmyk_customer_note', $value);
    }

    return $value;
}, 10, 2);

add_filter('woocommerce_get_item_data', function ($item_data, $cart_item) {
    if (!empty($cart_item['cmyk_handoff_metadata']) && is_array($cart_item['cmyk_handoff_metadata'])) {
        foreach ($cart_item['cmyk_handoff_metadata'] as $entry) {
            if (empty($entry['name']) || !isset($entry['value'])) {
                continue;
            }

            $item_data[] = array(
                'name' => sanitize_text_field($entry['name']),
                'value' => esc_html(sanitize_text_field($entry['value'])),
            );
        }
    }

    if (!empty($cart_item['cmyk_artwork']['url'])) {
        $item_data[] = array(
            'name' => __('Artwork', 'cmyk'),
            'value' => sprintf(
                '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
                esc_url($cart_item['cmyk_artwork']['url']),
                esc_html($cart_item['cmyk_artwork']['name'] ?: basename($cart_item['cmyk_artwork']['url']))
            ),
        );
    }

    return $item_data;
}, 10, 2);

add_action('woocommerce_checkout_create_order_line_item', function ($item, $cart_item_key, $values) {
    if (!empty($values['cmyk_handoff_metadata']) && is_array($values['cmyk_handoff_metadata'])) {
        foreach ($values['cmyk_handoff_metadata'] as $entry) {
            if (empty($entry['name']) || !isset($entry['value'])) {
                continue;
            }

            $item->add_meta_data(
                sanitize_text_field($entry['name']),
                sanitize_text_field($entry['value']),
                true
            );
        }
    }

    if (empty($values['cmyk_artwork']['url'])) {
        return;
    }

    $artwork = $values['cmyk_artwork'];

    $item->add_meta_data('Artwork', esc_url_raw($artwork['url']), true);
    $item->add_meta_data('Artwork file name', sanitize_file_name($artwork['name'] ?? ''), true);
    $item->add_meta_data('Artwork media ID', absint($artwork['media_id'] ?? 0), true);
    $item->add_meta_data('Checkout line ID', sanitize_text_field($artwork['line_id'] ?? ''), true);

    if (!empty($artwork['options']['size'])) {
        $item->add_meta_data('Transfer size', sanitize_text_field($artwork['options']['size']), true);
    }

    if (array_key_exists('removebackground', $artwork['options'] ?? array())) {
        $item->add_meta_data(
            'Remove background',
            !empty($artwork['options']['removebackground']) ? 'Yes' : 'No',
            true
        );
    }

    if (array_key_exists('upscalequality', $artwork['options'] ?? array())) {
        $item->add_meta_data(
            'Upscale quality',
            !empty($artwork['options']['upscalequality']) ? 'Yes' : 'No',
            true
        );
    }
}, 10, 3);
