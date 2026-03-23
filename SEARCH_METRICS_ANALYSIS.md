# Search Metrics Analysis — lesicilien.it
**Period:** 22 February – 22 March 2026 (28 days)
**Source:** Google Search Console — Performance (Web)

---

## 1. Performance Summary

| Metric | Value |
|--------|-------|
| Total clicks | 57 |
| Total impressions | 1,620 |
| Average CTR | 3.5% |
| Average position | 19.9 |

The site is gaining visibility across multilingual queries, with the homepage performing strongly (22% CTR, position 6.6). Guide pages are generating significant impressions but converting poorly to clicks — indicating a meta-tag optimisation opportunity rather than a content gap.

---

## 2. What's Working

### Top queries by clicks
| Query | Clicks | Impressions | CTR | Position |
|-------|--------|-------------|-----|----------|
| le sicilien | 2 | 10 | 20% | 2.2 |
| mondello lungomare | 1 | 3 | 33% | 9.3 |
| palermo with kids | 1 | 14 | 7.1% | 14.6 |
| ou dormir a palerme | 1 | 227 | 0.4% | 44.2 |

Brand queries ("le sicilien") and near-brand queries ("mondello lungomare") convert at high rates. The homepage dominates brand traffic.

### Top pages by clicks
| Page | Clicks | CTR | Position |
|------|--------|-----|----------|
| `/` (IT homepage) | 32 | 22.1% | 6.6 |
| `/en/` | 6 | 10.2% | 18.4 |
| `/it/guide/dove-dormire-palermo-con-bambini/` | 4 | 4.7% | 6.6 |
| `/en/guides/stay-near-the-sea-in-palermo-mondello-surroundings/` | 4 | 2.1% | 9.9 |
| `/en/guides/where-to-stay-in-palermo-with-kids/` | 3 | 1.7% | 7.8 |

The Italian homepage is performing well. The two EN guide pages with the most impressions are ranking in top 10 but have below-average CTR — a clear signal that meta titles and descriptions need sharpening.

---

## 3. CTR Opportunity Matrix

Pages ranking in top 15 with CTR below expected thresholds (~5% at pos 7–10, ~3% at pos 10–15):

| Page | Impressions | Position | Actual CTR | Expected CTR | Gap |
|------|-------------|----------|------------|--------------|-----|
| `/en/guides/stay-near-the-sea-in-palermo-mondello-surroundings/` | 188 | 9.9 | 2.1% | ~4–5% | −2–3pp |
| `/en/guides/where-to-stay-in-palermo-with-kids/` | 172 | 7.8 | 1.7% | ~5–6% | −3–4pp |
| `/it/guide/dove-dormire-palermo-con-bambini/` | 86 | 6.6 | 4.7% | ~6–8% | −1–3pp |
| `/en/guides/where-to-stay-in-palermo-without-a-car/` | 16 | 4.9 | 0% | ~8–10% | −8–10pp |

**Root cause:** Titles are generic and lack the year signal, specificity, or benefit framing that drives clicks in crowded informational SERPs.

**Actions taken (this commit):**
- EN sea guide title: added "& beyond (2026 guide)" + reframed description around comparison value
- EN kids guide title: added "family guide 2026" + rewrote description with direct benefit
- IT kids guide title: added "guida famiglia 2026"
- FR "avec des enfants" guide: fixed missing French accents in title, OG, Twitter, JSON-LD + updated OG/Twitter descriptions

---

## 4. Ranking Opportunity Matrix

Queries with substantial impressions but poor position — content quality / authority improvements needed:

| Query | Impressions | Position | Page (best match) | Issue |
|-------|-------------|----------|-------------------|-------|
| ou dormir a palerme | 227 | 44.2 | `/fr/guides/ou-dormir-a-palerme-sans-voiture/` | Wrong page serving query; needs dedicated FR "où dormir à Palerme" guide |
| ou dormir à palerme | 44 | 33.2 | same | Same |
| sicilien | 42 | 12.2 | `/` | Generic brand/language query |
| palermo b&b / bed and breakfast palermo | ~30 combined | 25–52 | `/en/guides/bnb-in-palermo-areas-prices-booking-guide/` | Low position, guide may need content depth |
| mondello | 23 | 72.1 | none dedicated | No landing page targeting "mondello" as standalone destination |
| palerme sans voiture | 16 | 12.8 | `/fr/guides/ou-dormir-a-palerme-sans-voiture/` | Ranking but not clicking — meta fixed in this commit |

### Critical finding: "ou dormir a palerme"
This is the single highest-impression query (227 imp) with only 0.44% CTR at position 44. The page currently ranking is the "sans voiture" guide — a mismatch. The site lacks a dedicated French guide targeting the head term "où dormir à Palerme" (equivalent to the IT `/guide/dove-dormire-palermo-weekend-2-3-4-notti/` which ranks at position 7 with 0 clicks).

**Action needed:** Create `/fr/guides/ou-dormir-a-palerme/` as a comprehensive hub or internal-link to the most relevant existing FR guide from a stronger pillar page.

---

## 5. Content Gaps

Queries generating impressions with no dedicated page:

| Query cluster | Impressions | Languages with coverage | Action |
|---------------|-------------|------------------------|--------|
| "mondello" (standalone) | 23+ | None | Create `/stays/mondello/` or `/en/guides/mondello-palermo-guide/` |
| "villa in palermo / luxury villas palermo" | 26+ | EN service page exists but ranks ~24–60 | Improve `/en/luxury-villas-palermo/` authority |
| "palermo ohne auto / palerme sans voiture" (DE/FR) | 18+ combined | DE guide exists, FR at pos 25 | FR ranking fixed via meta; DE may also need review |
| "where to stay palermo" (head term EN) | 29 impressions, 0 clicks, pos 20.7 | `/en/guides/where-to-stay-palermo/` exists | Review that guide's content depth and internal links |
| "palermo mit kindern / palermo con bambini piccoli" | 12+ | DE guide at pos 14, IT children variants unranked | DE kids guide content quality check |

---

## 6. Priority Action List

| Priority | Action | Impact | Effort | Status |
|----------|--------|--------|--------|--------|
| 🔴 Critical | Fix FR guide meta tags (missing accents + thin descriptions) | CTR recovery for 300+ monthly imp | Low | **Done** |
| 🔴 Critical | Optimise EN guide meta titles/descriptions (sea + kids guides) | +2–4pp CTR on 360 monthly imp | Low | **Done** |
| 🔴 Critical | Add year 2026 to IT kids guide title | +1–2pp CTR lift | Low | **Done** |
| 🟠 High | Create dedicated FR hub: "Où dormir à Palerme" | Capture 227 imp/mo currently lost at pos 44 | Medium | Backlog |
| 🟠 High | Fix `/en/guides/where-to-stay-palermo/` (29 imp, pos 20.7, 0 clicks) | New click source | Medium | Backlog |
| 🟡 Medium | Internal linking: guides → `/stays/*` property pages | Conversion funnel | Low | Backlog |
| 🟡 Medium | Mondello standalone destination guide | Capture unbranded traffic | Medium | Backlog |
| 🟡 Medium | Review DE kids + sans auto guides (meta + content) | FR pattern may repeat in DE | Low | Backlog |
| 🟢 Low | Add "2026" to remaining guide titles lacking it | Freshness signal in SERP | Low | Backlog |

---

## 7. Notes on Data Interpretation

- The 28-day window (Feb–Mar 2026) captures late-season traffic; summer peak queries ("palermo in estate", "mondello beach") will spike from May onward. Monitor CTR for beach/sea queries from April.
- Position 19.9 average is heavily weighted by the "ou dormir a palerme" cluster at position 44. Excluding that cluster, the effective average position is ~12–14.
- The `/guestguide.html` page has 30 impressions at position 8.3 with 0 clicks — its title tag should be reviewed.
