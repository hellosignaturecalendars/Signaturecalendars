import Link from "next/link";
import { readContent, preview } from "@/lib/server";
import { Navigation } from "@/components/public";
import { BusinessLinks } from "@/components/business-links";
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const c = await readContent();
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: c.business.name,
    ...(process.env.SITE_URL ? { url: process.env.SITE_URL } : {}),
    ...(c.business.phone ? { telephone: c.business.phone } : {}),
    ...(c.business.email ? { email: c.business.email } : {}),
    ...(c.business.logo ? { logo: c.business.logo } : {}),
    sameAs: [
      c.business.instagram,
      c.business.linkedin,
      c.business.other,
      c.business.facebook,
      ...(c.business.socialLinks || []).map((s) => s.url),
    ].filter(Boolean),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organization).replace(/</g, "\\u003c"),
        }}
      />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {preview && (
        <div className="preview-bar">
          DEVELOPMENT PREVIEW{" "}
          <span>· Sample artwork · Live services not connected</span>
          <Link href="/admin">Owner dashboard ↗</Link>
        </div>
      )}
      <Navigation business={c.business} />
      {children}
      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <Link href="/" className="footer-brand">
              {c.business.name}
            </Link>
            <p>{c.business.footer}</p>
          </div>
          <div>
            <span className="eyebrow">TAKE A LOOK</span>
            <Link href="/designs">Calendar designs</Link>
            <Link href="/products">Products & customization</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/about">About Signature Calendar</Link>
          </div>
          <div>
            <span className="eyebrow">LET’S CONNECT</span>
            <Link href="/contact">Contact us</Link>
            <Link href="/faq">Frequently asked questions</Link>
            <BusinessLinks business={c.business} />
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {c.business.name}
          </span>
          <span>Made for the days ahead.</span>
        </div>
      </footer>
    </>
  );
}
