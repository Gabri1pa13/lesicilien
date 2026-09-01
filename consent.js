/* Le Sicilien — cookie consent banner + Google Consent Mode v2 wiring.
   Loaded (deferred) on every page. The consent "default" state itself is set
   by an inline snippet in <head>, before GTM/gtag load — this file only
   renders the banner UI and applies the visitor's choice. */
(function () {
  "use strict";

  var STORAGE_KEY = "ls_cookie_consent";

  var STRINGS = {
    it: {
      text: "Questo sito utilizza cookie tecnici, sempre attivi, e — solo con il tuo consenso — cookie di analisi e marketing per migliorare l'esperienza e misurare le campagne pubblicitarie.",
      accept: "Accetta tutti",
      reject: "Rifiuta",
      link: "Maggiori informazioni",
      href: "/it/cookie-policy/",
    },
    en: {
      text: "This site uses technical cookies, always active, and — only with your consent — analytics and marketing cookies to improve your experience and measure our advertising campaigns.",
      accept: "Accept all",
      reject: "Reject",
      link: "Learn more",
      href: "/en/cookie-policy/",
    },
    es: {
      text: "Este sitio utiliza cookies técnicas, siempre activas, y — solo con tu consentimiento — cookies de análisis y marketing para mejorar la experiencia y medir las campañas publicitarias.",
      accept: "Aceptar todo",
      reject: "Rechazar",
      link: "Más información",
      href: "/en/cookie-policy/",
    },
    de: {
      text: "Diese Website verwendet technisch notwendige Cookies sowie — nur mit Ihrer Zustimmung — Analyse- und Marketing-Cookies, um die Nutzererfahrung zu verbessern und Werbekampagnen zu messen.",
      accept: "Alle akzeptieren",
      reject: "Ablehnen",
      link: "Mehr erfahren",
      href: "/en/cookie-policy/",
    },
    fr: {
      text: "Ce site utilise des cookies techniques, toujours actifs, et — uniquement avec votre consentement — des cookies d'analyse et marketing pour améliorer l'expérience et mesurer les campagnes publicitaires.",
      accept: "Tout accepter",
      reject: "Refuser",
      link: "En savoir plus",
      href: "/en/cookie-policy/",
    },
    pl: {
      text: "Ta strona korzysta z zawsze aktywnych plików cookie technicznych oraz — wyłącznie za Twoją zgodą — plików cookie analitycznych i marketingowych, aby poprawić komfort korzystania i mierzyć skuteczność kampanii reklamowych.",
      accept: "Akceptuj wszystkie",
      reject: "Odrzuć",
      link: "Dowiedz się więcej",
      href: "/en/cookie-policy/",
    },
    zh: {
      text: "本网站使用始终启用的技术性 Cookie，并且——仅在您同意的情况下——使用分析和营销类 Cookie，以改善用户体验并衡量广告效果。",
      accept: "全部接受",
      reject: "拒绝",
      link: "了解更多",
      href: "/en/cookie-policy/",
    },
  };

  function getLang() {
    var l = (document.documentElement.getAttribute("lang") || "it").slice(0, 2).toLowerCase();
    return STRINGS[l] ? l : "it";
  }

  function readChoice() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function writeChoice(choice) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice: choice, ts: Date.now() }));
    } catch (e) {}
  }

  function applyConsent(choice) {
    if (typeof window.gtag !== "function") return;
    if (choice === "accepted") {
      window.gtag("consent", "update", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "granted",
      });
    }
  }

  function renderBanner(strings) {
    var bar = document.createElement("div");
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-label", "Cookie");
    bar.style.cssText =
      "position:fixed;left:0;right:0;bottom:0;z-index:99999;" +
      "background:#1a1a1a;color:#f2f2f2;font-family:Arial,Helvetica,sans-serif;" +
      "padding:16px 20px;box-shadow:0 -4px 24px rgba(0,0,0,.25);" +
      "display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:center;";

    var textEl = document.createElement("p");
    textEl.style.cssText = "margin:0;font-size:13px;line-height:1.55;max-width:640px;flex:1 1 320px;";
    textEl.textContent = strings.text + " ";
    var link = document.createElement("a");
    link.href = strings.href;
    link.textContent = strings.link;
    link.style.cssText = "color:#BFA05A;text-decoration:underline;";
    textEl.appendChild(link);

    var btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;gap:10px;flex:0 0 auto;";

    var rejectBtn = document.createElement("button");
    rejectBtn.type = "button";
    rejectBtn.textContent = strings.reject;
    rejectBtn.style.cssText =
      "background:transparent;color:#f2f2f2;border:1px solid rgba(255,255,255,.35);" +
      "border-radius:999px;padding:10px 20px;font-size:12px;letter-spacing:.06em;cursor:pointer;";

    var acceptBtn = document.createElement("button");
    acceptBtn.type = "button";
    acceptBtn.textContent = strings.accept;
    acceptBtn.style.cssText =
      "background:#BFA05A;color:#1a1a1a;border:none;border-radius:999px;" +
      "padding:10px 22px;font-size:12px;letter-spacing:.06em;font-weight:700;cursor:pointer;";

    function dismiss(choice) {
      writeChoice(choice);
      applyConsent(choice);
      bar.remove();
    }
    rejectBtn.addEventListener("click", function () { dismiss("rejected"); });
    acceptBtn.addEventListener("click", function () { dismiss("accepted"); });

    btnRow.appendChild(rejectBtn);
    btnRow.appendChild(acceptBtn);
    bar.appendChild(textEl);
    bar.appendChild(btnRow);
    document.body.appendChild(bar);
  }

  function init() {
    var existing = readChoice();
    if (existing && (existing.choice === "accepted" || existing.choice === "rejected")) {
      applyConsent(existing.choice);
      return;
    }
    renderBanner(STRINGS[getLang()]);
  }

  if (document.body) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
