# taxvett.com — Marketing Plan
**Period:** 3 månader | **Budget:** 100 kr/mån | **Solo, anonym, ingen support**

---

## Produkt

Global API för validering av skattenummer (VAT, ABN, org-nummer m.m.) i 30+ länder.  
**Målgrupp:** Utvecklare och SaaS-bolag med B2B-checkout.  
**Differentierare:** Ett endpoint, global täckning, gratis att börja.

---

## Åtgärda innan lansering

| Problem | Åtgärd |
|---|---|
| $ och € blandas på prissidan | Välj EUR genomgående |
| Free-plan: 50 req/mån (för lite) | Höj till 200–500 req/mån |
| "Priority support" / "Dedicated support" | Ta bort — ersätt med "Documentation" |
| Prishopp €9 → €79 | Lägg till mellanplan ~€29/mån, 20 000 req |
| Pricing saknas i navigationen | Lägg till "Pricing"-länk i menyn |
| Inga kodexempel på startsidan | Lägg till curl-block direkt under hero |
| "Built by a developer" — personreferens | Ta bort, skriv om till neutral text |

---

## Strategi: Tre spår

| Spår | Kanal | Budget | Risk |
|---|---|---|---|
| **A** | Google Ads — sökannonsering | 100 kr/mån | Medel |
| **B** | SEO — dev-artiklar på dev.to / Medium | 0 kr | Låg, långsam |
| **C** | API-kataloger (passiv) | 0 kr | Låg |

---

## Konton & verktyg (sätt upp en gång)

| Vad | Verktyg | Kostnad |
|---|---|---|
| Betalningar | Stripe (finns) | 0 + ~1,5% |
| AI-innehåll | Claude / ChatGPT | Gratis tier |
| Publicering | dev.to, Medium | Gratis |
| Analytics | Plausible / Umami self-host | Gratis |
| Övervakning | UptimeRobot | Gratis |
| Anonymitet | Inga personkopplade konton | — |

---

## Veckoplan — Månad 1 (sätt allt på plats)

**V1 — Fixa sajten**
- Rätta $ → EUR på prissidan
- Höj Free-plan till 200–500 req/mån
- Ta bort support-löften, lägg till "Documentation"
- Lägg till Pricing i navigationen
- Lägg till curl-kodexempel på startsidan

**V2 — Innehåll**
AI-generera och publicera 3 SEO-artiklar på dev.to:
- *"EU VAT validation API compared — 2024"*
- *"How to validate UK VAT numbers in Node.js"*
- *"Australian ABN validation for SaaS developers"*

**V3 — API-kataloger**
Registrera taxvett i:
- RapidAPI
- APIs.guru
- Public APIs (GitHub-repo)

**V4 — Google Ads**
Kör tre annonsVarianter (A/B/C-test), 100 kr totalt:

| Variant | Budskap |
|---|---|
| A | "VAT validation API — 30+ countries, one endpoint" |
| B | "EU VAT check API — free to start, no credit card" |
| C | "Validate tax numbers globally — from €9/month" |

Sökord: `vat number validation api`, `eu vat check api`  
Budget per variant: ~33 kr, kör 2 veckor. Mät: klick → signup.

---

## Veckoplan — Månad 2 (optimera)

**V5–V6**
- Kolla Google Ads: vinnande variant → dubbla budget
- Klick men inga signups = prissida fel → justera CTA eller pris
- Publicera 2 nya SEO-artiklar baserat på söktermer i analytics

**V7**
- Om RapidAPI ger trafik: utöka med batch-validering som feature
- Konfigurera automatiskt Stripe-mail till Free-användare efter 30 dagar

**V8**
- Registrera i Stripe App Marketplace
- Mät: Free-plan-användare som uppgraderat → om noll, sänk Free-gränsen till 100 req

---

## Veckoplan — Månad 3 (skala eller pivot)

**V9–V10**
- Mät alla tre spår: vilket gav betalande kunder?
- Stäng de som inte levererat, dubbla det som fungerar

**V11**
- AI-generera ytterligare 3 artiklar med vinnande söktermer

**V12 — Utvärdering**
- Vilken kanal gav kunder? Skala den.
- Finns ingen betalande kund efter 3 månader → sänk Free till 100 req + testa lägre startpris (€4,90/mån)

---

## Mål per månad

| Månad | Mål |
|---|---|
| 1 | 50 free-signups, 1 betalande kund |
| 2 | 5 betalande (~€45 MRR) |
| 3 | 15 betalande (~€135 MRR) |

---

## KPI att följa

| Mätvärde | Okej | Bra |
|---|---|---|
| Landningssida → signup | 3–5% | >10% |
| Free → betalande | 1–2% | >5% |
| Google Ads kostnad/klick | 2–4 kr | <2 kr |

---

## Princip

Sätt upp en gång. AI skriver innehållet. Kataloger och SEO ger passiv trafik.  
Noll support, noll närvaro, noll ansikte utåt.