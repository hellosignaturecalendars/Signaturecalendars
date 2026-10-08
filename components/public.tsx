"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  MessageCircle,
} from "lucide-react";
import {
  estimate,
  whatsapp,
  imageUrl,
  type Content,
  type Design,
  type Price,
} from "@/lib/model";

/** Minimal custom select for the public gallery filters */
function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  return (
    <div ref={ref} className={`custom-select${open ? " open" : ""}`} style={{ width: "auto", minWidth: 175 }}>
      <button
        type="button"
        className="custom-select-trigger"
        aria-label={`${label}: ${value}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{ minHeight: 40, padding: "8px 12px" }}
      >
        <span>{value}</span>
        <svg className="custom-select-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className="custom-select-list" role="listbox">
          {options.map((opt) => (
            <li key={opt} role="option" aria-selected={opt === value}>
              <button
                type="button"
                className={`custom-select-option${opt === value ? " selected" : ""}`}
                onClick={() => { onChange(opt); setOpen(false); }}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
export function Arrow() {
  return <ArrowUpRight size={17} />;
}
export function Navigation({ business }: { business: Content["business"] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const brandName = /^signature calendars?$/i.test(business.name.trim())
    ? "Signature Calendars"
    : business.name;
  return (
    <>
      <header className="header masthead">
        <Link href="/" className="brand" aria-label={`${brandName} home`}>
          <svg width="0" height="0" className="logo-filter" aria-hidden="true" focusable="false">
            <defs>
              <filter id="header-logo-background" colorInterpolationFilters="sRGB">
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -3 -3 -3 8 0" />
              </filter>
            </defs>
          </svg>
          {business.logo ? (
            <img src={business.logo} alt={business.name} />
          ) : (
            <img src="/logo.png" alt={business.name} />
          )}
          <span className="brand-name">{brandName}</span>
        </Link>
        <button
          className="mobile-toggle"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? "open" : ""} aria-label="Main navigation">
          {[
            ["/designs", "Calendar Designs"],
            ["/products", "Products"],
            ["/pricing", "Pricing"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link
            className="button small"
            href="/contact"
            onClick={() => setOpen(false)}
          >
            Contact Us <Arrow />
          </Link>
        </nav>
      </header>
      {business.whatsapp && (
        <div className="contact-ribbon">
          <span>Need help choosing a calendar?</span>
          <a
            href={whatsapp(business.whatsapp)}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={18} />
            WhatsApp us
          </a>
        </div>
      )}
      <nav className="customer-shortcuts" aria-label="Quick customer actions">
        <Link
          href="/designs"
          aria-current={pathname.startsWith("/designs") ? "page" : undefined}
        >
          Browse Designs
        </Link>
        <Link
          href="/contact"
          aria-current={pathname === "/contact" ? "page" : undefined}
        >
          Contact Us <Arrow />
        </Link>
      </nav>
    </>
  );
}
export function CalendarScene({
  src = "/art/botanical.svg",
  variant = "",
  label = "Editable calendar artwork concept",
  priority = false,
}: {
  src?: string;
  variant?: string;
  label?: string;
  priority?: boolean;
}) {
  return (
    <div className={`calendar-scene ${variant}`}>
      <div className="scene-sun" />
      <div className="scene-line" />
      <div className="calendar-object">
        <div className="calendar-stand" />
        <div className="calendar-page">
          <div className="spiral" aria-hidden="true">
            {Array.from({ length: 15 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <img
            src={imageUrl(src)}
            alt={label}
            loading={priority ? "eager" : "lazy"}
          />
        </div>
      </div>
    </div>
  );
}
export function DesignCard({ design: d }: { design: Design }) {
  return (
    <article className="design-card">
      <Link
        className={`design-picture tone-${d.order % 3}`}
        href={`/designs/${d.id}`}
      >
        <CalendarScene
          src={d.cover}
          variant={d.format === "Vertical" ? "vertical" : ""}
          label={`${d.name} ΓÇö illustrative calendar concept`}
        />
        <span className="picture-tag">{d.format} desk calendar</span>
        <span className="picture-arrow">
          <Arrow />
        </span>
      </Link>
      <div className="design-meta">
        <span>{d.collection}</span>
        <span>{d.code}</span>
      </div>
      <h3>
        <Link href={`/designs/${d.id}`}>{d.name}</Link>
      </h3>
      <p>{d.description}</p>
      <small className="muted">{d.dimensions}</small>
      <div className="card-links">
        <Link href={`/designs/${d.id}`}>
          View Design <ArrowRight size={14} />
        </Link>
        <Link
          href={`/contact?design=${encodeURIComponent(`${d.name} (${d.code})`)}&path=/designs/${d.id}`}
        >
          Get a Quote <ArrowUpRight size={14} />
        </Link>
      </div>
    </article>
  );
}
export function Gallery({ content: c }: { content: Content }) {
  const [search, setSearch] = useState(""),
    [format, setFormat] = useState("All"),
    [category, setCategory] = useState("All"),
    [collection, setCollection] = useState("All"),
    [limit, setLimit] = useState(9);
  const designs = c.designs.filter(
    (d) =>
      (format === "All" || d.format === format) &&
      (category === "All" || d.category === category) &&
      (collection === "All" || d.collection === collection) &&
      `${d.name} ${d.code} ${d.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="gallery-guidance">
        <strong>Choose a calendar you like.</strong>
        <span>
          Click &quot;View Design&quot; to see the artwork, or &quot;Get a
          Quote&quot; to contact us about that calendar.
        </span>
      </div>
      <div className="gallery-toolbar">
        <div className="filter-tabs">
          {["All", "Horizontal", "Vertical"].map((f) => (
            <button
              className={format === f ? "active" : ""}
              key={f}
              onClick={() => {
                setFormat(f);
                setLimit(9);
              }}
            >
              {f === "All" ? "All designs" : f}
            </button>
          ))}
        </div>
        <label className="search">
          <Search size={17} />
          <input
            aria-label="Search designs"
            placeholder="Find your designΓÇª"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setLimit(9);
            }}
          />
        </label>
      </div>
      <div className="filter-selects">
        <label>
          Category{" "}
          <FilterSelect
            label="Category"
            value={category}
            onChange={(v) => { setCategory(v); setLimit(9); }}
            options={["All", ...c.categories]}
          />
        </label>
        <label>
          Collection{" "}
          <FilterSelect
            label="Collection"
            value={collection}
            onChange={(v) => { setCollection(v); setLimit(9); }}
            options={["All", ...c.collections]}
          />
        </label>
        <span>{designs.length} designs to make your own</span>
      </div>
      <div className="design-grid">
        {designs.slice(0, limit).map((d) => (
          <DesignCard key={d.id} design={d} />
        ))}
      </div>
      {!designs.length && (
        <div className="empty">
          No designs match your filters. Try another format or search.
        </div>
      )}
      {designs.length > limit && (
        <button className="button outline" onClick={() => setLimit(limit + 9)}>
          Load more designs
        </button>
      )}
    </>
  );
}
export function Estimator({
  price: p,
  content: c,
}: {
  price: Price;
  content: Content;
}) {
  const min = Math.min(...p.tiers.map((t) => t.min));
  const [quantity, setQuantity] = useState(min);
  const [includePackaging, setIncludePackaging] = useState(false);
  const unit = estimate(p, quantity);
  const products = c.products.filter((v) => p.productIds.includes(v.id));
  return (
    <div className="pricing-layout">
      <div>
        <span className="eyebrow">PERSONALIZED FOR YOUR BUSINESS</span>
        <h2>{p.name}</h2>
        <p>
          Applicable to:{" "}
          {products.map((v) => v.name).join(", ") || "No products assigned"}
        </p>
        <div className="price-table">
          <div>
            <span>Order quantity</span>
            <span>Price per calendar</span>
          </div>
          {[...p.tiers]
            .sort((a, b) => a.min - b.min)
            .map((t, i, all) => (
              <div className={unit === t.price ? "selected" : ""} key={t.min}>
                <span>
                  {t.min}
                  {all[i + 1] ? `ΓÇô${all[i + 1].min - 1}` : "+"} calendars
                </span>
                <strong>Γé╣{t.price}</strong>
              </div>
            ))}
        </div>
        <p className="fine">{p.packaging}</p>
      </div>
      <div className="estimator">
        <span className="eyebrow">A LITTLE PLANNING GOES A LONG WAY</span>
        <h3>Make it your year.</h3>
        <label htmlFor={`quantity-${p.id}`}>
          How many calendars do you have in mind?
        </label>
        <input
          id={`quantity-${p.id}`}
          type="number"
          min={min}
          max={1000000}
          value={quantity || ""}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        {unit && Number.isInteger(quantity) && quantity <= 1000000 ? (
          <>
            <div className="estimate-unit">
              <span>Price per calendar</span>
              <strong>Γé╣{unit}</strong>
            </div>
            <div className="estimate-total">
              <span>Estimated subtotal</span>
              <strong>
                Γé╣
                {(
                  quantity *
                  (unit + (includePackaging ? p.packagingCharge || 0 : 0))
                ).toLocaleString("en-IN")}
              </strong>
            </div>
          </>
        ) : (
          <p role="status">
            Enter a whole quantity of at least {min}, up to 1,000,000.
          </p>
        )}
        {p.packagingCharge !== undefined && (
          <label className="checkbox packaging-choice">
            <input
              type="checkbox"
              checked={includePackaging}
              onChange={(e) => setIncludePackaging(e.target.checked)}
            />
            Include optional packaging (Γé╣{p.packagingCharge} per calendar)
          </label>
        )}
        <p className="fine">
          {p.tax}
          <br />
          {p.shipping}
          <br />
          {p.packaging}
        </p>
        <Link
          className="button"
          href={`/contact?design=${encodeURIComponent(p.name)}&quantity=${quantity}`}
        >
          Request final quote <Arrow />
        </Link>
        <small>This is an estimate, not a confirmed order.</small>
      </div>
    </div>
  );
}
export function Lightbox({ design: d }: { design: Design }) {
  const images = [
    {
      id: "cover",
      url: d.cover,
      label: "Cover concept",
      alt: d.name,
      kind: "Artwork",
    },
    ...d.gallery.filter((m) => m.kind !== "PDF"),
  ];
  const [active, setActive] = useState(0),
    [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  const move = (n: number) =>
    setActive((v) => (v + n + images.length) % images.length);
  return (
    <div className="detail-gallery">
      <button
        className="main-preview"
        onClick={() => setOpen(true)}
        aria-label="Open image preview"
      >
        <img
          src={imageUrl(images[active].url, 1400)}
          alt={images[active].alt}
        />
        <span>Enlarge artwork Γåù</span>
      </button>
      <div className="thumbnails">
        {images.map((m, i) => (
          <button
            key={m.id}
            className={i === active ? "selected" : ""}
            onClick={() => setActive(i)}
            aria-label={m.label}
          >
            <img loading="lazy" src={imageUrl(m.url, 300)} alt={m.alt} />
          </button>
        ))}
      </div>
      <p className="fine">
        {images[active].kind} ┬╖ {images[active].label}
      </p>
      <dialog
        ref={dialog}
        onCancel={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") move(-1);
          if (e.key === "ArrowRight") move(1);
        }}
      >
        <button
          className="light-close"
          onClick={() => setOpen(false)}
          aria-label="Close preview"
        >
          <X />
        </button>
        <img src={images[active].url} alt={images[active].alt} />
        <div className="light-controls">
          <button onClick={() => move(-1)} aria-label="Previous image">
            <ChevronLeft />
          </button>
          <span>
            {images[active].label} ┬╖ {active + 1} / {images.length}
          </span>
          <button onClick={() => move(1)} aria-label="Next image">
            <ChevronRight />
          </button>
        </div>
      </dialog>
    </div>
  );
}
export function InquiryForm({
  business,
  preview,
  design = "",
  quantity = "",
  path = "",
}: {
  business: Content["business"];
  preview: boolean;
  design?: string;
  quantity?: string;
  path?: string;
}) {
  const [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState(false);
  const widget = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (preview || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return;
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      (window as any).turnstile?.render(widget.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      });
    };
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [preview]);
  return (
    <form
      className="inquiry-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setStatus("");
        const data = Object.fromEntries(new FormData(e.currentTarget));
        try {
          const r = await fetch("/api/inquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: data.name,
              company: data.company,
              phone: data.phone,
              email: data.email,
              quantity: data.quantity ? Number(data.quantity) : null,
              message: data.message,
              design: `${data.design}${path ? ` ΓÇö ${window.location.origin}${path}` : ""}`,
              website: data.website,
              token: data["cf-turnstile-response"] || "",
            }),
          });
          const result = await r.json();
          if (!r.ok) throw Error(result.error);
          setSuccess(true);
          setStatus(
            preview
              ? "Saved in the local preview. You can see this inquiry in the owner dashboard."
              : "Thank you. Your inquiry has been received.",
          );
        } catch (e) {
          setStatus((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-grid">
        <label>
          Your name *
          <input
            required
            name="name"
            minLength={2}
            maxLength={100}
            autoComplete="name"
          />
        </label>
        <label>
          Company name
          <input name="company" maxLength={150} autoComplete="organization" />
        </label>
        <label>
          Phone number
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
        <label>
          Email address
          <input name="email" type="email" autoComplete="email" />
        </label>
        <label>
          Selected design / product
          <input name="design" defaultValue={design} />
        </label>
        <label>
          Quantity
          <input
            name="quantity"
            type="number"
            min="1"
            max="1000000"
            defaultValue={quantity}
          />
        </label>
      </div>
      <p className="fine">
        Please include a valid phone number or email so we can reply.
      </p>
      <label>
        Your ideas, our starting point *
        <textarea
          required
          name="message"
          minLength={5}
          maxLength={3000}
          rows={4}
          placeholder="Tell us about your calendar, branding or packaging requirementsΓÇª"
        />
      </label>
      <div className="honeypot" aria-hidden="true">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div ref={widget} />
      <button disabled={busy || success} className="button" type="submit">
        {busy ? "SendingΓÇª" : success ? "Inquiry received" : "Send inquiry"}{" "}
        {success ? <Check size={16} /> : <Arrow />}
      </button>
      <p role="status" className={success ? "success" : "error"}>
        {status}
      </p>
      {preview && (
        <p className="fine">
          Development preview: inquiries are saved locally, not sent to the
          business.
        </p>
      )}
      {business.whatsapp && (
        <a
          className="text-link"
          href={whatsapp(
            business.whatsapp,
            design,
            Number(quantity) || undefined,
          )}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={16} /> Prefer a conversation? WhatsApp us
        </a>
      )}
    </form>
  );
}
