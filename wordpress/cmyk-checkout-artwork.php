<?php
/**
 * Plugin Name: CMYK Checkout Artwork
 * Description: Attaches artwork links from the Next.js checkout handoff to WooCommerce cart and order line items.
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

function cmyk_checkout_artwork_secret() {
    if (defined('CMYK_ARTWORK_UPLOAD_SECRET')) {
        return (string) CMYK_ARTWORK_UPLOAD_SECRET;
    }

    $secret = getenv('CMYK_ARTWORK_UPLOAD_SECRET');
    return is_string($secret) ? $secret : '';
}

function cmyk_checkout_artwork_upload_allowed($request) {
    $configured_secret = cmyk_checkout_artwork_secret();
    $request_secret = (string) $request->get_header('x-cmyk-artwork-secret');

    return $configured_secret && hash_equals($configured_secret, $request_secret);
}

add_action('rest_api_init', function () {
    register_rest_route('cmyk/v1', '/artwork', array(
        'methods' => 'POST',
        'callback' => 'cmyk_checkout_artwork_upload',
        'permission_callback' => 'cmyk_checkout_artwork_upload_allowed',
    ));
});

function cmyk_checkout_artwork_upload($request) {
    $files = $request->get_file_params();

    if (empty($files['artwork'])) {
        return new WP_Error('cmyk_artwork_missing', 'Artwork file is required.', array('status' => 400));
    }

    $file = $files['artwork'];
    $allowed_mimes = array(
        'pdf' => 'application/pdf',
        'png' => 'image/png',
        'jpg|jpeg' => 'image/jpeg',
        'psd' => 'image/vnd.adobe.photoshop',
        'ai' => 'application/postscript',
        'svg' => 'image/svg+xml',
    );
    $filetype = wp_check_filetype($file['name'], $allowed_mimes);

    if (empty($filetype['ext'])) {
        return new WP_Error('cmyk_artwork_type_not_allowed', 'This artwork file type is not allowed.', array('status' => 400));
    }

    if (!function_exists('wp_handle_upload')) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
    }

    $uploaded = wp_handle_upload($file, array(
        'test_form' => false,
        'mimes' => $allowed_mimes,
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

    if (!is_wp_error($attachment_id)) {
        require_once ABSPATH . 'wp-admin/includes/image.php';
        wp_update_attachment_metadata(
            $attachment_id,
            wp_generate_attachment_metadata($attachment_id, $uploaded['file'])
        );
    }

    return array(
        'id' => is_wp_error($attachment_id) ? 0 : $attachment_id,
        'url' => $uploaded['url'],
        'name' => sanitize_file_name($file['name']),
        'type' => $uploaded['type'],
        'size' => filesize($uploaded['file']),
    );
}

function cmyk_checkout_artwork_payload() {
    if (empty($_GET['cmyk_artwork'])) {
        return array();
    }

    $payload = wp_unslash($_GET['cmyk_artwork']);
    $items = json_decode($payload, true);

    return is_array($items) ? $items : array();
}

function cmyk_checkout_artwork_match($cart_item, $artwork_item) {
    $product_id = isset($artwork_item['product_id']) ? absint($artwork_item['product_id']) : 0;
    $variation_id = isset($artwork_item['variation_id']) ? absint($artwork_item['variation_id']) : 0;

    if ($variation_id && !empty($cart_item['variation_id'])) {
        return absint($cart_item['variation_id']) === $variation_id;
    }

    return !empty($cart_item['product_id']) && absint($cart_item['product_id']) === $product_id;
}

add_filter('woocommerce_add_cart_item_data', function ($cart_item_data, $product_id, $variation_id) {
    static $artwork_payload = null;

    if (null === $artwork_payload) {
        $artwork_payload = cmyk_checkout_artwork_payload();
    }

    $cart_item = array(
        'product_id' => $product_id,
        'variation_id' => $variation_id,
    );

    foreach ($artwork_payload as $index => $artwork_item) {
        if (
            cmyk_checkout_artwork_match($cart_item, $artwork_item) ||
            absint($artwork_item['checkout_product_id'] ?? 0) === absint($variation_id ?: $product_id)
        ) {
            $cart_item_data['cmyk_artwork'] = array(
                'name' => sanitize_text_field($artwork_item['artwork_name'] ?? ''),
                'url' => esc_url_raw($artwork_item['artwork_url'] ?? ''),
                'media_id' => absint($artwork_item['media_id'] ?? 0),
                'options' => is_array($artwork_item['artwork_options'] ?? null) ? $artwork_item['artwork_options'] : array(),
            );
            $cart_item_data['unique_key'] = md5(microtime() . wp_json_encode($cart_item_data['cmyk_artwork']));
            unset($artwork_payload[$index]);
            break;
        }
    }

    return $cart_item_data;
}, 10, 3);

add_filter('woocommerce_get_item_data', function ($item_data, $cart_item) {
    if (empty($cart_item['cmyk_artwork']['url'])) {
        return $item_data;
    }

    $item_data[] = array(
        'name' => __('Artwork', 'cmyk'),
        'value' => sprintf(
            '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
            esc_url($cart_item['cmyk_artwork']['url']),
            esc_html($cart_item['cmyk_artwork']['name'] ?: basename($cart_item['cmyk_artwork']['url']))
        ),
    );

    return $item_data;
}, 10, 2);

add_action('woocommerce_checkout_create_order_line_item', function ($item, $cart_item_key, $values) {
    if (empty($values['cmyk_artwork']['url'])) {
        return;
    }

    $item->add_meta_data('Artwork', $values['cmyk_artwork']['url'], true);

    if (!empty($values['cmyk_artwork']['name'])) {
        $item->add_meta_data('Artwork file name', $values['cmyk_artwork']['name'], true);
    }

    if (!empty($values['cmyk_artwork']['media_id'])) {
        $item->add_meta_data('Artwork media ID', $values['cmyk_artwork']['media_id'], true);
    }

    if (!empty($values['cmyk_artwork']['options']['size'])) {
        $item->add_meta_data('Transfer size', sanitize_text_field($values['cmyk_artwork']['options']['size']), true);
    }

    if (array_key_exists('removeBackground', $values['cmyk_artwork']['options'] ?? array())) {
        $item->add_meta_data(
            'Remove background',
            !empty($values['cmyk_artwork']['options']['removeBackground']) ? 'Yes' : 'No',
            true
        );
    }

    if (array_key_exists('upscaleQuality', $values['cmyk_artwork']['options'] ?? array())) {
        $item->add_meta_data(
            'Upscale quality',
            !empty($values['cmyk_artwork']['options']['upscaleQuality']) ? 'Yes' : 'No',
            true
        );
    }
}, 10, 3);
