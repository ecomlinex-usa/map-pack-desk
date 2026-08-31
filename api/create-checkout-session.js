import Stripe from "stripe";

const DEFAULT_SITE = "https://maps.codlinex.com";
const PLACEHOLDER_LINK = "STRIPE_PAYMENT_LINK";

function randomSuffix() {
  var alphabet = "abcdefghijklmnopqrstuvwxyz";
  var out = "";
  for (var i = 0; i < 8; i++) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return out;
}

function siteUrl() {
  var fromEnv = String(process.env.PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  return fromEnv || DEFAULT_SITE;
}

function usableSecret(value) {
  var key = String(value || "").trim();
  return key.startsWith("rk_") || key.startsWith("sk_");
}

function usablePrice(value) {
  return String(value || "").trim().startsWith("price_");
}

function usableLink(value) {
  var link = String(value || "").trim();
  if (!link || link === PLACEHOLDER_LINK) return "";
  if (link.indexOf("https://") !== 0) return "";
  return link;
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

function field(source, name) {
  var value = source && source[name];
  return String(value == null ? "" : value).trim().slice(0, 500);
}

export async function POST(request) {
  var payload = {};
  try {
    payload = await request.json();
  } catch (err) {
    payload = {};
  }

  var email = field(payload, "email");
  var business = field(payload, "business");
  var paymentLink = usableLink(process.env.STRIPE_PAYMENT_LINK);
  var secret = process.env.STRIPE_SECRET_KEY;
  var setupPrice = process.env.STRIPE_PRICE_SETUP;
  var monthlyPrice = process.env.STRIPE_PRICE_MONTHLY;

  if (usableSecret(secret) && usablePrice(setupPrice) && usablePrice(monthlyPrice)) {
    try {
      var stripe = new Stripe(secret, { apiVersion: "2026-07-29.dahlia" });
      var origin = siteUrl();
      var metadata = {
        product: "Map Pack Desk",
        business: business,
        city: field(payload, "city"),
        region: field(payload, "region"),
        country: field(payload, "country"),
        trade: field(payload, "trade"),
        phone: field(payload, "phone"),
        mapsUrl: field(payload, "mapsUrl")
      };

      var params = {
        mode: "subscription",
        // Do not pass payment_method_types — Stripe picks methods from the Dashboard.
        line_items: [
          { price: setupPrice, quantity: 1 },
          { price: monthlyPrice, quantity: 1 }
        ],
        success_url: origin + "/thank-you",
        cancel_url: origin + "/checkout",
        customer_email: email || undefined,
        client_reference_id: business ? business.slice(0, 200) : undefined,
        metadata: metadata,
        subscription_data: { metadata: metadata },
        integration_identifier: "map-pack-desk-" + randomSuffix()
      };

      var session;
      try {
        session = await stripe.checkout.sessions.create(params);
      } catch (firstErr) {
        delete params.integration_identifier;
        session = await stripe.checkout.sessions.create(params);
      }

      if (session && session.url) {
        console.log("checkout session created", session.id);
        return json(200, { ok: true, url: session.url });
      }
    } catch (err) {
      console.error("checkout session failed", err && err.message ? err.message : "unknown");
    }
  }

  if (paymentLink) {
    return json(200, { ok: true, url: paymentLink });
  }

  console.error("checkout unconfigured: missing STRIPE_SECRET_KEY + prices, and no STRIPE_PAYMENT_LINK");
  return json(503, { ok: false, reason: "unconfigured" });
}
