import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  PenTool,
  Layers,
  Leaf,
} from "lucide-react";
import { readContent } from "@/lib/server";
import { CalendarScene, DesignCard } from "@/components/public";
export async function generateMetadata() {
  const c = await readContent();
  return c.seo.find((s) => s.page === "home") || {};
}
export default async function Home() {
  const c = await readContent();
  const h = c.home;
  const prices = c.pricing.filter((p) =>
    p.productIds.some((id) => c.products.some((v) => v.id === id)),
  );
  const low = prices.length
    ? Math.min(...prices.flatMap((p) => p.tiers.map((t) => t.price)))
    : null;
  return (
    <main id="main">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <i /> {h.eyebrow}
          </span>
          <h1>
            {h.title.split("\n").map((s, i) => (
              <span key={i} className={i ? "serif-italic" : ""}>
                {s}
              </span>
            ))}
          </h1>
          <p>{h.description}</p>
          <div className="hero-actions">
            <Link className="button" href={h.primaryHref || "/designs"}>
              {h.primaryLabel} <ArrowUpRight size={17} />
            </Link>
            <Link
              className="button outline"
              href={h.secondaryHref || "/contact"}
            >
              {h.secondaryLabel} <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-note">
            <span className="tiny-icon">✳</span> {h.note}
          </div>
        </div>
        <div className="hero-art">
          <CalendarScene src={h.heroImage} priority />
          <div className="hero-art-note">
            <span>THE ART OF EVERYDAY</span>
            <span>01 — 12</span>
          </div>
          <div className="floating-note">
            <Leaf size={20} />
            <span>
              A fresh perspective.
              <br />
              <b>Every single month.</b>
            </span>
          </div>
        </div>
      </section>
      <div className="value-strip">
        <span>
          <PenTool size={17} /> Personalized for your brand
        </span>
        <span>
          <Layers size={17} /> Thoughtful design, inside out
        </span>
        <span>
          <Sparkles size={17} /> Corporate gifting, considered
        </span>
        <span>
          <Leaf size={17} /> Made to be part of the everyday
        </span>
      </div>
      {h.showCollections && (
        <section className="section collections">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE DESIGN COLLECTION</span>
              <h2>{h.collectionsTitle}</h2>
              <p>{h.collectionsText}</p>
            </div>
            <Link className="text-link" href="/designs">
              View All Calendar Designs <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="design-grid">
            {c.designs
              .filter((d) => d.featured)
              .sort((a, b) => a.order - b.order)
              .slice(0, 3)
              .map((d) => (
                <DesignCard key={d.id} design={d} />
              ))}
          </div>
        </section>
      )}
      {h.showProducts && (
        <section className="section product-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A FORMAT THAT FITS</span>
              <h2>{h.productsTitle}</h2>
            </div>
            <p>{h.productsText}</p>
          </div>
          <div className="product-duo">
            {c.products.slice(0, 2).map((p, i) => (
              <Link
                href={`/products#${p.id}`}
                className={`product-feature product-${i}`}
                key={p.id}
              >
                <div>
                  <span className="eyebrow">
                    0{i + 1} / {p.format}
                  </span>
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <span className="text-link">
                    Meet your calendar <ArrowUpRight size={16} />
                  </span>
                </div>
                <CalendarScene
                  src={i ? "/art/architecture.svg" : "/art/month.svg"}
                  variant={i ? "vertical" : ""}
                />
              </Link>
            ))}
          </div>
        </section>
      )}
      {h.showProcess && (
        <section className="section process">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FROM OUR STUDIO TO YOUR DESK</span>
              <h2>{h.processTitle}</h2>
            </div>
            <Link className="text-link" href="/products">
              How it comes together <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="steps">
            {[
              [h.step1Title, h.step1Text],
              [h.step2Title, h.step2Text],
              [h.step3Title, h.step3Text],
              [h.step4Title, h.step4Text],
            ].map(([t, b], i) => (
              <div key={t}>
                <span className="step-num">0{i + 1}</span>
                <h3>{t}</h3>
                <p>{b}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {h.showQuality && (
        <section className="quality-band">
          <span className="eyebrow">THOUGHTFUL BY DESIGN</span>
          <h2>{h.qualityTitle}</h2>
          <p>{h.qualityText}</p>
          <Link className="text-link" href="/products">
            Discover the details <ArrowRight size={16} />
          </Link>
        </section>
      )}
      {h.showPricing && (
        <section className="section price-preview">
          <div>
            <span className="eyebrow">GOOD DESIGN. CLEAR PRICING.</span>
            <h2>{h.pricingTitle}</h2>
            <p>{h.pricingText}</p>
            <Link className="button outline" href="/pricing">
              View pricing & estimate <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="price-callout">
            <span>SELECTED BULK CALENDARS FROM</span>
            <div>
              {low ? `₹${low}` : "Let’s talk"}
              <small>{low ? " / calendar" : ""}</small>
            </div>
            <p>
              {low
                ? "Applicable to assigned products and qualifying quantities."
                : "Request a personalized quote for your requirements."}
              <br />
              Taxes, delivery and extras confirmed in your quote.
            </p>
          </div>
        </section>
      )}
      <section className="contact-band">
        <span className="eyebrow">SOMETHING GOOD IS ON THE CALENDAR</span>
        <h2>{h.contactTitle}</h2>
        <Link className="button cream" href="/contact">
          Start a conversation <ArrowUpRight size={17} />
        </Link>
      </section>
    </main>
  );
}
