# Infinivium

A digital storefront for downloadable e-books and courses delivered through private Google Drive links. The application uses React, Vite, Supabase Auth/Postgres/Storage, Supabase Edge Functions, and Razorpay Standard Checkout.

## Local development

```sh
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` using the values in Supabase **Project Settings → API**. Set `VITE_RAZORPAY_KEY_ID` to your Razorpay test Key ID in `.env` or `.env.local`. Restart Vite after changing environment variables. Do not put service-role keys, Razorpay Key Secrets, or webhook secrets in variables prefixed with `VITE_`.

## Supabase setup

Apply these migrations in order in the Supabase SQL Editor:

1. [`supabase/migrations/20261106000000_student_accounts.sql`](./supabase/migrations/20261106000000_student_accounts.sql)
2. [`supabase/migrations/20261110000000_digital_product_delivery.sql`](./supabase/migrations/20261110000000_digital_product_delivery.sql)
3. [`supabase/migrations/20261111000000_admin_workspace.sql`](./supabase/migrations/20261111000000_admin_workspace.sql)
4. [`supabase/migrations/20261112000000_razorpay_checkout.sql`](./supabase/migrations/20261112000000_razorpay_checkout.sql)
5. [`supabase/migrations/20261113000000_live_catalog.sql`](./supabase/migrations/20261113000000_live_catalog.sql)
6. [`supabase/migrations/20261114000000_course_lessons.sql`](./supabase/migrations/20261114000000_course_lessons.sql)
7. [`supabase/migrations/20261114100000_public_catalog_anon_policy_fix.sql`](./supabase/migrations/20261114100000_public_catalog_anon_policy_fix.sql)
8. [`supabase/migrations/20261114120000_razorpay_standard_checkout.sql`](./supabase/migrations/20261114120000_razorpay_standard_checkout.sql)

In Supabase Authentication → URL Configuration, set the Site URL to `https://infinivium.com` and add the production URL (and any preview URLs you use) to the Redirect URLs allowlist. Add `http://localhost:5173/**` only for local development. Password-reset and confirmation emails return to the origin where the request was made, so request production resets from `https://infinivium.com`; links requested from localhost return to localhost. Configure an SMTP provider before production use.

### Grant administrator access

Create and verify your user account, then grant your account the administrator role from the Supabase SQL Editor (replace the example email):

```sql
insert into public.admin_users (user_id)
select id from auth.users where lower(email) = lower('you@example.com')
on conflict (user_id) do nothing;
```

Sign out and back in, then visit `/studio` directly to open the protected admin product studio. The route is not linked in the student-facing storefront; access is still enforced by the admin role. It can add/edit products, upload PDFs, manage course lessons (titles, optional thumbnails, and individual Drive links), publish products, and remove products from the storefront. Removing a listing unpublishes it; existing buyers retain their entitlements and the product's records are not deleted.

The `admin_users` table has no browser read/write policies. Only a trusted Supabase database administrator can grant or revoke administrator roles.

Admins can use the checkout preview wall to preview purchased-product delivery without charging or creating entitlements. Preview access exists only in the current browser session and never grants student access.

### E-book files and course links

- E-books are stored in the private Supabase Storage bucket named `ebooks`. Upload/manage PDFs in the admin studio. Only recorded purchasers and admins can read the files.
- Add each course recording as a lesson in the admin studio. Only enrolled students and admins can read lesson links. Configure Drive sharing carefully; recipients may be able to forward a Drive link.
- Purchased e-books open in the in-site PDF reader with page navigation and light/dark reader themes. Purchased courses open as an ordered playlist, with each lesson opening its Google Drive recording.
- The live storefront catalog is read from Supabase. Seed rows in the migrations provide example products.

## Razorpay Standard Checkout

Checkout creates a Razorpay Order server-side using the current published product prices from Supabase, then opens Razorpay's Standard Checkout modal. The browser never collects card details or decides the amount. A second edge function verifies the HMAC-SHA256 payment signature and confirms the matching payment is captured before purchase/enrollment access is granted.

1. Apply migration 8 above, create a Razorpay account, and start in **Test Mode**. Obtain the API Key ID and Key Secret from Razorpay.
2. Set `VITE_RAZORPAY_KEY_ID` in the frontend's `.env`/`.env.local`; this public Key ID is used to configure Checkout. Keep the Key Secret in Supabase Function secrets only.
3. Install and authenticate the Supabase CLI, link this project, then set the function secrets (use the actual publicly reachable app origin for `APP_URL`):

   ```sh
   supabase secrets set RAZORPAY_KEY_ID=rzp_test_... RAZORPAY_KEY_SECRET=... APP_URL=https://your-app.example
   supabase functions deploy create-razorpay-order
   supabase functions deploy verify-razorpay-payment
   ```

   The payment-link webhook deployment and `RAZORPAY_WEBHOOK_SECRET` are only needed if continuing to accept payments from previously created Payment Links. Standard Checkout verifies payment directly with the server and does not rely on that webhook.
4. For local Edge Function development, start Supabase and use `supabase functions serve --env-file .env`; provide the Razorpay Key ID and Key Secret in the ignored `.env` file. Do not commit `.env`.
5. Add the deployed app URL to Supabase Authentication's allowed URLs. Sign in, add products to the cart, open checkout, and click **Pay … with Razorpay**. Test with Razorpay test cards in Test Mode before switching to live API keys.

The existing Payment Link webhook endpoint has JWT verification disabled in `supabase/config.toml` because Razorpay authenticates it with its HMAC signature. Do not disable signature verification or manually insert purchase/enrollment rows to simulate a production payment.

## Dedicated pages

- `/` — storefront
- `/login` and `/signup` — separate account pages
- `/cart` — persistent cart and order total
- `/checkout` — server-created Razorpay order and Standard Checkout modal
- `/payment-return` — checks the order state; a return URL alone never grants access
- `/studio` — administrator-only product studio (direct URL, not shown to students)
- `/library` — purchased e-books and courses
- `/library/<product-id>` — the purchased e-book reader or course playlist

## Scripts

- `npm run dev` — local development server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — Oxlint
- `npm test` — catalog and URL validation tests

Product ratings and imagery are sample presentation data. Replace them with real content and licensed images before launch.
