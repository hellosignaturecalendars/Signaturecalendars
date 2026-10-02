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
