This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

<!--
NEXT_PUBLIC_WC_URL=https://cmykprint.shop/
NEXT_PUBLIC_GS_SHOP_ID=e28e4f98-a0b2-4b75-b1fd-e809863d91de
WC_CONSUMER_KEY=ck_debcfd487f468cfb2066d4c51fb716597cdcd51a
WC_CONSUMER_SECRET=cs_4ab300c5dd8b18d4a0bbedae6ff6a0ce4029ab97
WP_MEDIA_USERNAME=your-wordpress-user
WP_MEDIA_APPLICATION_PASSWORD=your-wordpress-application-password
CMYK_ARTWORK_UPLOAD_SECRET=use-the-same-long-random-secret-in-next-and-wordpress -->

c55d642ed9fcdca8f5bcad73de1c1d290fd8bc7873c1cbee54350bdfbd545adf


Here’s what’s still pending outside the code I changed:
1. Install/activate the WordPress artwork plugin
   - wordpress/cmyk-checkout-artwork.php
   - This is needed so uploaded artwork gets attached to WooCommerce cart/order line items during hosted checkout.
2. Set the same artwork secret in both places
   - In Next .env: CMYK_ARTWORK_UPLOAD_SECRET=...
   - In WordPress: define the same CMYK_ARTWORK_UPLOAD_SECRET
   - Right now .env has media credentials, but I did not see CMYK_ARTWORK_UPLOAD_SECRET.
3. Confirm WooCommerce /checkout-link/ works
   - The Next app redirects artwork orders to:
   - https://cmykprint.shop/checkout-link/?products=...&cmyk_artwork=...
   - WordPress must have that checkout-link behavior/plugin/page active.
4. Configure WooCommerce payment gateways
   - WooPayments / Stripe / PayPal must be active and tested in WooCommerce.
   - Since we chose hosted payment, card details are handled there.
5. Configure shipping methods
   - Make sure WooCommerce has exactly the rates you want:
   - Delivery
   - Pickup
   - The Next UI renames them visually, but WooCommerce still controls the real rate selection.
6. Verify tax settings
   - State sales tax must be configured in WooCommerce tax settings.
   - The Next checkout only displays what WooCommerce returns.
7. Run a real test order
   - Add product with artwork.
   - Open checkout.
   - Preview artwork.
   - Choose delivery/pickup.
   - Continue to secure payment.
   - Complete payment in WooCommerce sandbox/test mode.
   - Confirm order includes artwork link/file name in Woo admin.
Most important pending item: WordPress must be ready to receive artwork and attach it to the Woo order. Without that, payment can work, but artwork may not appear correctly on the final order.