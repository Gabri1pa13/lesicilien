# Direct Booking Code Audit (2026-03-30)

## Scope
- `index.html`
- `stays/moncada-de-luna-exclusive-stay/index.html`

## Key Findings
1. **Inconsistent language in primary IT homepage hero**
   - Hero claim and primary CTA are in English (`PRIVATE LUXURY ESTATES...`, `Book your stay`) on the Italian root page.
   - This can reduce conversion for Italian-first traffic.

2. **Some property booking URLs appear malformed**
   - Multiple URLs contain duplicated query fragments like `?guests_rooms=2,0;?guests_rooms=2,0`.
   - Risk: incorrect parameter parsing and lower booking engine prefill quality.

3. **A prominent CTA points to co-host services instead of booking intent**
   - In the “Esclusiva del mese” section, CTA text is generic (`Richiedi informazioni`) and the WhatsApp message references co-hosting services.
   - This may divert users from direct reservation flow.

4. **Newsletter capture on homepage does not persist leads**
   - Newsletter form calls `handleNewsletter(event)` which only shows a toast and resets form.
   - No API call / email platform integration means no actual lead capture.

5. **Tracking appears limited to click events before external redirect**
   - GA setup is basic (`gtag('config', ...)`), and booking flow redirects to external domain (`lesicilien.kross.travel`).
   - If cross-domain measurement is not configured in GA4 linker/admin, attribution to completed bookings may be incomplete.

6. **Homepage carries many competing CTAs**
   - Simultaneous WhatsApp float, mobile sticky bar, guest guide float, exit popup, and multiple booking CTAs.
   - High CTA density can split attention and lower the main conversion path completion rate.

## Priority Recommendations (30-day)
- **P0** Normalize language/intent on root IT page (hero copy + primary CTA) to Italian booking language.
- **P0** Fix malformed booking URLs and validate each property deep link.
- **P0** Replace co-hosting CTA in guest-facing sections with booking-specific copy and destination.
- **P1** Connect newsletter/exit popup to CRM or ESP (Mailerlite/Klaviyo/etc.) with event tracking.
- **P1** Validate GA4 cross-domain setup between `lesicilien.it` and `lesicilien.kross.travel`.
- **P2** Reduce CTA noise: keep one primary booking CTA + one secondary assist CTA (WhatsApp).

## Suggested KPIs
- Booking engine click-through rate (homepage -> engine)
- Booking completion rate (engine sessions -> confirmed)
- Assisted conversion rate from WhatsApp
- Lead capture rate (newsletter + exit popup)
- Bounce rate and engagement rate by language landing page
