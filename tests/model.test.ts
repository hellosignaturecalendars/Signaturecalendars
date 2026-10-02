import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contentSchema,
  estimate,
  inquirySchema,
  publicContent,
  whatsapp,
} from "../lib/model";
import { seed } from "../lib/seed";
import { validateFile, fileKind, trustedCloudinaryPdf } from "../lib/media";
import { deliverPdf } from "../lib/pdf";
test("upload validation blocks wrong types, empty and oversized files", () => {
  assert.throws(() => validateFile({ size: 0, type: "image/png" }));
  assert.throws(() => validateFile({ size: 10_000_001, type: "image/png" }));
  assert.throws(() => validateFile({ size: 500, type: "image/svg+xml" }));
  assert.throws(() =>
    validateFile({ size: 500, type: "application/pdf" }, "image"),
  );
  assert.doesNotThrow(() =>
    validateFile({ size: 500, type: "application/pdf" }, "pdf"),
  );
  assert.equal(fileKind(Buffer.from("%PDF-1.4")), "pdf");
  assert.equal(fileKind(Buffer.from("<html>")), null);
});
test("PDF fetch only permits saved Cloudinary delivery URLs and validates bytes", async () => {
  let fetched = false;
  const fake = (async () => {
    fetched = true;
    return new Response("%PDF-1.4\nfixture");
  }) as typeof fetch;
  const url = "https://res.cloudinary.com/test/raw/upload/catalogue.pdf";
  assert(trustedCloudinaryPdf(url, "test"));
  assert(!trustedCloudinaryPdf("http://127.0.0.1/private"));
  assert(!trustedCloudinaryPdf(url, "different"));
  assert.equal(
    (
      await deliverPdf(
        "https://attacker.example/a",
        "test",
        true,
        false,
        undefined,
        fake,
      )
    ).status,
    400,
  );
  assert(!fetched);
  const view = await deliverPdf(url, "calendar", false, false, "test", fake);
  assert.equal(view.status, 200);
  assert.equal(
    view.headers.get("Content-Disposition"),
    'inline; filename="calendar.pdf"',
  );
  assert.equal(view.headers.get("Content-Type"), "application/pdf");
  const download = await deliverPdf(url, "calendar", true, true, "test", fake);
  assert.match(download.headers.get("Content-Disposition")!, /^attachment/);
  assert.equal(download.headers.get("Cache-Control"), "private, no-store");
  assert.equal(await download.text(), "%PDF-1.4\nfixture");
  const blocked = await deliverPdf(
    url,
    "calendar",
    false,
    false,
    "test",
    (async () => new Response("Denied", { status: 403 })) as typeof fetch,
  );
  assert.equal(blocked.status, 502);
  const bad = await deliverPdf(
    url,
    "calendar",
    false,
    false,
    "test",
    (async () => new Response("<html>Not a PDF</html>")) as typeof fetch,
  );
  assert.equal(bad.status, 502);
});
test("quantity pricing respects every boundary and minimum", () => {
  const p = seed.pricing[0];
  for (const [q, price] of [
    [99, null],
    [100, 239],
    [199, 239],
    [200, 229],
    [299, 229],
    [300, 219],
    [399, 219],
    [400, 209],
    [499, 209],
    [500, 199],
    [599, 199],
    [600, 189],
    [1000, 189],
  ])
    assert.equal(estimate(p, q!), price);
});
test("public payload removes draft designs, draft FAQs and media metadata", () => {
  const c = structuredClone(seed);
  c.designs[0].published = false;
  c.faqs[0].published = false;
  c.media = [
    {
      id: "secret",
      url: "/art/month.svg",
      alt: "",
      label: "private",
      kind: "Artwork",
      publicId: "secret",
    },
  ];
  const p = publicContent(c);
  assert.equal(p.designs.length, 2);
  assert.equal(p.faqs.length, 2);
  assert.deepEqual(p.media, []);
  assert.equal(c.designs.length, 3);
});
test("inquiry validation rejects missing contacts, extra private fields and spam", () => {
  const input = {
    name: "Test Person",
    message: "Please send a quote",
    phone: "+91 9145057351",
  };
  assert(inquirySchema.safeParse(input).success);
  assert(
    inquirySchema.safeParse({ ...input, phone: "", email: "a@example.com" })
      .success,
  );
  assert(!inquirySchema.safeParse({ ...input, phone: "" }).success);
  assert(!inquirySchema.safeParse({ ...input, notes: "injected" }).success);
  assert(!inquirySchema.safeParse({ ...input, website: "spam" }).success);
  assert(!inquirySchema.safeParse({ ...input, quantity: -1 }).success);
});
test("duplicate design codes, unsafe URLs and duplicate tier quantities fail", () => {
  assert(contentSchema.safeParse(seed).success);
  const c = structuredClone(seed);
  c.designs[1].code = c.designs[0].code;
  assert(!contentSchema.safeParse(c).success);
  const d = structuredClone(seed);
  d.business.logo = "javascript:alert(1)";
  assert(!contentSchema.safeParse(d).success);
  const p = structuredClone(seed);
  p.pricing[0].tiers.push(p.pricing[0].tiers[0]);
  assert(!contentSchema.safeParse(p).success);
});
test("WhatsApp safely includes design and quantity", () => {
  const u = new URL(
    whatsapp("+91 9145057351", "Botanical studies (SC-001)", 200),
  );
  assert.equal(u.pathname, "/919145057351");
  assert.match(u.searchParams.get("text")!, /SC-001/);
  assert.match(u.searchParams.get("text")!, /200/);
});
