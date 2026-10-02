import { notFound } from "next/navigation";
import Link from "next/link";
import { readContent } from "@/lib/server";
import { whatsapp } from "@/lib/model";
import { Lightbox } from "@/components/public";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    c = await readContent(),
    d = c.designs.find((v) => v.id === id);
  return {
    title: d ? `${d.name} | ${c.business.name}` : "Design not found",
    description: d?.description,
    openGraph: {
      title: d?.name,
      description: d?.description,
      images: d?.cover ? [d.cover] : [],
    },
  };
}
export default async function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    c = await readContent(),
    d = c.designs.find((v) => v.id === id);
  if (!d) notFound();
  const p = c.products.find((v) => v.id === d.productId);
  return (
    <main id="main" className="section">
      <div className="breadcrumb">
        <Link href="/designs">Calendar designs</Link>
        <span>/</span>
        {d.name}
      </div>
      <div className="detail-layout">
        <Lightbox design={d} />
        <div>
          <span className="eyebrow">
            {d.collection} / {d.code}
          </span>
          <h1>{d.name}</h1>
          <p>{d.description}</p>
          <dl>
            {[
              ["Format", d.format],
              ["Dimensions", d.dimensions],
              ["Paper & finish", p?.paper],
              ["Binding", p?.binding],
              ["Stand", p?.stand],
              ["Customization", p?.branding],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
          <Link
            className="button"
            href={`/contact?design=${encodeURIComponent(`${d.name} (${d.code})`)}&path=/designs/${d.id}`}
          >
            Enquire about this design ↗
          </Link>
          <a
            className="button outline"
            href={whatsapp(
              c.business.whatsapp,
              `${d.name} (${d.code}) — ${process.env.SITE_URL || "http://localhost:3000"}/designs/${d.id}`,
            )}
            target="_blank"
            rel="noreferrer"
          >
            Discuss on WhatsApp ↗
          </a>
          {d.pdf && (
            <a
              className="text-link"
              href={d.pdf}
              target="_blank"
              rel="noreferrer"
            >
              Open catalogue PDF ↗
            </a>
          )}
          {c.pricing.some((v) => v.productIds.includes(d.productId)) && (
            <Link className="text-link" href="/pricing">
              View applicable quantity pricing →
            </Link>
          )}
          <p className="fine">
            Artwork concepts show design direction. Final specifications and
            personalized proofs are confirmed with your quote.
          </p>
        </div>
      </div>
    </main>
  );
}
