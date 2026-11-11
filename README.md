# Infinivium

A digital storefront for downloadable e-books and courses delivered through private Google Drive links. The application uses React, Vite, Supabase Auth/Postgres/Storage, Supabase Edge Functions, and Razorpay Payment Links.

## Local development

```sh
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` using the values in Supabase **Project Settings → API**. Restart Vite after changing environment variables. Do not put service-role keys, Razorpay secrets, or webhook secrets in variables prefixed with `VITE_`.

## Supabase setup

Apply these migrations in order in the Supabase SQL Editor:

1. [`supabase/migrations/20261106000000_student_accounts.sql`](./supabase/migrations/20261106000000_student_accounts.sql)
2. [`supabase/migrations/20261110000000_digital_product_delivery.sql`](./supabase/migrations/20261110000000_digital_product_delivery.sql)
3. [`supabase/migrations/20261111000000_admin_workspace.sql`](./supabase/migrations/20261111000000_admin_workspace.sql)
4. [`supabase/migrations/20261112000000_razorpay_checkout.sql`](./supabase/migrations/20261112000000_razorpay_checkout.sql)
5. [`supabase/migrations/20261113000000_live_catalog.sql`](./supabase/migrations/20261113000000_live_catalog.sql)
6. [`supabase/migrations/20261114000000_course_lessons.sql`](./supabase/migrations/20261114000000_course_lessons.sql)

In Supabase Authentication settings, enable email sign-up and configure the local and production app URLs as redirect URLs. Configure an SMTP provider before production use.

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

## Razorpay hosted checkout

Checkout creates a Razorpay Payment Link server-side and redirects the customer to its hosted payment page. The browser never collects card details or decides the amount. The edge function re-reads current published product prices from Supabase. Purchase/enrollment access is granted only after the signed `payment_link.paid` Razorpay webhook is verified.

1. Create a Razorpay account and start in **Test Mode**. Obtain the API Key ID and Key Secret from Razorpay.
2. Install and authenticate the Supabase CLI, link this project, then set the function secrets (use the actual publicly reachable app origin for `APP_URL`):

   ```sh
   supabase secrets set RAZORPAY_KEY_ID=rzp_test_... RAZORPAY_KEY_SECRET=... RAZORPAY_WEBHOOK_SECRET=... APP_URL=https://your-app.example
   supabase functions deploy create-razorpay-payment-link
   supabase functions deploy razorpay-webhook
   ```

   Keep the key secret and webhook secret only in Supabase function secrets. Never commit them or add them to frontend environment variables.
3. In the Razorpay Dashboard, add a webhook at `https://YOUR_PROJECT_REF.supabase.co/functions/v1/razorpay-webhook`, use the same webhook secret, and enable the `payment_link.paid` event.
4. Add the deployed app URL to Supabase Authentication's allowed redirect URLs. Test the full payment and webhook flow in Razorpay Test Mode before switching to live API keys.

The webhook endpoint has JWT verification disabled in `supabase/config.toml` because Razorpay authenticates it with its HMAC signature. Do not disable signature verification or manually insert purchase/enrollment rows to simulate a production payment.

## Dedicated pages

- `/` — storefront
- `/login` and `/signup` — separate account pages
- `/cart` — persistent cart and order total
- `/checkout` — server-created Razorpay payment link, then hosted Razorpay redirect
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
