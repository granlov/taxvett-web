---
title: "How to validate UK VAT numbers in Node.js (post-Brexit edition)"
tags: node, javascript, typescript, api
slug: validate-uk-vat-numbers-nodejs
canonical_url:
cover_image:
published: 2026-06-14
---

UK VAT numbers used to be validated through VIES like every other European country. After Brexit they moved to HMRC's own API — which is well-designed for what it does, but comes with some integration overhead that's worth knowing about upfront.

Here's a clean way to handle UK VAT validation, and how to extend it to cover EU and beyond with the same integration.

## The HMRC API: solid, but not lightweight

HMRC's VAT validation endpoint lives inside their MTD (Making Tax Digital) API platform. It's a proper, well-documented API — but it's built for accountancy software integrations, not quick checkout validations. Using it directly means:

- Registering a developer account and creating an application
- Implementing OAuth client credentials flow and handling token refresh
- Going through HMRC's production credentials approval process before going live

The endpoint itself (`GET /organisations/vat/check-vat-number/lookup/{targetVrn}`) works well once it's set up. The overhead is just higher than you might expect for a single-country number check.

The other consideration: if you're selling into EU countries as well, you'd need a separate VIES integration alongside it — two auth systems, two error models.

## One endpoint for UK, EU, and more

I use [TaxVett](https://taxvett.com) for this. It covers UK (HMRC), all 27 EU member states (VIES), Norway, Australia, and Singapore — one REST endpoint, one API key, consistent response format across all of them. For a checkout that sells into multiple regions, that's the main reason to reach for it.

For UK specifically, you just pass the number:

```bash
curl -X POST https://api.taxvett.com/v1/validate \
  -H "X-Api-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"number": "GB123456789"}'
```

UK numbers use `GB` prefix — auto-detected, no `country` field needed.

## Full integration example

Here's a TypeScript module I use in a Next.js API route:

```typescript
// lib/vat.ts

interface ValidationResult {
  valid: boolean;
  companyName?: string;
  companyAddress?: string;
}

export async function validateUKVat(
  vatNumber: string
): Promise<ValidationResult> {
  // Normalise: strip spaces and ensure GB prefix
  const normalised = vatNumber.replace(/\s/g, "").toUpperCase();
  const withPrefix = normalised.startsWith("GB")
    ? normalised
    : `GB${normalised}`;

  const res = await fetch("https://api.taxvett.com/v1/validate", {
    method: "POST",
    headers: {
      "X-Api-Key": process.env.TAXVETT_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ number: withPrefix, country: "GB" }),
  });

  if (res.status === 422) {
    // Format validation failed before hitting the registry
    return { valid: false };
  }

  if (!res.ok) {
    throw new Error(`TaxVett error: ${res.status}`);
  }

  const data = await res.json();
  return {
    valid: data.valid,
    companyName: data.company_name,
    companyAddress: data.company_address,
  };
}
```

And in the API route:

```typescript
// pages/api/checkout/validate-vat.ts

import { validateUKVat } from "@/lib/vat";

export default async function handler(req, res) {
  const { vatNumber } = req.body;

  if (!vatNumber || typeof vatNumber !== "string") {
    return res.status(400).json({ error: "vatNumber required" });
  }

  try {
    const result = await validateUKVat(vatNumber);
    return res.status(200).json(result);
  } catch (err) {
    // Don't block checkout if validation service is down
    // Log the error, return valid: null to signal uncertainty
    console.error("VAT validation error", err);
    return res.status(200).json({ valid: null });
  }
}
```

The `valid: null` pattern is intentional — I'd rather complete a sale and flag it for manual review than reject a legitimate customer because of a network timeout.

## What format do UK VAT numbers have?

UK VAT numbers are 9 digits, optionally prefixed with `GB`. Branch traders use a 12-digit variant (`GB` + 9 digits + 3-digit branch code). A few formats the normalisation above handles:

| Input | Normalised |
|-------|-----------|
| `123 4567 89` | `GB123456789` |
| `gb123456789` | `GB123456789` |
| `GB 123 4567 89` | `GB123456789` |

HMRC's test number `GB999999973` works in sandbox environments if you want to check the integration is wired up before going live.

## Does this work for EU VAT too?

Yes — the same endpoint handles all 27 EU member states, Norway, Australia, and Singapore. If you're selling into multiple regions you validate with one integration and get a consistent response shape regardless of which registry handled the lookup. There's a [practical comparison of EU VAT validation options](#) if you want more detail on the EU side.

## When it makes sense, and when it doesn't

**Good fit:**
- You're selling into more than one region and don't want separate integrations per country
- You're in early development and want to iterate fast — the free plan covers 500 lookups/month, no card required
- You want a consistent JSON response regardless of which registry handles the lookup

**Worth considering:**
- If you only need UK and already have an OAuth setup, hitting HMRC directly is free with no per-request cost
- VAT numbers pass through a third-party API — if your compliance requirements are strict about data routing, check TaxVett's [privacy policy](https://taxvett.com/privacy) before integrating
- At higher volumes the paid plans kick in (Pro from €9/month). For a high-traffic checkout that's still cheap, but it's not free forever

For most B2B SaaS checkouts, the free tier is enough to get to production. The cost question only becomes relevant once you're validating thousands of numbers a month — at which point you probably have paying customers and the API cost is noise.
