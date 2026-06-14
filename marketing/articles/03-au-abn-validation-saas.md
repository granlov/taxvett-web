---
title: "Australian ABN validation for SaaS developers"
tags: webdev, javascript, api, beginners
slug: australian-abn-validation-saas-developers
canonical_url:
cover_image:
scheduled: 2026-06-20
---

Selling to Australian businesses and never heard of ABN? That's fine, most people building global SaaS haven't. But once you have an Australian business customer, they're going to ask for it on the invoice. And if you don't collect it during checkout, you're adding friction later.

Here's the short version.

## What is an ABN?

ABN stands for Australian Business Number. It's an 11-digit identifier issued by the Australian Business Register, and basically every business entity in Australia has one. It goes on invoices. Australian businesses use it to claim GST credits back, so your B2B customers will want to provide it.

Legally, businesses are required to include their ABN on invoices over AUD 82.50. For a SaaS subscription that's pretty much every invoice.

## Validating ABNs

The official path is the ABR lookup API. It's free, but it requires registering for a developer GUID, and the response format is XML. There's also a checksum algorithm specific to ABNs that you'd need to implement for format validation before even hitting the registry.

Skip all of that. I use [TaxVett](https://taxvett.com) for this:

```bash
curl -X POST https://api.taxvett.com/v1/validate \
  -H "X-Api-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"number": "51824753556", "country": "AU"}'
```

Response:

```json
{
  "valid": true,
  "number": "51824753556",
  "country": "AU",
  "regime": "au_abn",
  "verification_method": "live_registry",
  "company_name": "Apple Pty Ltd"
}
```

The lookup goes against the live ABR registry, so you get the registered business name back too. This is useful for pre-filling the company name field in your checkout, or displaying "Invoices will be issued to: [company name]" before the customer confirms.

## A checkout pattern that works

Here's how I wire this into a checkout form. The ABN field validates on blur — no submit needed:

```typescript
// React (works with Next.js, Remix, Astro API routes, etc.)

async function validateABN(abn: string): Promise<{
  valid: boolean;
  companyName?: string;
}> {
  const normalised = abn.replace(/\s/g, "");

  const res = await fetch("/api/validate-abn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ abn: normalised }),
  });

  return res.json();
}

// In your form component:
function ABNField() {
  const [status, setStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [companyName, setCompanyName] = useState<string>();

  async function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const abn = e.target.value.trim();
    if (!abn) return;

    const result = await validateABN(abn);
    setStatus(result.valid ? "valid" : "invalid");
    setCompanyName(result.companyName);
  }

  return (
    <div>
      <input
        type="text"
        name="abn"
        placeholder="51 824 753 556"
        onBlur={handleBlur}
      />
      {status === "valid" && companyName && (
        <p className="text-sm text-green-600">✓ {companyName}</p>
      )}
      {status === "invalid" && (
        <p className="text-sm text-red-600">
          ABN not found. Check the number and try again.
        </p>
      )}
    </div>
  );
}
```

The server route that proxies the validation (keeps your API key out of the browser):

```typescript
// pages/api/validate-abn.ts or app/api/validate-abn/route.ts

export async function POST(req: Request) {
  const { abn } = await req.json();

  const res = await fetch("https://api.taxvett.com/v1/validate", {
    method: "POST",
    headers: {
      "X-Api-Key": process.env.TAXVETT_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ number: abn, country: "AU" }),
  });

  if (res.status === 422) {
    return Response.json({ valid: false });
  }

  const data = await res.json();
  return Response.json({
    valid: data.valid,
    companyName: data.company_name,
  });
}
```

## ABN format notes

ABNs are 11 digits. They're often written with spaces: `51 824 753 556`. Strip spaces before sending. The checksum validation catches a lot of typos before the request even reaches the registry, and the API returns a 422 for those cases so you can show a useful error without burning a lookup.

## What about GST registration?

Not every ABN holder is registered for GST. Sole traders under the AUD 75,000 annual revenue threshold don't have to be. The ABR API returns GST status if you need it, but for a global SaaS checkout, validating the ABN is enough. It confirms the business exists and is registered in Australia.

## Pros and cons

**Pros:** free tier covers development and early production (500 req/month), no XML or ABR developer GUID, returns the registered company name which you can show in checkout

**Cons:** paid at higher volumes (from 9 EUR/month), adds a third-party request to your checkout flow so handle timeouts gracefully

## Also works for EU and UK

If you're selling globally, the same endpoint handles UK VAT, all 27 EU member states, Norway and Singapore too. One API key, same response shape. The `regime` field tells you which registry handled the lookup (`au_abn`, `eu_vat`, `gb_vat`, etc.).

There's a [practical comparison of EU VAT validation options](#) and a [guide to UK VAT post-Brexit](#) if you need those regions covered too.
