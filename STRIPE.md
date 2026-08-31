# Stripe for Map Pack Desk

The public site never collects card numbers. Shoppers fill shop details on `checkout.html`, then pay on Stripe Checkout (hosted) or a Payment Link. Map Pack Desk does not store full card numbers.

Do **not** commit secret keys, publishable keys, or a live Payment Link if you do not want it in git. Put secrets in the Vercel project **maps-codlinex** (Production + Preview).

## Offer (locked)

- Setup (one time): **$497**
- Monthly operations: **$297**
- Due today: **$794** (setup + first month)
- Then **$297** on the same date each month
- 90-day minimum, then month-to-month
- Success URL: `https://maps.codlinex.com/thank-you`
- Cancel URL: `https://maps.codlinex.com/checkout`

## Environment variables

Set these on Vercel. Leave them empty until the live Stripe objects exist. The checkout page will show:

> Checkout is being connected. Send the shop on the homepage or email info@codlinex.com.

Shop details are still POSTed to Formsubmit (`info@codlinex.com`) so the lead is not lost.

| Variable | Required when | What to put |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Using `/api/create-checkout-session` | Restricted API key (`rk_…`) preferred, or `sk_…`. Never a publishable `pk_` key. |
| `STRIPE_PRICE_SETUP` | With the secret key | Price ID (`price_…`) for the **$497 one-time** setup fee |
| `STRIPE_PRICE_MONTHLY` | With the secret key | Price ID (`price_…`) for the **$297/month** recurring desk fee |
| `STRIPE_PAYMENT_LINK` | Optional fallback | Full Payment Link URL (`https://buy.stripe.com/…`) |
| `PUBLIC_SITE_URL` | Optional | Defaults to `https://maps.codlinex.com`. Set on Preview if you want success/cancel to stay on the preview host. |

Create **two Prices** on one Product named Map Pack Desk (or two products if you prefer separate names on the Stripe invoice):

1. One-time price, USD 49700 cents — setup.
2. Recurring monthly price, USD 29700 cents — operations.

Checkout Session `mode` is `subscription`. Stripe charges the one-time price on the first invoice together with month 1, then invoices $297 each month.

## Payment Link (no API)

If you do not want a secret key on Vercel yet:

1. In Stripe, create a Payment Link for **$497 setup + $297 subscription**, or a **$794 first invoice + $297/month** recurring.
2. Either:
   - Set `STRIPE_PAYMENT_LINK` on Vercel, or
   - Paste the URL into `checkout.html`:
     - `window.MAP_PACK_STRIPE_LINK = "https://buy.stripe.com/…"`
     - and/or `<meta name="map-pack-stripe-link" content="https://buy.stripe.com/…">`
3. Replace the `STRIPE_PAYMENT_LINK` placeholder comment in `checkout.html` when the live link exists.

`checkout.js` prefers `/api/create-checkout-session` when the function returns a `url`, then the meta/`window` Payment Link, then the in-page banner.

## Tax

If you will charge US or Canadian shops, consider [Stripe Tax for recurring payments](https://docs.stripe.com/billing/taxes/collect-taxes). Do not set `automatic_tax.enabled` until you have an active tax registration in Stripe. Without a registration, Stripe calculates $0 tax and does not error.

## Local

The static pages do not need npm. The checkout API does:

```bash
npm install
# STRIPE_SECRET_KEY / prices are read from the environment when Vercel (or `vercel dev`) runs the function
python3 -m http.server 4173
```

`python3 -m http.server` will not run `/api/create-checkout-session`. Use `npx vercel dev` when testing the function.
