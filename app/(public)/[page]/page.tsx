import Link from "next/link";
import { notFound } from "next/navigation";
import { readContent, preview } from "@/lib/server";
import {
  Gallery,
  Estimator,
  InquiryForm,
  CalendarScene,
} from "@/components/public";
import { whatsapp } from "@/lib/model";
import { BusinessLinks } from "@/components/business-links";
const pages = ["designs", "products", "pricing", "about", "contact", "faq"];
export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const c = await readContent();
  const seo = c.seo.find((s) => s.page === page);
  return {
    ...seo,
    alternates: { canonical: `/${page}` },
    openGraph: { title: seo?.title, description: seo?.description },
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ page: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { page } = await params;
  if (!pages.includes(page)) notFound();
  const c = await readContent(),
    q = await searchParams;
  const titles: Record<string, [string, string, string]> = {
    designs: [
      "THE DESIGN COLLECTION",
      "Calendar Designs",
      "Choose a design, view its artwork, and contact us to add your logo and business details.",
    ],
    products: [
      "CRAFTED AROUND YOUR BRAND",
      c.home.productsTitle,
      "Thoughtful formats. Personal details. A calendar made to belong.",
    ],
    pricing: [
      "PLANNED WITH YOU IN MIND",
      "Good design. Clear pricing.",
      "Find the right quantity for your business. We’ll help with the details.",
    ],
    about: [
      "THE SIGNATURE STORY",
      c.about.title,
      "Thoughtfully designed. Personally yours.",
    ],
    contact: [
      "LET’S MAKE SOMETHING PERSONAL",
      "Contact Us",
      "Call, WhatsApp, or send an inquiry. Share your preferred design and quantity if you know them.",
    ],
    faq: [
      "A FEW HELPFUL ANSWERS",
      "Good things to know.",
      "The details behind your personalized calendar.",
    ],
  };
  const [eye, title, sub] = titles[page];
  const pageCopy = c.seo.find((s) => s.page === page);
  return (
    <main id="main">
      <section className="page-intro">
        <span className="eyebrow">{eye}</span>
        <h1>{pageCopy?.heading || title}</h1>
        <p>{pageCopy?.introduction || sub}</p>
      </section>
      <section className="section page-content">
        {page === "designs" && <Gallery content={c} />}{" "}
        {page === "pricing" && (
          <>
            {c.pricing
              .filter((p) =>
                p.productIds.some((id) => c.products.some((v) => v.id === id)),
              )
              .map((p) => (
                <Estimator key={p.id} price={p} content={c} />
              ))}
            {!c.pricing.length && (
              <p>Request a quote for your selected product and quantity.</p>
            )}
          </>
        )}
        {page === "products" && (
          <>
            <div className="products-list">
              {c.products.map((p, i) => (
                <article id={p.id} key={p.id} className="product-detail">
                  <CalendarScene
                    src={i % 2 ? "/art/architecture.svg" : "/art/month.svg"}
                    variant={i % 2 ? "vertical" : ""}
                  />
                  <div>
                    <span className="eyebrow">{p.format} FORMAT</span>
                    <h2>{p.name}</h2>
                    <p>{p.description}</p>
                    <dl>
                      {[
                        ["Dimensions", p.dimensions],
                        ["Paper & finish", p.paper],
                        ["Pages", p.pages],
                        ["Binding", p.binding],
                        ["Stand", p.stand],
                        ["Personalization", p.branding],
                        ["Packaging", p.packaging],
                        [
                          "Minimum quantity",
                          p.moq ? String(p.moq) : "Confirm with your quote",
                        ],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <dt>{k}</dt>
                          <dd>{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <Link
                      className="button"
                      href={`/contact?design=${encodeURIComponent(p.name)}`}
                    >
                      Enquire about this product ↗
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <h2>From an idea to the everyday.</h2>
            <div className="steps">
              {[
                "Choose a design",
                "Share requirements and branding",
                "Approve your proof",
                "Production and delivery",
              ].map((s, i) => (
                <div key={s}>
                  <span className="step-num">0{i + 1}</span>
                  <h3>{s}</h3>
                </div>
              ))}
            </div>
            <p>
              Specifications and delivery arrangements are confirmed as part of
              your quotation and proof approval.
            </p>
          </>
        )}
        {page === "about" && (
          <div className="about-layout">
            <CalendarScene />
            <div>
              <h2>Designed with intention.</h2>
              <p>{c.about.body}</p>
              <p>{c.about.approach}</p>
              <h3>How we can help</h3>
              <ul className="services">
                {c.about.services
                  .split("\n")
                  .filter(Boolean)
                  .map((s) => (
                    <li key={s}>{s}</li>
                  ))}
              </ul>
              <Link className="button" href="/contact">
                Tell us your idea ↗
              </Link>
            </div>
          </div>
        )}
        {page === "faq" && (
          <div className="faqs">
            {c.faqs.map((f) => (
              <details key={f.id}>
                <summary>
                  {f.question}
                  <span>+</span>
                </summary>
                <p>{f.answer}</p>
              </details>
            ))}
            <p>
              Something else on your mind?{" "}
              <Link href="/contact">Start a conversation ↗</Link>
            </p>
          </div>
        )}
        {page === "contact" && (
          <div className="contact-layout">
            <div>
              <h2>Let’s talk calendars.</h2>
              <p>
                For a single idea or a whole team.
                <br />
                We’d love to hear what you’re planning.
              </p>
              <div className="contact-details">
                <h3>{c.business.name}</h3>
                <BusinessLinks business={c.business} />
              </div>
            </div>
            <InquiryForm
              business={c.business}
              preview={preview}
              design={q.design || ""}
              quantity={q.quantity || ""}
              path={q.path?.startsWith("/designs/") ? q.path : ""}
            />
          </div>
        )}
      </section>
    </main>
  );
}
