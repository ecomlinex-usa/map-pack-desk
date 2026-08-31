(function () {
  "use strict";

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function validPhone(value) {
    var d = digits(value);
    if (d.length === 10) return true;
    if (d.length === 11 && d.charAt(0) === "1") return true;
    return false;
  }

  function validMapsUrl(value) {
    var raw = String(value || "").trim();
    if (!raw) return true;
    try {
      var url = new URL(raw);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (err) {
      return false;
    }
  }

  function setError(form, name, message) {
    var field = form.elements[name];
    var slot = form.querySelector('[data-error-for="' + name + '"]');
    if (field) {
      field.setAttribute("aria-invalid", message ? "true" : "false");
    }
    if (slot) slot.textContent = message || "";
  }

  function required(form, name, label) {
    var value = String(form.elements[name] ? form.elements[name].value : "").trim();
    if (!value) {
      setError(form, name, "Enter " + label + ".");
      return false;
    }
    setError(form, name, "");
    return true;
  }

  function validate(form, requireLegal) {
    var ok = true;
    var business = required(form, "business", "the shop name");
    var city = required(form, "city", "city");
    var phoneOk = required(form, "phone", "a phone number");
    var emailOk = required(form, "email", "an email");

    if (phoneOk && !validPhone(form.elements.phone.value)) {
      setError(form, "phone", "Use a US or Canada phone number.");
      phoneOk = false;
    }

    if (emailOk && !EMAIL_RE.test(form.elements.email.value.trim())) {
      setError(form, "email", "Enter a working email.");
      emailOk = false;
    }

    var mapsField = form.elements.mapsUrl;
    var mapsOk = true;
    if (mapsField && !validMapsUrl(mapsField.value)) {
      setError(form, "mapsUrl", "Paste a full http(s) Maps URL, or leave this blank.");
      mapsOk = false;
    } else if (mapsField) {
      setError(form, "mapsUrl", "");
    }

    var termsOk = true;
    var refundOk = true;
    if (requireLegal) {
      if (!form.elements.agreeTerms || !form.elements.agreeTerms.checked) {
        setError(form, "agreeTerms", "Confirm the Terms of Service.");
        termsOk = false;
      } else {
        setError(form, "agreeTerms", "");
      }
      if (!form.elements.agreeRefund || !form.elements.agreeRefund.checked) {
        setError(form, "agreeRefund", "Confirm the Refund Policy.");
        refundOk = false;
      } else {
        setError(form, "agreeRefund", "");
      }
    }

    ok = business && city && phoneOk && emailOk && mapsOk && termsOk && refundOk;
    var banner = form.querySelector("[data-form-banner]");
    if (banner) {
      banner.hidden = ok;
      banner.textContent = ok ? "" : "Fix the highlighted fields, then send again.";
    }
    if (!ok) {
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad && typeof firstBad.focus === "function") firstBad.focus();
    }
    return ok;
  }

  function collect(form, intent) {
    var params = new URLSearchParams();
    var names = ["business", "city", "region", "country", "trade", "phone", "email", "mapsUrl", "notes"];
    names.forEach(function (name) {
      var field = form.elements[name];
      if (!field) return;
      var value = String(field.value || "").trim();
      if (value) params.set(name, value);
    });
    params.set("intent", intent);
    return params;
  }

  document.querySelectorAll("form[data-desk-form]").forEach(function (form) {
    form.setAttribute("novalidate", "novalidate");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var checkout = form.getAttribute("data-desk-form") === "checkout";
      if (!validate(form, checkout)) return;
      var intent = checkout ? "invoice" : "request";
      window.location.assign("thank-you.html?" + collect(form, intent).toString());
    });
  });

  var thanks = document.querySelector("[data-thanks]");
  if (thanks) {
    var query = new URLSearchParams(window.location.search);
    var intent = query.get("intent") || "request";
    var business = query.get("business") || "";
    var email = query.get("email") || "";
    var trade = query.get("trade") || "";
    var city = query.get("city") || "";
    var region = query.get("region") || "";

    var kicker = thanks.querySelector("[data-thanks-kicker]");
    var title = thanks.querySelector("[data-thanks-title]");
    var lead = thanks.querySelector("[data-thanks-lead]");
    var meta = thanks.querySelector("[data-thanks-meta]");
    var mail = thanks.querySelector("[data-thanks-mail]");

    if (kicker) {
      kicker.textContent = intent === "invoice" ? "Invoice request" : "Shop received";
    }
    if (title) {
      title.textContent = business
        ? (intent === "invoice" ? "Invoice intent for " + business : "We have " + business + ".")
        : intent === "invoice"
          ? "Invoice intent received."
          : "Shop received.";
    }
    if (lead) {
      lead.textContent =
        intent === "invoice"
          ? "This page does not collect a card. If the shop is a fit, we send a separate invoice for the $497 setup and the first $297 month. No ranking, lead-count, or review promises attach to that invoice."
          : "This form does not write to a server. Use the mail link below if you want the same details in an inbox we actually read.";
    }
    if (meta) {
      var bits = [];
      if (trade) bits.push(trade);
      if (city) bits.push(region ? city + ", " + region : city);
      if (email) bits.push(email);
      meta.textContent = bits.join(" · ");
      meta.hidden = bits.length === 0;
    }
    if (mail) {
      var subject =
        intent === "invoice"
          ? "Map Pack Desk invoice intent" + (business ? " — " + business : "")
          : "Map Pack Desk shop" + (business ? " — " + business : "");
      var body = [
        "Intent: " + (intent === "invoice" ? "invoice (no card)" : "request"),
        "Business: " + (business || ""),
        "Trade: " + (trade || ""),
        "City: " + (city || ""),
        "Region: " + (region || ""),
        "Country: " + (query.get("country") || ""),
        "Phone: " + (query.get("phone") || ""),
        "Email: " + (email || ""),
        "Maps URL: " + (query.get("mapsUrl") || ""),
        "",
        query.get("notes") || ""
      ].join("\n");
      mail.setAttribute(
        "href",
        "mailto:desk@maps.codlinex.com?subject=" +
          encodeURIComponent(subject) +
          "&body=" +
          encodeURIComponent(body)
      );
    }
  }
})();
