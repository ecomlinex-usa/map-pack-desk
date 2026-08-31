# Map Pack Desk

Static marketing site for **Map Pack Desk** — a manager-only Google Business Profile operations seat for HVAC, plumbing, electrical, and roofing shops in the United States and Canada.

Production: [https://maps.codlinex.com](https://maps.codlinex.com)

## Offer

- **$497** setup + **$297**/month
- **Due today: $794** (setup + first month), then $297/month
- **90-day** minimum, then month-to-month
- US + Canada only
- Four trades: HVAC, plumbing, electrical, roofing
- Manager access only — the shop keeps Google Business Profile ownership
- No ranking, lead-count, or fake-review promises
- Pay by card on Stripe. This site does not collect card numbers.

## Stack

HTML, CSS, and JavaScript at the repository root. No Next.js. No build command for the pages.

| File | Role |
| --- | --- |
| `index.html` | Sales page |
| `checkout.html` | Shop details + Pay $794 → live Stripe Payment Link |
| `thank-you.html` | Confirmation after a shop request or Stripe return |
| `terms.html` / `privacy.html` / `disclaimer.html` / `refund.html` | Legal |
| `styles.css` | Industrial ink / paper / copper |
| `form.js` | Validation, Formsubmit POST to orhan@codlinex.info |
| `checkout.js` | Stripe Payment Link or `/api/create-checkout-session` |
| `api/create-checkout-session.js` | Optional Vercel function (needs Stripe env vars) |
| `STRIPE.md` | Env vars and Payment Link setup |
| `favicon.svg` | Map pin on ink, copper bar |
| `images/` | Hero, trades, manager, monthly |

`vercel.json` sets `"cleanUrls": true`.

The homepage `#request` form POSTs to [Formsubmit](https://formsubmit.co) (`https://formsubmit.co/ajax/orhan@codlinex.info`). The first use of that inbox must be confirmed in email. Checkout also POSTs the shop there, then redirects to Stripe when a Payment Link or secret key is configured. If Stripe is not connected yet, checkout shows a banner and still emails the lead.

## Local

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`. Use `npx vercel dev` when testing `/api/create-checkout-session` (see `STRIPE.md`).

## Contact

Public: [orhan@codlinex.info](mailto:orhan@codlinex.info)
