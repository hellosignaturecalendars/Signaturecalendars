"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Images,
  IndianRupee,
  Inbox,
  Settings as SettingsIcon,
  ExternalLink,
  LogOut,
  Plus,
  ArrowRight,
  X,
} from "lucide-react";
import type { Content, Design, Inquiry } from "@/lib/model";
import { contentSchema, whatsapp } from "@/lib/model";
import { Fields, UploadButton, api, uploadMedia } from "./admin/fields";
import { DesignEditor } from "./admin/design-editor";
import { PricingEditor } from "./admin/pricing-editor";
import { Settings } from "./admin/settings";
import { SelectField } from "./admin/select-field";

type Section =
  | "Overview"
  | "Designs"
  | "Pricing"
  | "Inquiries"
  | "Website Settings";

const sections: [Section, typeof Inbox][] = [
  ["Overview", LayoutDashboard],
  ["Designs", Images],
  ["Pricing", IndianRupee],
  ["Inquiries", Inbox],
  ["Website Settings", SettingsIcon],
];

type UploadTarget =
  | "cover"
  | "gallery"
  | "pdf"
  | "logo"
  | "hero"
  | "library"
  | `gallery:${number}`;

/** Blank new-design form state */
type NewDesignForm = { name: string; code: string; format: "Horizontal" | "Vertical" };

export function Dashboard({
  initial,
  preview,
  initialPublishedCount,
  connections,
}: {
  initial: Content;
  preview: boolean;
  initialPublishedCount: number;
  connections: { firebaseConfigured: boolean; cloudinaryConfigured: boolean };
}) {
  const [c, setC] = useState<Content>(() => {
    // On load, clean up any blank designs left from previous sessions
    return {
      ...initial,
      designs: initial.designs.filter(
        (d) => d.name.trim() || !d.id.startsWith("new-calendar-"),
      ),
    };
  });
  const [section, setSection] = useState<Section>("Overview");
  const [tab, setTab] = useState("Designs");
  const [index, setIndex] = useState<number | null>(null);
  const [priceIndex, setPriceIndex] = useState(0);
  const [publishedCount, setPublishedCount] = useState(initialPublishedCount);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [list, setList] = useState<Inquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [previewDesign, setPreviewDesign] = useState<Design | null>(null);
  const [savingInquiry, setSavingInquiry] = useState("");
  // "Add Design" inline form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<NewDesignForm>({
    name: "",
    code: "",
    format: "Horizontal",
  });
  const [addFormError, setAddFormError] = useState("");

  const newIds = useRef(new Set<string>());
  const dialog = useRef<HTMLDialogElement>(null);
  const inquiryDirty = useRef(new Set<string>());

  useEffect(() => {
    setReady(true);
    loadInquiries();
  }, []);

  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => {
      if (dirty || inquiryDirty.current.size || busy) e.preventDefault();
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [dirty, busy]);

  useEffect(() => {
    if (previewDesign) dialog.current?.showModal();
    else dialog.current?.close();
  }, [previewDesign]);

  async function loadInquiries() {
    setLoadingInquiries(true);
    try {
      setList(await api("/api/inquiries"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingInquiries(false);
    }
  }

  function change(next: Content) {
    setC(next);
    setDirty(true);
    setMessage("");
    setError("");
  }

  function editDesign(d: Design) {
    if (index === null) return;
    if (newIds.current.has(c.designs[index].id)) {
      newIds.current.delete(c.designs[index].id);
      newIds.current.add(d.id);
    }
    change({ ...c, designs: c.designs.map((v, n) => (n === index ? d : v)) });
  }

  async function save(
    next = c,
    publish = false,
    designId?: string,
  ): Promise<boolean> {
    setBusy(true);
    setError("");
    setMessage("Saving…");
    try {
      const validation = contentSchema.safeParse(next);
      if (!validation.success)
        throw Error(
          validation.error.issues.map((i) => i.message).join(". "),
        );
      const result = await api("/api/content", "PUT", {
        content: next,
        publish,
        designId,
      });
      setC(next);
      setDirty(false);
      if (publish) setPublishedCount(result.publishedCount);
      setMessage(
        publish
          ? "Published. Your website is up to date."
          : "Draft saved. Your public website has not changed.",
      );
      return true;
    } catch (e) {
      setMessage("");
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  /** Open the "Add Design" inline form (don't create the design yet). */
  function openAddForm() {
    setAddForm({
      name: "",
      code: `SC-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      format: "Horizontal",
    });
    setAddFormError("");
    setShowAddForm(true);
  }

  /** Create the design only when the user submits the form with a valid name. */
  async function confirmAddDesign() {
    const name = addForm.name.trim();
    const code = addForm.code.trim();
    if (!name) { setAddFormError("Design name is required."); return; }
    if (!code) { setAddFormError("Design code is required."); return; }
    if (c.designs.some((d) => d.code.toLowerCase() === code.toLowerCase())) {
      setAddFormError("A design with this code already exists. Choose a different code.");
      return;
    }

    const { slugify } = await import("./admin/fields");
    const base = slugify(name);
    const id = c.designs.some((d) => d.id === base)
      ? `${base}-${code.toLowerCase().replace(/[^a-z0-9]/g, "").slice(-6)}`
      : base || `design-${code.toLowerCase().replace(/[^a-z0-9]/g, "").slice(-8)}`;

    const d: Design = {
      id,
      name,
      code,
      description: "",
      format: addForm.format,
      dimensions: "",
      category: c.categories.filter(Boolean)[0] || "",
      collection: c.collections.filter(Boolean)[0] || "",
      cover: "",
      gallery: [],
      pdf: "",
      published: false,
      featured: false,
      order: c.designs.length + 1,
      productId: c.products[0]?.id || "",
    };

    newIds.current.add(id);
    const next = { ...c, designs: [...c.designs, d] };
    change(next);

    // Auto-save the new design to draft immediately
    setShowAddForm(false);
    setBusy(true);
    setError("");
    setMessage("Creating design…");
    try {
      const validation = contentSchema.safeParse(next);
      if (!validation.success)
        throw Error(validation.error.issues.map((i) => i.message).join(". "));
      await api("/api/content", "PUT", { content: next, publish: false });
      setDirty(false);
      setMessage("Design created and saved to draft.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }

    setSection("Designs");
    setTab("Designs");
    setIndex(next.designs.length - 1);
  }

  async function designSave(
    action: "draft" | "publish" | "unpublish",
  ): Promise<boolean> {
    if (index === null) return false;
    const d = c.designs[index];
    const next =
      action === "draft"
        ? c
        : {
            ...c,
            designs: c.designs.map((v, n) =>
              n === index
                ? { ...v, published: action === "publish" }
                : v,
            ),
          };
    return save(next, action !== "draft", d.id);
  }

  async function upload(files: File[], target: UploadTarget) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    let next = structuredClone(c);
    const designIndex = index;
    let succeeded = 0;
    const warnings: string[] = [];
    const localUrl = files[0]?.type.startsWith("image/")
      ? URL.createObjectURL(files[0])
      : "";
    setUploadPreview(localUrl);
    try {
      if (
        target === "gallery" &&
        designIndex !== null &&
        next.designs[designIndex].gallery.length + files.length > 30
      )
        throw Error("A design can have up to 30 gallery images.");
      for (const file of files) {
        setProgress(0);
        const result = await uploadMedia(
          file,
          target === "pdf" ? "pdf" : target === "library" ? "any" : "image",
          setProgress,
        );
        const { warning, ...asset } = result;
        if (warning) warnings.push(warning);
        next.media.push(asset);
        if (target === "logo") next.business.logo = asset.url;
        else if (target === "hero") next.home.heroImage = asset.url;
        else if (target !== "library" && designIndex !== null) {
          const d = next.designs[designIndex];
          if (target === "cover") d.cover = asset.url;
          else if (target === "pdf") d.pdf = asset.url;
          else if (target.startsWith("gallery:"))
            d.gallery[Number(target.split(":")[1])] = asset;
          else d.gallery.push(asset);
        }
        succeeded++;
        setC(structuredClone(next));
        setDirty(true);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (succeeded) {
        try {
          await api("/api/content", "PUT", { content: next, publish: false });
          setDirty(false);
          setMessage(
            `${succeeded} file${succeeded === 1 ? "" : "s"} uploaded and saved to the draft.${warnings.length ? " " + warnings.join(" ") : ""}`,
          );
        } catch (e) {
          setDirty(true);
          setError(
            `Files uploaded, but the draft could not be saved. Keep this page open and retry Save draft. ${(e as Error).message}`,
          );
        }
      }
      setProgress(null);
      setBusy(false);
      if (localUrl) URL.revokeObjectURL(localUrl);
      setUploadPreview("");
    }
  }

  async function removeDesign() {
    if (index === null) return;
    const designName = c.designs[index].name || "this design";
    if (
      confirm(
        `Delete "${designName}" from the draft? This will be saved immediately. Publish changes to remove it from the public website.`,
      )
    ) {
      const next = { ...c, designs: c.designs.filter((_, n) => n !== index) };
      setIndex(null);
      // Auto-save the deletion
      setBusy(true);
      setError("");
      setMessage("Deleting design…");
      try {
        const validation = contentSchema.safeParse(next);
        if (!validation.success)
          throw Error(validation.error.issues.map((i) => i.message).join(". "));
        await api("/api/content", "PUT", { content: next, publish: false });
        setC(next);
        setDirty(false);
        setMessage(`"${designName}" deleted from draft. Publish to remove it publicly.`);
      } catch (e) {
        // Revert the index removal if save failed
        setError((e as Error).message);
        setIndex(index);
      } finally {
        setBusy(false);
      }
    }
  }

  function removeMedia(i: number) {
    const m = c.media[i];
    const used =
      c.designs.some(
        (d) =>
          d.cover === m.url ||
          d.pdf === m.url ||
          d.gallery.some((g) => g.url === m.url),
      ) ||
      c.home.heroImage === m.url ||
      c.business.logo === m.url;
    if (used) {
      setError(
        "This file is used by a design or page. Remove its assignments first.",
      );
      return;
    }
    if (
      confirm(
        "Remove this library reference? The Cloudinary file will be preserved.",
      )
    )
      change({ ...c, media: c.media.filter((_, n) => n !== i) });
  }

  const visibleInquiries = list.filter(
    (i) =>
      (filter === "All" || i.status === filter) &&
      `${i.name} ${i.company} ${i.phone} ${i.email} ${i.design} ${i.message} ${i.notes}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  function exportCsv() {
    const safe = (v: unknown) => {
      let s = String(v ?? "");
      if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
      return `"${s.replaceAll('"', '""')}"`;
    };
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
        "Private notes",
        "Submitted",
      ],
      ...visibleInquiries.map((i) => [
        i.name,
        i.company,
        i.phone,
        i.email,
        i.design,
        i.quantity,
        i.message,
        i.status,
        i.notes,
        i.createdAt,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\uFEFF" + rows.map((r) => r.map(safe).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "signature-calendar-inquiries.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link href="/admin" className="studio-brand">
          Signature <em>studio.</em>
          <small>YOUR BUSINESS, SIMPLIFIED</small>
        </Link>
        <nav aria-label="Dashboard sections">
          {sections.map(([s, Icon]) => (
            <button
              key={s}
              disabled={busy || !ready}
              className={section === s ? "active" : ""}
              aria-current={section === s ? "page" : undefined}
              onClick={() => {
                setSection(s);
                setError("");
                setMessage("");
              }}
            >
              <Icon size={20} />
              {s}
            </button>
          ))}
        </nav>
        <div className="account-area">
          <Link href="/" target="_blank">
            <ExternalLink size={18} />
            View Website
          </Link>
          <button
            disabled={busy || !ready}
            onClick={async () => {
              if (
                (dirty || inquiryDirty.current.size) &&
                !confirm("There are unsaved changes. Logout anyway?")
              )
                return;
              try {
                await api("/api/session", "DELETE");
                location.assign("/admin/login");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-top">
          <div>
            <span className="eyebrow">SIGNATURE CALENDAR</span>
            <h1>{section}</h1>
            <p>
              {section === "Overview"
                ? "A clear view of your business."
                : section === "Designs"
                  ? "Add details → upload files → preview → publish."
                  : section === "Pricing"
                    ? "Simple prices, clear quantities."
                    : section === "Inquiries"
                      ? "Keep every customer conversation in one place."
                      : "Your business details and website content, together."}
            </p>
          </div>
          {section !== "Overview" &&
            section !== "Inquiries" &&
            !(section === "Designs" && tab === "Designs" && index !== null) && (
              <div className="admin-actions">
                <button
                  className="button outline"
                  disabled={busy || !ready}
                  onClick={() => save()}
                >
                  Save draft
                </button>
                <button
                  className="button"
                  disabled={busy || !ready}
                  onClick={() => save(c, true)}
                >
                  Publish changes
                </button>
              </div>
            )}
        </header>

        {preview && (
          <div className="notice">
            Local development preview · Content and inquiries are saved on this
            computer. Live Firebase authentication is not connected.
          </div>
        )}

        <div className="save-feedback" aria-live="polite">
          {message && (
            <p className="success" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {!message && !error && dirty && (
            <p className="fine">You have unsaved changes.</p>
          )}
        </div>

        {progress !== null && (
          <div className="upload-progress">
            {uploadPreview && (
              <img src={uploadPreview} alt="Selected image upload preview" />
            )}
            <div>
              <strong>
                {progress === 100
                  ? "Processing and saving…"
                  : `Uploading ${progress}%`}
              </strong>
              <progress value={progress} max={100} />
            </div>
          </div>
        )}

        <fieldset className="studio-workspace" disabled={busy || !ready}>
          {/* ── OVERVIEW ── */}
          {section === "Overview" && (
            <>
              <div className="admin-stats">
                <div className="stat">
                  <strong>{c.designs.length}</strong>Total designs
                </div>
                <div className="stat">
                  <strong>{publishedCount}</strong>Published designs
                </div>
                <div className="stat">
                  <strong>{loadingInquiries ? "…" : list.length}</strong>
                  Recent inquiries
                </div>
              </div>
              <div className="quick-actions">
                <button
                  onClick={() => {
                    setSection("Designs");
                    setTab("Designs");
                    setIndex(null);
                    openAddForm();
                  }}
                >
                  <Plus />
                  <strong>Add Design</strong>
                  <span>Upload a calendar and make it yours.</span>
                  <ArrowRight />
                </button>
                <button onClick={() => setSection("Pricing")}>
                  <IndianRupee />
                  <strong>Update Pricing</strong>
                  <span>Adjust quantity tiers and packaging.</span>
                  <ArrowRight />
                </button>
                <button onClick={() => setSection("Inquiries")}>
                  <Inbox />
                  <strong>View Inquiries</strong>
                  <span>Read messages and follow up.</span>
                  <ArrowRight />
                </button>
              </div>
              <div className="admin-panel">
                <h2>Ready for your next update?</h2>
                <p>
                  Drafts let you work privately. Preview a design, then publish
                  when it is ready for your customers.
                </p>
                <button
                  className="button outline"
                  onClick={() => setSection("Website Settings")}
                >
                  Edit business details
                </button>
              </div>
              <details className="admin-panel advanced">
                <summary>Connection status</summary>
                <p>
                  Firebase:{" "}
                  {connections.firebaseConfigured
                    ? "server settings present; use login and save tests to verify"
                    : "not configured for live use"}
                </p>
                <p>
                  Cloudinary:{" "}
                  {connections.cloudinaryConfigured
                    ? "settings present; upload a file to verify"
                    : "not configured — add server credentials to enable uploads"}
                </p>
                <p className="fine">
                  An account connection is only confirmed after a successful
                  request. No existing remote files are deleted by this
                  dashboard.
                </p>
              </details>
            </>
          )}

          {/* ── DESIGNS ── */}
          {section === "Designs" && (
            <>
              <div className="admin-tabs">
                {["Designs", "Collections", "Media library"].map((t) => (
                  <button
                    key={t}
                    disabled={busy || !ready}
                    aria-pressed={tab === t}
                    className={tab === t ? "active" : ""}
                    onClick={() => {
                      setTab(t);
                      setIndex(null);
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {tab === "Designs" && (
                <>
                  {index === null ? (
                    <>
                      {/* "Add Design" inline form */}
                      {showAddForm ? (
                        <div className="admin-panel" style={{ marginBottom: 24 }}>
                          <h2>New design</h2>
                          <p className="fine">
                            Give this design a name and code before continuing.
                            You can change these later.
                          </p>
                          {addFormError && (
                            <p className="error" role="alert" style={{ marginBottom: 12 }}>
                              {addFormError}
                            </p>
                          )}
                          <div className="admin-fields">
                            <label>
                              Design name{" "}
                              <span style={{ color: "var(--error)" }}>*</span>
                              <input
                                autoFocus
                                value={addForm.name}
                                placeholder="e.g. Botanical studies"
                                onChange={(e) => {
                                  setAddForm((f) => ({ ...f, name: e.target.value }));
                                  if (e.target.value.trim()) setAddFormError("");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") confirmAddDesign();
                                  if (e.key === "Escape") setShowAddForm(false);
                                }}
                              />
                            </label>
                            <label>
                              Design code{" "}
                              <span style={{ color: "var(--error)" }}>*</span>
                              <input
                                value={addForm.code}
                                placeholder="e.g. SC-004"
                                onChange={(e) => {
                                  setAddForm((f) => ({ ...f, code: e.target.value }));
                                  if (e.target.value.trim()) setAddFormError("");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") confirmAddDesign();
                                  if (e.key === "Escape") setShowAddForm(false);
                                }}
                              />
                            </label>
                            <label>
                              Format
                              <SelectField
                                value={addForm.format}
                                onChange={(val) =>
                                  setAddForm((f) => ({
                                    ...f,
                                    format: val as "Horizontal" | "Vertical",
                                  }))
                                }
                                options={["Horizontal", "Vertical"]}
                              />
                            </label>
                          </div>
                          <div className="record-actions" style={{ marginTop: 16 }}>
                            <button
                              className="button"
                              disabled={busy}
                              onClick={confirmAddDesign}
                            >
                              {busy ? "Creating…" : "Create design"}
                            </button>
                            <button
                              className="button outline"
                              disabled={busy}
                              onClick={() => setShowAddForm(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="list-heading">
                          <h2>Your calendars</h2>
                          <button className="button" onClick={openAddForm}>
                            + Add Design
                          </button>
                        </div>
                      )}

                      <div className="admin-design-grid">
                        {c.designs.map((d, i) => (
                          <button
                            className="design-tile"
                            key={d.id}
                            onClick={() => {
                              setIndex(i);
                              setShowAddForm(false);
                            }}
                          >
                            {d.cover ? (
                              <img src={d.cover} alt={d.name || "Design cover"} />
                            ) : (
                              <div className="empty-image">Add a cover image</div>
                            )}
                            <span className="pill">
                              {d.published ? "Published" : "Draft"}
                            </span>
                            <strong>{d.name || "Untitled calendar"}</strong>
                            <small>
                              {d.code} · {d.format}
                            </small>
                            <span>Edit design →</span>
                          </button>
                        ))}
                      </div>
                      {!c.designs.length && (
                        <div className="empty">
                          No designs yet. Add your first calendar to get started.
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        className="text-button"
                        disabled={busy || !ready}
                        onClick={() => setIndex(null)}
                      >
                        ← All designs
                      </button>
                      <DesignEditor
                        key={`${index}-${c.designs[index]?.id}`}
                        content={c}
                        index={index}
                        onChange={editDesign}
                        onUpload={upload}
                        onSave={designSave}
                        onPreview={() => setPreviewDesign(c.designs[index])}
                        onDelete={removeDesign}
                        busy={busy}
                        newDesign={newIds.current.has(c.designs[index]?.id)}
                        cloudinaryConnected={connections.cloudinaryConfigured}
                      />
                    </>
                  )}
                </>
              )}

              {tab === "Collections" && (
                <div className="admin-panel">
                  <h2>Collections &amp; categories</h2>
                  <p>
                    Use one name per line. Existing design assignments stay
                    unchanged when you edit this list.
                  </p>
                  <div className="admin-fields">
                    <label>
                      Collections
                      <textarea
                        rows={6}
                        value={c.collections.join("\n")}
                        onChange={(e) =>
                          change({
                            ...c,
                            collections: e.target.value.split("\n"),
                          })
                        }
                      />
                    </label>
                    <label>
                      Categories
                      <textarea
                        rows={6}
                        value={c.categories.join("\n")}
                        onChange={(e) =>
                          change({
                            ...c,
                            categories: e.target.value.split("\n"),
                          })
                        }
                      />
                    </label>
                  </div>
                  <p className="fine">
                    After saving these lists, they appear as options in the
                    Format and Collection dropdowns when editing a design.
                  </p>
                </div>
              )}

              {tab === "Media library" && (
                <>
                  <div className="admin-panel">
                    <h2>Your uploaded files</h2>
                    {connections.cloudinaryConfigured ? (
                      <UploadButton
                        label="Upload Images or PDF"
                        kind="any"
                        multiple
                        disabled={busy || !ready}
                        onFiles={(f) => upload(f, "library")}
                      />
                    ) : (
                      <p className="fine">
                        Cloudinary is not connected. Connect it to upload files
                        to the library.
                      </p>
                    )}
                    <p className="fine" style={{ marginTop: 8 }}>
                      JPG, PNG, WebP and PDF · maximum 10 MB per file.
                    </p>
                  </div>
                  <div className="media-grid">
                    {c.media.map((m, i) => (
                      <div className="media-item" key={m.id}>
                        {m.kind === "PDF" ? (
                          <a
                            className="button outline"
                            href={m.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View PDF ↗
                          </a>
                        ) : (
                          <img src={m.url} alt={m.alt} />
                        )}
                        <Fields
                          value={m}
                          onChange={(v) =>
                            change({
                              ...c,
                              media: c.media.map((x, n) => (n === i ? v : x)),
                            })
                          }
                          only={["label", "alt", "kind"]}
                          options={{ kind: ["Artwork", "Mockup", "PDF"] }}
                        />
                        <button
                          className="text-button danger-text"
                          disabled={busy || !ready}
                          onClick={() => removeMedia(i)}
                        >
                          Remove reference
                        </button>
                      </div>
                    ))}
                  </div>
                  {!c.media.length && (
                    <div className="empty">
                      Uploaded images and PDFs will appear here.
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── PRICING ── */}
          {section === "Pricing" && (
            <>
              <div className="list-heading">
                <label>
                  Pricing schedule
                  <SelectField
                    value={c.pricing[priceIndex]?.name ?? ""}
                    onChange={(val) => {
                      const i = c.pricing.findIndex((p) => p.name === val);
                      if (i >= 0) setPriceIndex(i);
                    }}
                    options={c.pricing.map((p) => p.name)}
                  />
                </label>
                <button
                  className="button outline"
                  onClick={() => {
                    change({
                      ...c,
                      pricing: [
                        ...c.pricing,
                        {
                          id: crypto.randomUUID(),
                          name: "New pricing schedule",
                          productIds: [],
                          tiers: [{ min: 100, price: 1 }],
                          packaging:
                            "Customized packaging is available at an additional cost.",
                          tax: "Taxes: awaiting confirmation.",
                          shipping: "Delivery: awaiting confirmation.",
                        },
                      ],
                    });
                    setPriceIndex(c.pricing.length);
                  }}
                >
                  + Add pricing schedule
                </button>
              </div>
              {c.pricing[priceIndex] ? (
                <>
                  <PricingEditor
                    price={c.pricing[priceIndex]}
                    products={c.products}
                    onChange={(p) =>
                      change({
                        ...c,
                        pricing: c.pricing.map((v, n) =>
                          n === priceIndex ? p : v,
                        ),
                      })
                    }
                  />
                  <details className="admin-panel advanced">
                    <summary>Advanced settings</summary>
                    <button
                      className="danger"
                      onClick={() => {
                        if (
                          confirm(
                            "Remove this pricing schedule from the draft? Saved public prices stay until you publish.",
                          )
                        ) {
                          change({
                            ...c,
                            pricing: c.pricing.filter(
                              (_, n) => n !== priceIndex,
                            ),
                          });
                          setPriceIndex(0);
                        }
                      }}
                    >
                      Remove pricing schedule
                    </button>
                  </details>
                </>
              ) : (
                <div className="empty">
                  Add a pricing schedule and assign it to a product.
                </div>
              )}
              <details className="admin-panel advanced">
                <summary>Products &amp; specifications</summary>
                <p>Manage the products linked to designs and pricing.</p>
                {c.products.map((p, i) => (
                  <details className="seo-panel" key={p.id}>
                    <summary>{p.name}</summary>
                    <Fields
                      value={p}
                      omit={["id"]}
                      onChange={(v) =>
                        change({
                          ...c,
                          products: c.products.map((x, n) =>
                            n === i ? v : x,
                          ),
                        })
                      }
                    />
                    <button
                      className="danger"
                      onClick={() => {
                        if (
                          c.designs.some((d) => d.productId === p.id) ||
                          c.pricing.some((s) => s.productIds.includes(p.id))
                        ) {
                          setError(
                            "This product is assigned to a design or price schedule. Remove those assignments first.",
                          );
                          return;
                        }
                        if (confirm("Remove this product from the draft?"))
                          change({
                            ...c,
                            products: c.products.filter((_, n) => n !== i),
                          });
                      }}
                    >
                      Remove product
                    </button>
                  </details>
                ))}
                <button
                  className="button outline"
                  onClick={() =>
                    change({
                      ...c,
                      products: [
                        ...c.products,
                        {
                          id: crypto.randomUUID(),
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
                      ],
                    })
                  }
                >
                  + Add product
                </button>
              </details>
            </>
          )}

          {/* ── WEBSITE SETTINGS ── */}
          {section === "Website Settings" && (
            <Settings
              content={c}
              onChange={change}
              onUpload={upload}
              busy={busy}
            />
          )}

          {/* ── INQUIRIES ── */}
          {section === "Inquiries" && (
            <>
              <div className="inquiry-toolbar">
                <label>
                  Search inquiries
                  <input
                    value={query}
                    placeholder="Name, contact or design…"
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <label>
                  Status
                  <SelectField
                    value={filter}
                    onChange={(val) => setFilter(val)}
                    options={["All", "New", "Contacted", "Quoted", "Confirmed", "Closed"]}
                  />
                </label>
                <button className="button outline" onClick={exportCsv}>
                  Export CSV
                </button>
                <button
                  className="text-button"
                  disabled={loadingInquiries}
                  onClick={() => {
                    if (
                      inquiryDirty.current.size &&
                      !confirm("Discard unsaved inquiry notes and refresh?")
                    )
                      return;
                    inquiryDirty.current.clear();
                    loadInquiries();
                  }}
                >
                  Refresh
                </button>
              </div>
              {loadingInquiries ? (
                <div className="empty" role="status">
                  Loading inquiries…
                </div>
              ) : (
                <>
                  <p className="fine">
                    {visibleInquiries.length} result
                    {visibleInquiries.length !== 1 ? "s" : ""} · up to 2,000
                    most recent inquiries. Follow-up notes are private.
                  </p>
                  <div className="inquiry-list">
                    {visibleInquiries.map((i) => (
                      <article className="inquiry-card" key={i.id}>
                        <header>
                          <h2>{i.name}</h2>
                          <time>{new Date(i.createdAt).toLocaleString()}</time>
                        </header>
                        <p>
                          {i.company}
                          {i.design && ` · ${i.design}`}
                          {i.quantity != null && ` · ${i.quantity} calendars`}
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
                                rel="noreferrer"
                              >
                                WhatsApp ↗
                              </a>
                            </>
                          )}
                          {i.email && (
                            <a href={`mailto:${i.email}`}>Email {i.email}</a>
                          )}
                        </div>
                        <div className="admin-fields">
                          <label>
                            Status
                            <SelectField
                              value={i.status}
                              onChange={(val) => {
                                inquiryDirty.current.add(i.id);
                                setList(
                                  list.map((v) =>
                                    v.id === i.id
                                      ? { ...v, status: val }
                                      : v,
                                  ),
                                );
                              }}
                              options={["New", "Contacted", "Quoted", "Confirmed", "Closed"]}
                            />
                          </label>
                          <label>
                            Private follow-up notes
                            <textarea
                              value={i.notes}
                              onChange={(e) => {
                                inquiryDirty.current.add(i.id);
                                setList(
                                  list.map((v) =>
                                    v.id === i.id
                                      ? { ...v, notes: e.target.value }
                                      : v,
                                  ),
                                );
                              }}
                            />
                          </label>
                        </div>
                        <button
                          className="button outline"
                          disabled={savingInquiry === i.id}
                          onClick={async () => {
                            setSavingInquiry(i.id);
                            setError("");
                            try {
                              await api("/api/inquiries", "PATCH", {
                                id: i.id,
                                status: i.status,
                                notes: i.notes,
                              });
                              setMessage("Inquiry updated.");
                              inquiryDirty.current.delete(i.id);
                            } catch (e) {
                              setError((e as Error).message);
                            } finally {
                              setSavingInquiry("");
                            }
                          }}
                        >
                          {savingInquiry === i.id ? "Saving…" : "Save inquiry"}
                        </button>
                      </article>
                    ))}
                  </div>
                  {!visibleInquiries.length && (
                    <div className="empty">
                      {list.length
                        ? "No inquiries match your search."
                        : "No inquiries yet. Customer messages will appear here."}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </fieldset>

        {/* Design preview dialog */}
        <dialog
          ref={dialog}
          className="admin-preview"
          onCancel={() => setPreviewDesign(null)}
        >
          <button
            className="light-close icon-button"
            onClick={() => setPreviewDesign(null)}
            aria-label="Close design preview"
          >
            <X />
          </button>
          {previewDesign && (
            <>
              <span className="eyebrow">PRIVATE DESIGN PREVIEW</span>
              <h2>{previewDesign.name || "Untitled calendar"}</h2>
              <p>
                {previewDesign.code} · {previewDesign.format} ·{" "}
                {previewDesign.published ? "Ready to publish" : "Draft"}
              </p>
              {previewDesign.cover && (
                <img
                  className="draft-cover"
                  src={previewDesign.cover}
                  alt={previewDesign.name}
                />
              )}
              <p>{previewDesign.description}</p>
              <div className="preview-images">
                {previewDesign.gallery
                  .filter((m) => m.url)
                  .map((m) => (
                    <figure key={m.id}>
                      <img src={m.url} alt={m.alt} />
                      <figcaption>
                        {m.label} · {m.kind}
                      </figcaption>
                    </figure>
                  ))}
              </div>
              {previewDesign.pdf && (
                <a
                  className="button outline"
                  href={previewDesign.pdf}
                  target="_blank"
                  rel="noreferrer"
                >
                  View PDF ↗
                </a>
              )}
              <p className="fine">
                This preview is private. Use Publish design to make it visible
                to customers.
              </p>
            </>
          )}
        </dialog>
      </main>
    </div>
  );
}
