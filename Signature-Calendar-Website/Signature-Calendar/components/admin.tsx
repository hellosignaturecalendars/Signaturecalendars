"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  inMemoryPersistence,
  setPersistence,
} from "firebase/auth";
import type { Content, Design, Inquiry, Media } from "@/lib/model";
import { whatsapp } from "@/lib/model";
import { CalendarScene, DesignCard } from "./public";
const labels: Record<string, string> = {
  id: "URL identifier",
  name: "Name",
  code: "Unique design code",
  description: "Description",
  format: "Format",
  dimensions: "Dimensions",
  category: "Category",
  collection: "Collection",
  cover: "Cover image URL",
  pdf: "Catalogue PDF URL",
  published: "Published",
  featured: "Featured on homepage",
  order: "Display order",
  productId: "Product",
  phone: "Phone",
  whatsapp: "WhatsApp number",
  email: "Email address",
  address: "Address / service area",
  hours: "Business hours",
  heroImage: "Hero artwork URL",
  primaryLabel: "Explore designs button label",
  secondaryLabel: "Request a quote button label",
  moq: "Minimum order quantity (0 = ask for quote)",
  productIds: "Assigned products",
  paper: "Paper GSM & finish",
  pages: "Page configuration",
  binding: "Binding",
  stand: "Stand",
  branding: "Branding options",
  packaging: "Packaging note",
  tax: "Tax note",
  shipping: "Delivery note",
  publicId: "Cloudinary asset ID",
  alt: "Image description / alt text",
};
function nice(key: string) {
  return (
    labels[key] ||
    key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())
  );
}
async function api(url: string, method = "GET", body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw Error(data.error || "Something went wrong");
  return data;
}
export function Login({ preview }: { preview: boolean }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="admin-login">
      <span className="eyebrow">SIGNATURE CALENDAR / OWNER STUDIO</span>
      <h1>
        {preview ? "Your studio, in preview." : "Welcome to your studio."}
      </h1>
      <p>
        {preview
          ? "Explore the dashboard and edit the local website. Firebase authentication and Cloudinary uploads are not connected yet."
          : "Sign in with your authorized administrator account."}
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            let idToken = "";
            if (!preview) {
              const data = new FormData(e.currentTarget);
              const app =
                getApps()[0] ||
                initializeApp({
                  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                });
              const auth = getAuth(app);
              await setPersistence(auth, inMemoryPersistence);
              const cred = await signInWithEmailAndPassword(
                auth,
                String(data.get("email")),
                String(data.get("password")),
              );
              idToken = await cred.user.getIdToken();
              await signOut(auth);
            }
            await api("/api/session", "POST", { idToken });
            location.reload();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {!preview && (
          <>
            <label>
              Email
              <input
                required
                type="email"
                name="email"
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                name="password"
                autoComplete="current-password"
              />
            </label>
          </>
        )}
        <button className="button" disabled={busy}>
          {busy
            ? "Opening…"
            : preview
              ? "Enter local preview studio →"
              : "Sign in →"}
        </button>
        <p role="alert" className="error">
          {error}
        </p>
      </form>
      <Link href="/">← Back to the website</Link>
    </main>
  );
}
function Fields({
  value,
  onChange,
  options = {},
  omit = [],
}: {
  value: Record<string, any>;
  onChange: (v: any) => void;
  options?: Record<string, string[]>;
  omit?: string[];
}) {
  return (
    <div className="admin-fields">
      {Object.entries(value)
        .filter(
          ([k, v]) =>
            !omit.includes(k) && !Array.isArray(v) && typeof v !== "object",
        )
        .map(([key, v]) =>
          typeof v === "boolean" ? (
            <label className="checkbox" key={key}>
              <input
                type="checkbox"
                checked={v}
                onChange={(e) =>
                  onChange({ ...value, [key]: e.target.checked })
                }
              />
              {nice(key)}
            </label>
          ) : (
            <label
              key={key}
              className={
                [
                  "description",
                  "body",
                  "approach",
                  "services",
                  "qualityText",
                  "message",
                  "notes",
                ].includes(key)
                  ? "wide"
                  : ""
              }
            >
              {nice(key)}
              {options[key] ? (
                <select
                  value={v}
                  onChange={(e) =>
                    onChange({ ...value, [key]: e.target.value })
                  }
                >
                  <option value="">Choose…</option>
                  {options[key].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              ) : typeof v === "number" ? (
                <input
                  type="number"
                  value={v}
                  onChange={(e) =>
                    onChange({ ...value, [key]: Number(e.target.value) })
                  }
                />
              ) : [
                  "description",
                  "body",
                  "approach",
                  "services",
                  "qualityText",
                  "message",
                  "notes",
                  "answer",
                ].includes(key) ? (
                <textarea
                  value={v}
                  onChange={(e) =>
                    onChange({ ...value, [key]: e.target.value })
                  }
                />
              ) : (
                <input
                  value={v}
                  onChange={(e) =>
                    onChange({ ...value, [key]: e.target.value })
                  }
                />
              )}
            </label>
          ),
        )}
    </div>
  );
}
const sections = [
  "Overview",
  "Designs & collections",
  "Products",
  "Pricing",
  "Homepage",
  "About & services",
  "FAQs",
  "Business details",
  "Media library",
  "Inquiries",
  "Website & SEO",
];
export function Dashboard({
  initial,
  preview,
  initialPublishedCount,
}: {
  initial: Content;
  preview: boolean;
  initialPublishedCount: number;
}) {
  const [c, setC] = useState(initial),
    [publishedCount, setPublishedCount] = useState(initialPublishedCount),
    [section, setSection] = useState("Overview"),
    [index, setIndex] = useState(0),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [list, setList] = useState<Inquiry[]>([]),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All"),
    [progress, setProgress] = useState<number | null>(null),
    [modal, setModal] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    api("/api/inquiries")
      .then(setList)
      .catch((e) => setMessage(e.message));
  }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);
  function change(next: Content) {
    setC(next);
    setDirty(true);
    setMessage("Unsaved changes");
  }
  function update(key: keyof Content, v: any) {
    change({ ...c, [key]: v });
  }
  function editArray(
    key: "designs" | "products" | "pricing" | "faqs" | "seo" | "media",
    i: number,
    v: any,
  ) {
    const a = [...c[key]];
    a[i] = v;
    update(key, a);
  }
  function remove(
    key: "designs" | "products" | "pricing" | "faqs" | "media",
    i: number,
  ) {
    if (
      key === "products" &&
      (c.designs.some((d) => d.productId === c.products[i].id) ||
        c.pricing.some((p) => p.productIds.includes(c.products[i].id)))
    ) {
      setMessage(
        "This product is used by a design or pricing schedule. Remove those assignments first.",
      );
      return;
    }
    if (
      confirm(
        `Remove this ${key === "media" ? "media reference" : "record"}? Save and publish to apply the change. Cloudinary files are preserved.`,
      )
    ) {
      update(
        key,
        c[key].filter((_, n) => n !== i),
      );
      setIndex(0);
    }
  }
  async function save(publish = false) {
    setBusy(true);
    setMessage("Saving…");
    try {
      await api("/api/content", "PUT", { content: c, publish });
      if (publish)
        setPublishedCount(c.designs.filter((d) => d.published).length);
      setDirty(false);
      setMessage(
        publish
          ? "Published. The public website now shows these changes."
          : "Draft saved. Public content has not changed.",
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function add(key: "designs" | "products" | "pricing" | "faqs") {
    const id = crypto.randomUUID().slice(0, 8);
    const values = {
      designs: {
        id: `design-${id}`,
        name: "New design",
        code: `SC-${id}`,
        description: "",
        format: "Horizontal",
        dimensions: "",
        category: c.categories[0] || "",
        collection: c.collections[0] || "",
        cover: "/art/botanical.svg",
        gallery: [],
        pdf: "",
        published: false,
        featured: false,
        order: c.designs.length + 1,
        productId: c.products[0]?.id || "",
      },
      products: {
        id: `product-${id}`,
        name: "New product",
        format: "Horizontal",
        dimensions: "",
        paper: "",
        pages: "",
        binding: "",
        stand: "",
        branding: "",
        packaging: "",
        moq: 0,
        description: "",
      },
      pricing: {
        id: `pricing-${id}`,
        name: "New pricing schedule",
        productIds: [],
        tiers: [{ min: 100, price: 239 }],
        packaging: "Customized packaging is available at an additional cost.",
        tax: "Taxes: awaiting confirmation.",
        shipping: "Delivery: awaiting confirmation.",
      },
      faqs: {
        id: `faq-${id}`,
        question: "New question",
        answer: "",
        published: false,
      },
    };
    update(key, [...c[key], values[key]]);
    setIndex(c[key].length);
  }
  function upload(file: File) {
    if (
      file.size > 10000000 ||
      !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
        file.type,
      )
    ) {
      setMessage("Choose a JPEG, PNG, WebP or PDF smaller than 10 MB.");
      return;
    }
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/media");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      try {
        const m = JSON.parse(xhr.responseText);
        if (xhr.status !== 200) throw Error(m.error);
        setC((previous) => ({ ...previous, media: [...previous.media, m] }));
        setDirty(true);
        setMessage("Uploaded. Save your draft to keep the media reference.");
      } catch (e) {
        setMessage((e as Error).message);
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setMessage("Upload failed. Check your connection and try again.");
    };
    const form = new FormData();
    form.set("file", file);
    xhr.send(form);
  }
  function exportCSV() {
    const rows = [
      [
        "Name",
        "Company",
        "Phone",
        "Email",
        "Design",
        "Quantity",
        "Message",
        "Status",
        "Notes",
        "Submitted",
      ],
      ...list
        .filter(
          (i) =>
            (filter === "All" || i.status === filter) &&
            JSON.stringify(i).toLowerCase().includes(query.toLowerCase()),
        )
        .map((i) => [
          i.name,
          i.company,
          i.phone,
          i.email,
          i.design,
          i.quantity ?? "",
          i.message,
          i.status,
          i.notes,
          i.createdAt,
        ]),
    ];
    const csv = rows
      .map((r) =>
        r
          .map(
            (x) =>
              `"${String(x)
                .replace(/^[=+@-]/, "'$&")
                .replaceAll('"', '""')}"`,
          )
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "signature-calendar-inquiries.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  const key = (
    {
      "Designs & collections": "designs",
      Products: "products",
      Pricing: "pricing",
      FAQs: "faqs",
      "Website & SEO": "seo",
    } as const
  )[
    section as
      | "Products"
      | "Designs & collections"
      | "Pricing"
      | "FAQs"
      | "Website & SEO"
  ];
  const records = key ? (c[key] as any[]) : [];
  const record = records[index];
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <h2>
          Signature <em>studio.</em>
        </h2>
        {sections.map((s) => (
          <button
            key={s}
            className={section === s ? "active" : ""}
            onClick={() => {
              setSection(s);
              setIndex(0);
            }}
          >
            {s}
          </button>
        ))}
        <Link href="/" target="_blank">
          Visit website ↗
        </Link>
        <button
          onClick={async () => {
            if (dirty && !confirm("You have unsaved changes. Sign out anyway?"))
              return;
            await api("/api/session", "DELETE");
            location.reload();
          }}
        >
          Sign out
        </button>
      </aside>
      <main className="admin-main">
        <div className="admin-top">
          <div>
            <span className="eyebrow">YOUR OWNER DASHBOARD</span>
            <h1>{section}</h1>
          </div>
          <div className="admin-actions">
            <button className="button outline" onClick={() => setModal(true)}>
              Preview draft
            </button>
            <button
              className="button outline"
              disabled={busy}
              onClick={() => save()}
            >
              Save draft
            </button>
            <button
              className="button"
              disabled={busy}
              onClick={() => save(true)}
            >
              Publish changes ↗
            </button>
          </div>
        </div>
        {preview && (
          <div className="notice">
            LOCAL DEVELOPMENT PREVIEW · Changes and inquiries are saved on this
            computer. Live Firebase login and Cloudinary uploads require account
            configuration.
          </div>
        )}
        <div role="status" className="admin-note">
          {message ||
            "Draft loaded. Changes appear publicly only after publishing."}
        </div>
        {section === "Overview" && (
          <>
            <div className="admin-stats">
              <div className="stat">
                <strong>{c.designs.length}</strong>Total draft designs
              </div>
              <div className="stat">
                <strong>{publishedCount}</strong>
                Published designs
              </div>
              <div className="stat">
                <strong>{list.length}</strong>Customer inquiries
              </div>
            </div>
            <div className="admin-panel">
              <h3>Make this space your own.</h3>
              <p>
                Edit your business details, add your calendar designs, and set
                the pricing that applies to each product. Save a draft while you
                work, then publish when everything is ready.
              </p>
              <button
                className="button"
                onClick={() => setSection("Business details")}
              >
                Edit business details →
              </button>
            </div>
          </>
        )}
        {key && (
          <>
            <div className="admin-list">
              <div className="record-list">
                {records.map((r, i) => (
                  <button
                    key={i}
                    className={i === index ? "active" : ""}
                    onClick={() => setIndex(i)}
                  >
                    {r.name || r.question || r.page}
                    <small>
                      {r.code || r.id || r.title}
                      {r.published === false ? " · Draft" : ""}
                    </small>
                  </button>
                ))}
                {key !== "seo" && (
                  <button onClick={() => add(key as "designs")}>
                    + Add{" "}
                    {key === "faqs"
                      ? "question"
                      : key === "pricing"
                        ? "pricing schedule"
                        : key.slice(0, -1)}
                  </button>
                )}
              </div>
              {record ? (
                <div className="admin-panel record-editor">
                  <Fields
                    value={record}
                    onChange={(v) => editArray(key, index, v)}
                    options={
                      key === "designs"
                        ? {
                            format: ["Horizontal", "Vertical"],
                            category: c.categories,
                            collection: c.collections,
                            productId: c.products.map((p) => p.id),
                          }
                        : {}
                    }
                  />
                  {key === "designs" && (
                    <>
                      <h3 style={{ marginTop: 30 }}>Gallery & catalogue</h3>
                      <p className="fine">
                        Choose assets from the media library. Label artwork and
                        mockups separately. Use the arrows to change their
                        order.
                      </p>
                      <label>
                        Choose cover from media
                        <select
                          value={record.cover}
                          onChange={(e) =>
                            editArray("designs", index, {
                              ...record,
                              cover: e.target.value,
                            })
                          }
                        >
                          <option value={record.cover}>Current cover</option>
                          {c.media
                            .filter((m) => m.kind !== "PDF")
                            .map((m) => (
                              <option key={m.id} value={m.url}>
                                {m.label}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label>
                        Attach media
                        <select
                          value=""
                          onChange={(e) => {
                            const m = c.media.find(
                              (m) => m.id === e.target.value,
                            );
                            if (m)
                              editArray(
                                "designs",
                                index,
                                m.kind === "PDF"
                                  ? { ...record, pdf: m.url }
                                  : {
                                      ...record,
                                      gallery: [
                                        ...record.gallery,
                                        { ...m, id: crypto.randomUUID() },
                                      ],
                                    },
                              );
                          }}
                        >
                          <option value="">Choose an uploaded asset…</option>
                          {c.media.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label} ({m.kind})
                            </option>
                          ))}
                        </select>
                      </label>
                      {record.gallery.map((m: Media, i: number) => (
                        <div className="admin-panel" key={m.id}>
                          <Fields
                            value={m}
                            omit={["id", "publicId"]}
                            options={{ kind: ["Artwork", "Mockup"] }}
                            onChange={(v) => {
                              const gallery = [...record.gallery];
                              gallery[i] = v;
                              editArray("designs", index, {
                                ...record,
                                gallery,
                              });
                            }}
                          />
                          <div className="record-actions">
                            <button
                              disabled={!i}
                              onClick={() => {
                                const gallery = [...record.gallery];
                                [gallery[i - 1], gallery[i]] = [
                                  gallery[i],
                                  gallery[i - 1],
                                ];
                                editArray("designs", index, {
                                  ...record,
                                  gallery,
                                });
                              }}
                            >
                              ↑ Move up
                            </button>
                            <button
                              disabled={i === record.gallery.length - 1}
                              onClick={() => {
                                const gallery = [...record.gallery];
                                [gallery[i + 1], gallery[i]] = [
                                  gallery[i],
                                  gallery[i + 1],
                                ];
                                editArray("designs", index, {
                                  ...record,
                                  gallery,
                                });
                              }}
                            >
                              ↓ Move down
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    "Remove this gallery image reference?",
                                  )
                                )
                                  editArray("designs", index, {
                                    ...record,
                                    gallery: record.gallery.filter(
                                      (_: Media, n: number) => n !== i,
                                    ),
                                  });
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {key === "pricing" && (
                    <>
                      <h3 style={{ marginTop: 25 }}>Assigned products</h3>
                      {c.products.map((p) => (
                        <label key={p.id} className="checkbox">
                          <input
                            type="checkbox"
                            checked={record.productIds.includes(p.id)}
                            onChange={(e) =>
                              editArray("pricing", index, {
                                ...record,
                                productIds: e.target.checked
                                  ? [...record.productIds, p.id]
                                  : record.productIds.filter(
                                      (id: string) => id !== p.id,
                                    ),
                              })
                            }
                          />
                          {p.name}
                        </label>
                      ))}
                      <h3 style={{ marginTop: 25 }}>Quantity tiers</h3>
                      {record.tiers.map(
                        (t: { min: number; price: number }, i: number) => (
                          <div key={i} className="inline-row">
                            <label>
                              Minimum quantity
                              <input
                                type="number"
                                min="1"
                                value={t.min}
                                onChange={(e) => {
                                  const tiers = [...record.tiers];
                                  tiers[i] = {
                                    ...t,
                                    min: Number(e.target.value),
                                  };
                                  editArray("pricing", index, {
                                    ...record,
                                    tiers,
                                  });
                                }}
                              />
                            </label>
                            <label>
                              Unit price (₹)
                              <input
                                type="number"
                                min="1"
                                value={t.price}
                                onChange={(e) => {
                                  const tiers = [...record.tiers];
                                  tiers[i] = {
                                    ...t,
                                    price: Number(e.target.value),
                                  };
                                  editArray("pricing", index, {
                                    ...record,
                                    tiers,
                                  });
                                }}
                              />
                            </label>
                            <button
                              aria-label="Remove tier"
                              onClick={() =>
                                editArray("pricing", index, {
                                  ...record,
                                  tiers: record.tiers.filter(
                                    (_: unknown, n: number) => n !== i,
                                  ),
                                })
                              }
                            >
                              ×
                            </button>
                          </div>
                        ),
                      )}
                      <button
                        onClick={() =>
                          editArray("pricing", index, {
                            ...record,
                            tiers: [
                              ...record.tiers,
                              {
                                min:
                                  Math.max(
                                    ...record.tiers.map(
                                      (t: { min: number }) => t.min,
                                    ),
                                    0,
                                  ) + 100,
                                price: 189,
                              },
                            ],
                          })
                        }
                      >
                        + Add tier
                      </button>
                    </>
                  )}
                  {key !== "seo" && (
                    <div className="record-actions">
                      <button
                        className="danger"
                        onClick={() => remove(key as "designs", index)}
                      >
                        Delete record
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty">No records yet. Add your first one.</div>
              )}
            </div>
            {key === "designs" && (
              <div className="admin-panel">
                <h3>Categories & collections</h3>
                <div className="admin-fields">
                  <label>
                    Categories (one per line)
                    <textarea
                      value={c.categories.join("\n")}
                      onChange={(e) =>
                        update("categories", e.target.value.split("\n"))
                      }
                    />
                  </label>
                  <label>
                    Collections (one per line)
                    <textarea
                      value={c.collections.join("\n")}
                      onChange={(e) =>
                        update("collections", e.target.value.split("\n"))
                      }
                    />
                  </label>
                </div>
              </div>
            )}
          </>
        )}
        {section === "Homepage" && (
          <div className="admin-panel">
            <Fields value={c.home} onChange={(v) => update("home", v)} />
          </div>
        )}
        {section === "Business details" && (
          <div className="admin-panel">
            <Fields
              value={c.business}
              onChange={(v) => update("business", v)}
            />
          </div>
        )}
        {section === "About & services" && (
          <div className="admin-panel">
            <Fields value={c.about} onChange={(v) => update("about", v)} />
          </div>
        )}
        {section === "Media library" && (
          <>
            <div className="upload-box">
              <label>
                Upload calendar images or catalogue PDFs (up to 10 MB)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  disabled={progress !== null}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {progress !== null && (
                <>
                  <progress max={100} value={progress} />
                  <p className="fine">
                    {progress === 100
                      ? "Processing asset…"
                      : `Uploading ${progress}%`}
                  </p>
                </>
              )}
              <p className="fine">
                Uploads require Cloudinary configuration. Removing a reference
                preserves the source asset, so shared images remain safe.
              </p>
            </div>
            <div className="media-grid">
              {c.media.map((m, i) => (
                <div key={m.id} className="media-item">
                  {m.kind === "PDF" ? (
                    <a className="button outline" href={m.url} target="_blank">
                      Open PDF ↗
                    </a>
                  ) : (
                    <img src={m.url} alt={m.alt} />
                  )}
                  <Fields
                    value={m}
                    omit={["id", "publicId"]}
                    options={{ kind: ["Artwork", "Mockup", "PDF"] }}
                    onChange={(v) => editArray("media", i, v)}
                  />
                  <button
                    className="danger"
                    onClick={() => {
                      const inUse =
                        c.designs.some(
                          (d) =>
                            d.cover === m.url ||
                            d.pdf === m.url ||
                            d.gallery.some((g) => g.url === m.url),
                        ) ||
                        c.home.heroImage === m.url ||
                        c.business.logo === m.url;
                      if (inUse)
                        setMessage(
                          "This asset is still used by a design or page. Remove its assignments before removing it from the library.",
                        );
                      else remove("media", i);
                    }}
                  >
                    Remove reference
                  </button>
                </div>
              ))}
            </div>
            {!c.media.length && (
              <div className="empty">
                Your uploaded assets will appear here.
              </div>
            )}
          </>
        )}
        {section === "Inquiries" && (
          <>
            <div className="inline-row">
              <label>
                Search
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name, design, contact details…"
                />
              </label>
              <label>
                Status
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {[
                    "All",
                    "New",
                    "Contacted",
                    "Quoted",
                    "Confirmed",
                    "Closed",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <button className="button outline" onClick={exportCSV}>
                Export CSV
              </button>
            </div>
            <p className="fine">
              Showing up to 2,000 recent inquiries. Private notes are visible
              only in the owner dashboard.
            </p>
            <div className="inquiry-list">
              {list
                .filter(
                  (i) =>
                    (filter === "All" || i.status === filter) &&
                    JSON.stringify(i)
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                )
                .map((i) => (
                  <article className="inquiry-card" key={i.id}>
                    <header>
                      <h3>{i.name}</h3>
                      <small>{new Date(i.createdAt).toLocaleString()}</small>
                    </header>
                    <p>
                      {i.company} {i.design && `· ${i.design}`}{" "}
                      {i.quantity && `· ${i.quantity} calendars`}
                    </p>
                    <p>{i.message}</p>
                    <div className="links">
                      {i.phone && (
                        <>
                          <a href={`tel:${i.phone}`}>Call {i.phone}</a>
                          <a
                            href={whatsapp(
                              i.phone,
                              i.design,
                              i.quantity || undefined,
                            )}
                            target="_blank"
                          >
                            WhatsApp ↗
                          </a>
                        </>
                      )}
                      {i.email && <a href={`mailto:${i.email}`}>Email ↗</a>}
                    </div>
                    <div className="admin-fields">
                      <label>
                        Status
                        <select
                          value={i.status}
                          onChange={(e) =>
                            setList(
                              list.map((v) =>
                                v.id === i.id
                                  ? { ...v, status: e.target.value }
                                  : v,
                              ),
                            )
                          }
                        >
                          {[
                            "New",
                            "Contacted",
                            "Quoted",
                            "Confirmed",
                            "Closed",
                          ].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Private follow-up notes
                        <textarea
                          value={i.notes}
                          onChange={(e) =>
                            setList(
                              list.map((v) =>
                                v.id === i.id
                                  ? { ...v, notes: e.target.value }
                                  : v,
                              ),
                            )
                          }
                        />
                      </label>
                    </div>
                    <button
                      className="button outline"
                      onClick={async () => {
                        try {
                          await api("/api/inquiries", "PATCH", {
                            id: i.id,
                            status: i.status,
                            notes: i.notes,
                          });
                          setMessage("Inquiry updated.");
                        } catch (e) {
                          setMessage((e as Error).message);
                        }
                      }}
                    >
                      Save inquiry
                    </button>
                  </article>
                ))}
            </div>
            {!list.length && (
              <div className="empty">
                No inquiries yet. New website inquiries will appear here.
              </div>
            )}
          </>
        )}
        <dialog
          ref={dialog}
          className="admin-preview"
          onCancel={() => setModal(false)}
        >
          <button
            className="light-close"
            aria-label="Close draft preview"
            onClick={() => setModal(false)}
          >
            ✕
          </button>
          <span className="eyebrow">PRIVATE DRAFT PREVIEW</span>
          <h2>{c.home.title}</h2>
          <p>{c.home.description}</p>
          <p>
            {c.business.name} · {c.business.phone}
          </p>
          <div className="design-grid">
            {c.designs.map((d) => (
              <div key={d.id}>
                <span className="pill">
                  {d.published ? "Ready to publish" : "Private draft"}
                </span>
                <CalendarScene
                  src={d.cover}
                  variant={d.format === "Vertical" ? "vertical" : ""}
                />
                <h3>{d.name}</h3>
                <p>{d.description}</p>
                <small>
                  {d.code} · {d.dimensions}
                </small>
                {d.pdf && (
                  <a href={d.pdf} target="_blank">
                    Open PDF ↗
                  </a>
                )}
              </div>
            ))}
          </div>
          <h2>Pricing preview</h2>
          {c.pricing.map((p) => (
            <div key={p.id}>
              <h3>{p.name}</h3>
              <p>Assigned to {p.productIds.join(", ") || "no products"}</p>
              {p.tiers.map((t) => (
                <p key={t.min}>
                  {t.min}+ calendars: ₹{t.price} each
                </p>
              ))}
              <p>
                {p.tax} {p.shipping} {p.packaging}
              </p>
            </div>
          ))}
          <h2>{c.about.title}</h2>
          <p>{c.about.body}</p>
        </dialog>
      </main>
    </div>
  );
}
