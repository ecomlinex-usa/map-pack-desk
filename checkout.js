(function () {
  "use strict";

  var PLACEHOLDER = "STRIPE_PAYMENT_LINK";
  var BANNER_TEXT =
    "Checkout is being connected. Send the shop on the homepage or email info@codlinex.com.";

  function readPaymentLink() {
    var fromWindow = window.MAP_PACK_STRIPE_LINK;
    if (typeof fromWindow === "string") {
      var trimmed = fromWindow.trim();
      if (trimmed && trimmed !== PLACEHOLDER) return trimmed;
    }
    var meta = document.querySelector('meta[name="map-pack-stripe-link"]');
    var content = meta && meta.getAttribute("content");
    if (content) {
      var metaLink = content.trim();
      if (metaLink && metaLink !== PLACEHOLDER) return metaLink;
    }
    return "";
  }

  function withEmail(link, email) {
    if (!link) return "";
    try {
      var url = new URL(link, window.location.origin);
      if (email && !url.searchParams.get("prefilled_email")) {
        url.searchParams.set("prefilled_email", email);
      }
      return url.toString();
    } catch (err) {
      return link;
    }
  }

  function createStripeSession(fields) {
    return fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(fields)
    })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        return data && data.url ? data.url : null;
      })
      .catch(function () {
        return null;
      });
  }

  window.MapPackDesk = window.MapPackDesk || {};

  window.MapPackDesk.startCheckout = function (fields, bannerEl) {
    return createStripeSession(fields).then(function (sessionUrl) {
      var link = sessionUrl || readPaymentLink();
      if (link) {
        window.location.assign(withEmail(link, fields.email));
        return true;
      }
      if (bannerEl) {
        bannerEl.hidden = false;
        bannerEl.textContent = BANNER_TEXT;
        bannerEl.classList.add("banner-warn");
      }
      return false;
    });
  };
})();
