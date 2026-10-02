import { z } from "zod";
const text = z.string().max(6000);
const url = z
  .string()
  .max(2000)
  .refine(
    (v) => !v || /^https:\/\//.test(v) || /^\/[a-z0-9/_.-]+$/.test(v),
    "Use an HTTPS URL or a built-in asset path",
  );
export const mediaSchema = z.object({
  id: text,
  url,
  alt: text,
  label: text,
  kind: z.enum(["Artwork", "Mockup", "PDF"]),
  publicId: text.default(""),
  deliveryVerified: z.boolean().optional(),
});
export const designSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: text,
  code: z.string().min(1).max(50),
  description: text,
  format: z.enum(["Horizontal", "Vertical"]),
  dimensions: text,
  category: text,
  collection: text,
  cover: url,
  gallery: z.array(mediaSchema).max(30),
  pdf: url,
  published: z.boolean(),
  featured: z.boolean(),
  order: z.number(),
  productId: text,
});
export const productSchema = z.object({
  id: text,
  name: text,
  format: text,
  dimensions: text,
  paper: text,
  pages: text,
  binding: text,
  stand: text,
  branding: text,
  packaging: text,
  moq: z.number().int().nonnegative(),
  description: text,
});
export const pricingSchema = z
  .object({
    id: text,
    name: text,
    productIds: z.array(text),
    tiers: z
      .array(
        z.object({
          min: z.number().int().positive(),
          price: z.number().positive(),
        }),
      )
      .min(1),
    packaging: text,
    packagingCharge: z.number().min(0).max(1000000).optional(),
    tax: text,
    shipping: text,
  })
  .refine(
    (p) => new Set(p.tiers.map((t) => t.min)).size === p.tiers.length,
    "Quantity tiers must have unique minimum quantities",
  );
export const contentSchema = z
  .object({
    business: z.object({
      name: text,
      tagline: text,
      logo: url,
      phone: text,
      whatsapp: text,
      email: z.union([z.literal(""), z.string().email()]),
      address: text,
      hours: text,
      instagram: url,
      linkedin: url,
      facebook: url.optional(),
      socialLinks: z
        .array(
          z.object({
            label: z.string().trim().min(1).max(60),
            url: z.string().url().startsWith("https://"),
          }),
        )
        .max(12)
        .optional(),
      other: url,
      footer: text,
    }),
    home: z.object({
      eyebrow: text,
      title: text,
      description: text,
      heroImage: url,
      primaryLabel: text,
      secondaryLabel: text,
      primaryHref: z
        .string()
        .regex(/^\/(?!\/)[a-zA-Z0-9/?=&%#_-]*$/)
        .optional(),
      secondaryHref: z
        .string()
        .regex(/^\/(?!\/)[a-zA-Z0-9/?=&%#_-]*$/)
        .optional(),
      note: text.optional(),
      productsText: text.optional(),
      pricingTitle: text.optional(),
      pricingText: text.optional(),
      step1Title: text.optional(),
      step1Text: text.optional(),
      step2Title: text.optional(),
      step2Text: text.optional(),
      step3Title: text.optional(),
      step3Text: text.optional(),
      step4Title: text.optional(),
      step4Text: text.optional(),
      collectionsTitle: text,
      collectionsText: text,
      productsTitle: text,
      processTitle: text,
      qualityTitle: text,
      qualityText: text,
      contactTitle: text,
      showCollections: z.boolean(),
      showProducts: z.boolean(),
      showProcess: z.boolean(),
      showQuality: z.boolean(),
      showPricing: z.boolean(),
    }),
    about: z.object({
      title: text,
      body: text,
      approach: text,
      services: text,
    }),
    categories: z.array(text),
    collections: z.array(text),
    designs: z.array(designSchema),
    products: z.array(productSchema),
    pricing: z.array(pricingSchema),
    faqs: z.array(
      z.object({
        id: text,
        question: text,
        answer: text,
        published: z.boolean(),
      }),
    ),
    media: z.array(mediaSchema),
    seo: z.array(
      z.object({
        page: text,
        title: text,
        description: text,
        heading: text.optional(),
        introduction: text.optional(),
      }),
    ),
  })
  .refine(
    (c) =>
      new Set(c.designs.map((d) => d.code.toLowerCase())).size ===
      c.designs.length,
    "Design codes must be unique",
  )
  .refine(
    (c) => new Set(c.designs.map((d) => d.id)).size === c.designs.length,
    "Design URLs must be unique",
  );
export type Content = z.infer<typeof contentSchema>;
export type Design = z.infer<typeof designSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type Price = z.infer<typeof pricingSchema>;
export type Inquiry = {
  id: string;
  createdAt: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  design: string;
  quantity: number | null;
  message: string;
  status: string;
  notes: string;
};
export const inquirySchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    company: z.string().trim().max(150).default(""),
    phone: z.string().trim().max(25).default(""),
    email: z.union([z.literal(""), z.string().email().max(200)]).default(""),
    design: z.string().max(300).default(""),
    quantity: z.number().int().min(1).max(1000000).nullable().default(null),
    message: z.string().trim().min(5).max(3000),
    website: z.string().max(0).default(""),
    token: z.string().max(3000).default(""),
  })
  .strict()
  .refine(
    (v) => !!v.email || /^[+\d ()-]{7,25}$/.test(v.phone),
    "Enter a valid phone number or email address",
  );
export function estimate(price: Price, quantity: number) {
  return (
    [...price.tiers]
      .sort((a, b) => b.min - a.min)
      .find((t) => quantity >= t.min)?.price ?? null
  );
}
export function whatsapp(phone: string, design?: string, quantity?: number) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello, I’d like to enquire about ${design || "Signature Calendar"}${quantity ? `, quantity: ${quantity}` : ""}. Please share details.`)}`;
}
export function publicContent(c: Content): Content {
  return {
    ...c,
    designs: c.designs.filter((d) => d.published),
    faqs: c.faqs.filter((f) => f.published),
    media: [],
  };
}
export function imageUrl(url: string, width = 1000) {
  return url.startsWith("https://res.cloudinary.com/") &&
    url.includes("/image/upload/")
    ? url.replace(
        "/image/upload/",
        `/image/upload/f_auto,q_auto,c_limit,w_${width}/`,
      )
    : url;
}
