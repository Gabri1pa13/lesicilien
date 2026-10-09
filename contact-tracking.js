/* Le Sicilien — Google Ads contact-click goals.
   One delegated click listener for every WhatsApp, phone and email link, so
   new links are tracked without inline onclick handlers. Event names must
   match the goals configured in Google Ads exactly. */
(function () {
  "use strict";

  function eventFor(href) {
    if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|(www\.)?whatsapp\.com)\//i.test(href)) return "whatsapp_click";
    if (/^tel:/i.test(href)) return "phone_click";
    if (/^mailto:/i.test(href)) return "maile_click";
    return null;
  }

  document.addEventListener("click", function (e) {
    var link = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!link) return;

    var name = eventFor(link.getAttribute("href") || "");
    if (!name || typeof window.gtag !== "function") return;

    // Stay pages already send whatsapp_click inline — don't count it twice.
    var inline = link.getAttribute("onclick") || "";
    if (inline.indexOf("'" + name + "'") !== -1) return;

    window.gtag("event", name, {
      event_category: "contact",
      event_label: location.pathname,
      link_url: link.href
    });
  }, true);
})();
