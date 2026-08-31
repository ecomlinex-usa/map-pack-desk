(function () {
  "use strict";

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var INBOX = "info@codlinex.com";
  var FORMSUBMIT = "https://formsubmit.co/ajax/" + INBOX;
  var THANKS = "https://maps.codlinex.com/thank-you";

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

    var ok = business && city && phoneOk && emailOk && mapsOk && termsOk && refundOk;
    var banner = form.querySelector("[data-form-banner]");
    if (banner) {
      banner.hidden = ok;
      banner.classList.remove("banner-warn");
      banner.textContent = ok ? "" : "Fix the highlighted fields, then send again.";
    }
    if (!ok) {
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad && typeof firstBad.focus === "function") firstBad.focus();
    }
    return ok;
  }

  function readFields(form) {
    var names = ["business", "city", "region", "country", "trade", "phone", "email", "mapsUrl", "notes"];
    var fields = {};
    names.forEach(function (name) {
      var field = form.elements[name];
      fields[name] = field ? String(field.value || "").trim() : "";
    });
    return fields;
  }

  function formsubmitPayload(form, intent) {
    var fields = readFields(form);
    var honey = form.elements._honey ? String(form.elements._honey.value || "").trim() : "";
    return {
      fields: fields,
      honey: honey,
      body: {
        business: fields.business,
        city: fields.city,
        region: fields.region,
        country: fields.country,
        trade: fields.trade,
        phone: fields.phone,
        email: fields.email,
        mapsUrl: fields.mapsUrl,
        notes: fields.notes,
        form: intent,
        _subject:
          intent === "checkout" ? "Map Pack Desk — checkout" : "Map Pack Desk — shop request",
        _next: THANKS,
        _replyto: fields.email,
        _captcha: "false",
        _template: "table"
      }
    };
  }

  function postFormsubmit(payload) {
    if (payload.honey) {
      return Promise.resolve({ skipped: true });
    }
    return fetch(FORMSUBMIT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload.body)
    }).then(function (res) {
      return res.json().catch(function () {
        return {};
      }).then(function (data) {
        if (!res.ok) {
          throw new Error("formsubmit_http");
        }
        if (data && (data.success === false || data.success === "false")) {
          throw new Error("formsubmit_rejected");
        }
        return data;
      });
    });
  }

  function rememberThanks(fields, intent) {
    try {
      sessionStorage.setItem(
        "mapPackThanks",
        JSON.stringify({
          intent: intent,
          business: fields.business,
          city: fields.city,
          region: fields.region,
          country: fields.country,
          trade: fields.trade,
          phone: fields.phone,
          email: fields.email,
          mapsUrl: fields.mapsUrl
        })
      );
    } catch (err) {
      /* ignore quota / private mode */
    }
  }

  function goThanks() {
    window.location.assign("thank-you.html");
  }

  function setBusy(form, busy, label) {
    var button = form.querySelector('button[type="submit"]');
    if (!button) return;
    if (busy) {
      if (!button.getAttribute("data-idle-label")) {
        button.setAttribute("data-idle-label", button.textContent);
      }
      button.disabled = true;
      button.textContent = label || "Sending…";
    } else {
      button.disabled = false;
      button.textContent = button.getAttribute("data-idle-label") || button.textContent;
    }
  }

  document.querySelectorAll("form[data-desk-form]").forEach(function (form) {
    form.setAttribute("novalidate", "novalidate");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var checkout = form.getAttribute("data-desk-form") === "checkout";
      if (!validate(form, checkout)) return;

      var intent = checkout ? "checkout" : "request";
      var packed = formsubmitPayload(form, intent);
      var replyField = form.elements._replyto;
      if (replyField) replyField.value = packed.fields.email;
      var banner = form.querySelector("[data-form-banner]");
      setBusy(form, true, checkout ? "Opening Stripe…" : "Sending…");

      postFormsubmit(packed)
        .catch(function () {
          if (banner && !checkout) {
            banner.hidden = false;
            banner.textContent =
              "Could not reach the inbox. Email " + INBOX + " with the same shop details.";
          }
          return { failed: true };
        })
        .then(function (result) {
          rememberThanks(packed.fields, intent);
          if (!checkout) {
            if (result && result.failed) {
              setBusy(form, false);
              return;
            }
            goThanks();
            return;
          }
          var start = window.MapPackDesk && window.MapPackDesk.startCheckout;
          if (typeof start !== "function") {
            if (banner) {
              banner.hidden = false;
              banner.classList.add("banner-warn");
              banner.textContent =
                "Checkout is being connected. Send the shop on the homepage or email " +
                INBOX +
                ".";
            }
            setBusy(form, false);
            return;
          }
          return start(packed.fields, banner).then(function (redirected) {
            if (!redirected) {
              if (banner && result && !result.failed) {
                banner.hidden = false;
                banner.classList.add("banner-warn");
                banner.textContent =
                  "Checkout is being connected. We still emailed this shop to " +
                  INBOX +
                  ". Send the shop on the homepage or email " +
                  INBOX +
                  ".";
              } else if (banner && result && result.failed) {
                banner.hidden = false;
                banner.classList.add("banner-warn");
                banner.textContent =
                  "Checkout is being connected. Send the shop on the homepage or email " +
                  INBOX +
                  ".";
              }
              setBusy(form, false);
            }
          });
        });
    });
  });

  var thanks = document.querySelector("[data-thanks]");
  if (thanks) {
    var stored = {};
    try {
      stored = JSON.parse(sessionStorage.getItem("mapPackThanks") || "{}") || {};
    } catch (err) {
      stored = {};
    }
    var query = new URLSearchParams(window.location.search);
    var intent = stored.intent || query.get("intent") || "request";
    var paid = query.get("paid") === "1" || intent === "paid";
    var business = stored.business || query.get("business") || "";
    var email = stored.email || query.get("email") || "";
    var trade = stored.trade || query.get("trade") || "";
    var city = stored.city || query.get("city") || "";
    var region = stored.region || query.get("region") || "";

    var kicker = thanks.querySelector("[data-thanks-kicker]");
    var title = thanks.querySelector("[data-thanks-title]");
    var lead = thanks.querySelector("[data-thanks-lead]");
    var meta = thanks.querySelector("[data-thanks-meta]");
    var mail = thanks.querySelector("[data-thanks-mail]");

    if (kicker) {
      kicker.textContent = paid ? "Payment" : intent === "checkout" ? "Checkout" : "Shop received";
    }
    if (title) {
      title.textContent = business ? "We have " + business + "." : "Shop received.";
    }
    if (lead) {
      lead.textContent = paid
        ? "If the card went through, Stripe sends the receipt to the email on the payment. We also have the shop at " +
          INBOX +
          "."
        : "We received the shop at " +
          INBOX +
          ". If you paid, Stripe sends the receipt. No ranking, lead-count, or review promises attach to this desk.";
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
      var subject = "Map Pack Desk shop" + (business ? " — " + business : "");
      var body = [
        "Business: " + (business || ""),
        "Trade: " + (trade || ""),
        "City: " + (city || ""),
        "Region: " + (region || ""),
        "Country: " + (stored.country || query.get("country") || ""),
        "Phone: " + (stored.phone || query.get("phone") || ""),
        "Email: " + (email || ""),
        "Maps URL: " + (stored.mapsUrl || query.get("mapsUrl") || "")
      ].join("\n");
      mail.setAttribute(
        "href",
        "mailto:" +
          INBOX +
          "?subject=" +
          encodeURIComponent(subject) +
          "&body=" +
          encodeURIComponent(body)
      );
    }
  }
})();
