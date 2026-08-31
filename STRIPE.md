# Stripe for Map Pack Desk

The public site never collects card numbers. Shoppers fill shop details on `checkout.html` (trade, listing, 90-day terms), then pay on the **live Payment Link**. Map Pack Desk does not store full card numbers.

## Live objects (Ecomlinex Stripe)

| Item | ID / URL |
| --- | --- |
| Product | `prod_VAxQiV1WLQC4yp` Map Pack Desk |
| Setup (one time $497) | `price_1UAbVUAm0AY5F6XEHvCfTjgW` |
| Monthly ($297/month) | `price_1UAbVVAm0AY5F6XE2bR3LHH8` |
| Payment Link | https://buy.stripe.com/00weVc2DF72n8xX5mS1ck01 |
| Payment Link id | `plink_1UAbVrAm0AY5F6XEkEZlLE7E` |
| Success | `https://maps.codlinex.com/thank-you` |

That Payment Link URL is wired in `checkout.html` (`href`, meta tag, and `window.MAP_PACK_STRIPE_LINK`). Do not invent a different `buy.stripe.com` URL. The homepage `#request` form is lead-only (Formsubmit → `info@codlinex.com`) and does not take a card.

## Offer (locked)

- Setup (one time): **$497**
- Monthly operations: **$297**
- Due today: **$794** (setup + first month)
- Then **$297** on the same date each month
- 90-day minimum, then month-to-month
- Success URL: `https://maps.codlinex.com/thank-you`
- Cancel URL: `https://maps.codlinex.com/checkout`

## Optional API (not required while the Payment Link is live)

`/api/create-checkout-session` can still build a Checkout Session if these Vercel env vars are set. Checkout JS currently **uses the Payment Link first** so the customer always hits the live link above.

| Variable | What to put |
| --- | --- |
| `STRIPE_SECRET_KEY` | Restricted API key (`rk_…`) preferred, or `sk_…`. Never a publishable `pk_` key. Never commit it. |
| `STRIPE_PRICE_SETUP` | `price_1UAbVUAm0AY5F6XEHvCfTjgW` |
| `STRIPE_PRICE_MONTHLY` | `price_1UAbVVAm0AY5F6XE2bR3LHH8` |
| `STRIPE_PAYMENT_LINK` | `https://buy.stripe.com/00weVc2DF72n8xX5mS1ck01` |
| `PUBLIC_SITE_URL` | Optional. Defaults to `https://maps.codlinex.com`. |

## Tax

If you will charge US or Canadian shops, consider [Stripe Tax for recurring payments](https://docs.stripe.com/billing/taxes/collect-taxes). Do not set `automatic_tax.enabled` until you have an active tax registration in Stripe. Without a registration, Stripe calculates $0 tax and does not error.

## Local

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/checkout.html`. After validation, the Pay $794 control should send you to the Payment Link (card fields stay on Stripe).
