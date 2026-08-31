# Map Pack Desk

Static marketing site for **Map Pack Desk** — a manager-only Google Business Profile operations seat for HVAC, plumbing, electrical, and roofing shops in the United States and Canada.

Production: [https://maps.codlinex.com](https://maps.codlinex.com)

## Offer

- **$497** setup + **$297**/month
- **90-day** minimum
- US + Canada only
- Four trades: HVAC, plumbing, electrical, roofing
- Manager access only — the shop keeps Google Business Profile ownership
- No ranking, lead-count, or fake-review promises
- Checkout is **invoice intent**. Stripe is not connected; this site does not collect cards

## Stack

HTML, CSS, and JavaScript at the repository root. No Next.js, no npm, no build command.

| File | Role |
| --- | --- |
| `index.html` | Sales page |
| `checkout.html` | Invoice intent + terms/refund checkboxes |
| `thank-you.html` | Frontend confirmation |
| `terms.html` / `privacy.html` / `disclaimer.html` / `refund.html` | Legal |
| `styles.css` | Industrial ink / paper / copper |
| `form.js` | Client-side validation, then GET to thank-you |
| `favicon.svg` | Map pin on ink, copper bar |
| `images/` | Hero, trades, manager, monthly |

`vercel.json` sets `"cleanUrls": true`. Vercel can serve the root as a static site with no build.

## Local

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## Contact

desk@maps.codlinex.com
