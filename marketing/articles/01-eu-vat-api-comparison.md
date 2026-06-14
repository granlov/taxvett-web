---
title: "EU VAT validation APIs: a practical comparison"
tags: javascript, webdev, api, tax
slug: eu-vat-validation-api-compared
canonical_url:
cover_image:
scheduled: 2026-06-17
---

At some point in every B2B SaaS project, someone asks: "can we skip tax for EU business customers?" And then you spend a Friday afternoon finding out that yes, you can, but you need to validate their VAT number first. And that opens a whole thing.

This is what I found.

## Option 1: VIES directly

VIES is the official EU VAT database. It's run by the European Commission and it's free to use. Those are the good parts.

The bad part is that it's a SOAP API from around 2003 and it really shows. You write raw XML, send it over HTTP, and parse XML back. Error states come back as HTTP 200s with fault codes buried in the body. Some member states return full company names. Others return nothing. Germany is known for returning `MS_UNAVAILABLE` during regular business hours for no obvious reason.

Here's the minimal request:

```bash
curl -s https://ec.europa.eu/taxation_customs/vies/services/checkVatService \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soapenv:Body>
    <urn:checkVat>
      <urn:countryCode>SE</urn:countryCode>
      <urn:vatNumber>556543123401</urn:vatNumber>
    </urn:checkVat>
  </soapenv:Body>
</soapenv:Envelope>'
```

It works. Just budget time for XML parsing, error handling, and tests for the unavailable-state edge cases.

**Pros:** free, no rate limits, no third party in the chain
**Cons:** XML, inconsistent responses per country, no UK support (post-Brexit), needs defensive error handling

## Option 2: vatlayer / abstractapi / vatstack

A bunch of services wrap VIES in a REST API, which solves the XML problem. The docs are decent and the responses are consistent.

The catch is that most charge from the very first request. No real free tier. If you're running validations in development and staging too, costs add up before you've even shipped. I also noticed one service routing all lookups through a single US region, which adds unnecessary latency for European customers.

**Pros:** clean REST API, no XML
**Cons:** cost starts from day one, EU-only coverage on most plans

## Option 3: TaxVett

[TaxVett](https://taxvett.com) is what I ended up using. 500 free lookups per month, no credit card needed, and it covers not just EU but also UK, Norway, Australia and Singapore in the same API. For a checkout that sells into multiple regions that's actually pretty useful.

The request is simple:

```bash
curl -X POST https://api.taxvett.com/v1/validate \
  -H "X-Api-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"number": "SE556543123401"}'
```

Response:

```json
{
  "valid": true,
  "number": "SE556543123401",
  "country": "SE",
  "regime": "eu_vat",
  "verification_method": "live_registry",
  "company_name": "Acme AB",
  "company_address": "Stockholm, Sweden"
}
```

Country is auto-detected from the number prefix, so you don't need to pass it unless the format is ambiguous. If VIES is unavailable for a specific country, you get a proper error back in the same JSON shape rather than a silent success.

For UK numbers, it routes to HMRC instead of VIES. There's a [separate post on UK VAT validation here](#) if you need that specifically.

**Pros:** free to start, REST API, consistent response across all countries, covers UK/AU/NO/SG too
**Cons:** third-party dependency, paid plans kick in at higher volumes (from 9 EUR/month)

## How I integrated it in Node.js

```typescript
async function validateVatNumber(vatNumber: string): Promise<{
  valid: boolean;
  companyName?: string;
}> {
  const response = await fetch("https://api.taxvett.com/v1/validate", {
    method: "POST",
    headers: {
      "X-Api-Key": process.env.TAXVETT_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ number: vatNumber }),
  });

  if (!response.ok) {
    // 422 = format invalid, 404 = not found in registry
    return { valid: false };
  }

  const data = await response.json();
  return {
    valid: data.valid,
    companyName: data.company_name,
  };
}
```

When `valid` is true, I also prefill the company name in the checkout form. Saves the customer a step and feels polished.

## The batch endpoint

If you need to validate existing customers in bulk, there's also a batch endpoint:

```bash
curl -X POST https://api.taxvett.com/v1/validate/batch \
  -H "X-Api-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "numbers": [
      {"number": "SE556543123401"},
      {"number": "DE123456789"},
      {"number": "FR12345678901"}
    ]
  }'
```

Up to 50 per request. Each one counts against your quota separately, which matters if you're on the free plan.

## What to pick

If you're EU-only and happy with XML and error handling: VIES directly is totally fine and free.

If you want a clean API and are selling into multiple regions: a wrapper is worth it. TaxVett is the only one I found with a real free tier, which made it easy to evaluate without committing to anything.
