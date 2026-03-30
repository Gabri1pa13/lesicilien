# SEO Audit: H1 & Organic Visibility (2026-03-30)

## Questions answered
1. Are H1 titles set correctly?
2. Can a user find a property quickly?
3. Can pages appear on first page in organic search?

## What was checked
- All local `*.html` files for H1 count consistency.
- Presence of canonical tags on key pages.
- Presence of sitemap and robots sitemap declaration.
- Quick sanity checks for `noindex` usage.

## Findings

### 1) H1 correctness (technical)
- Total HTML pages checked: **210**.
- Pages with exactly one H1: **210**.
- Pages with no H1: **0**.
- Pages with multiple H1: **0**.

**Conclusion:** H1 structure is now consistent across the checked site pages.

### 2) “Can a user find a property quickly?”
- Homepage has a prominent booking CTA in hero and dedicated property cards linking directly to booking/property pages.
- Property URLs are in sitemap and are crawl-discoverable.

**Conclusion:** from a code and IA standpoint, discovery is good. UX speed depends on copy relevance, load speed, and SERP intent matching.

### 3) “Will it appear on page 1 organically?”
- **Cannot be guaranteed from code alone.**
- Page-1 ranking depends on query competitiveness, backlinks, freshness, domain authority, CTR, and user signals.
- Site has baseline technical prerequisites (canonicals, sitemap, no obvious noindex blocks), but ranking confirmation requires data from:
  - Google Search Console (queries, average position, impressions, CTR)
  - GA4 landing page performance

## Recommended next actions
1. Pull Search Console query report for branded + non-branded terms (last 90 days).
2. Create/optimize dedicated landing pages for high-intent terms:
   - “villa mondello con piscina”
   - “casa vacanze palermo centro storico”
   - “villa fronte mare palermo”
3. Improve internal linking from guide pages to related stay pages with intent-based anchors.
4. Track ranking movement weekly for target queries (IT/EN).
