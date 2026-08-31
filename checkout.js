(function () {
  "use strict";

  var LIVE_LINK = "https://buy.stripe.com/00weVc2DF72n8xX5mS1ck01";
  var BANNER_TEXT =
    "Checkout is being connected. Send the shop on the homepage or email info@codlinex.com.";

  function usableLink(value) {
    var link = String(value || "").trim();
    if (!link) return "";
    if (link.indexOf("https://buy.stripe.com/") !== 0) return "";
    return link;
  }

  function readPaymentLink() {
    var fromWindow = usableLink(window.MAP_PACK_STRIPE_LINK);
    if (fromWindow) return fromWindow;

    var meta = document.querySelector('meta[name="map-pack-stripe-link"]');
    var fromMeta = usableLink(meta && meta.getAttribute("content"));
    if (fromMeta) return fromMeta;

    var cta = document.querySelector("[data-pay-cta]");
    var fromCta = usableLink(cta && cta.getAttribute("href"));
    if (fromCta) return fromCta;

    return usableLink(LIVE_LINK);
  }

  function withEmail(link, email) {
    if (!link) return "";
    try {
      var url = new URL(link);
      if (email && !url.searchParams.get("prefilled_email")) {
        url.searchParams.set("prefilled_email", email);
      }
      return url.toString();
    } catch (err) {
      return link;
    }
  }

  window.MapPackDesk = window.MapPackDesk || {};

  window.MapPackDesk.startCheckout = function (fields, bannerEl) {
    var link = readPaymentLink();
    if (link) {
      window.location.assign(withEmail(link, fields && fields.email));
      return Promise.resolve(true);
    }
    if (bannerEl) {
      bannerEl.hidden = false;
      bannerEl.textContent = BANNER_TEXT;
      bannerEl.classList.add("banner-warn");
    }
    return Promise.resolve(false);
  };
})();
