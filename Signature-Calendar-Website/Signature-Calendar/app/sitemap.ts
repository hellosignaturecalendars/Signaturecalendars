import { readContent } from "@/lib/server";
export const dynamic = "force-dynamic";
export default async function sitemap() {
  const c = await readContent(),
    base = process.env.SITE_URL || "http://localhost:3000";
  return [
    "",
    "/designs",
    "/products",
    "/pricing",
    "/about",
    "/contact",
    "/faq",
    ...c.designs.map((d) => `/designs/${d.id}`),
  ].map((p) => ({ url: base + p }));
}
