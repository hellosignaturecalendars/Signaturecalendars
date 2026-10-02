"use client";
import { useRef, useState } from "react";
import type { Content, Design, Media } from "@/lib/model";
import { Fields, UploadButton, slugify } from "./fields";
import { SelectField } from "./select-field";

/**
 * LocalImage holds a client-only blob URL for a file the user has chosen
 * before Cloudinary is connected. It is never persisted to the draft JSON —
 * it is only used for visual preview inside this editor session.
 */
type LocalImages = {
  cover?: string;       // blob URL
  gallery: string[];   // blob URLs indexed by gallery position
  pdf?: string;         // file name only (PDFs can't be previewed locally)
};

function validate(d: Design): string[] {
  const errs: string[] = [];
  if (!d.name.trim()) errs.push("Design name is required.");
  if (!d.code.trim()) errs.push("Design code is required.");
  if (d.id && !/^[a-z0-9-]+$/.test(d.id))
    errs.push("URL slug can only contain lowercase letters, numbers and hyphens.");
  return errs;
}

export function DesignEditor({
  content: c,
  index,
  onChange,
  onUpload,
  onSave,
  onPreview,
  onDelete,
  busy,
  newDesign,
  cloudinaryConnected,
}: {
  content: Content;
  index: number;
  onChange: (d: Design) => void;
  onUpload: (
    files: File[],
    target: "cover" | "gallery" | "pdf" | `gallery:${number}`,
  ) => void;
  onSave: (action: "draft" | "publish" | "unpublish") => Promise<boolean>;
  onPreview: () => void;
  onDelete: () => void;
  busy: boolean;
  newDesign: boolean;
  cloudinaryConnected: boolean;
}) {
  const d = c.designs[index];
  const [manualSlug, setManualSlug] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  // Local-only image previews (blob URLs) — never saved to draft JSON
  const [local, setLocal] = useState<LocalImages>({ gallery: [] });
  const localRefs = useRef<LocalImages>({ gallery: [] });

  if (!d) return null;

  function gallery(i: number, next: Media) {
    onChange({ ...d, gallery: d.gallery.map((m, n) => (n === i ? next : m)) });
  }

  function move(i: number, step: number) {
    const a = [...d.gallery];
    [a[i], a[i + step]] = [a[i + step], a[i]];
    // Also reorder local gallery previews to match
    const la = [...local.gallery];
    [la[i], la[i + step]] = [la[i + step], la[i]];
    setLocal((prev) => ({ ...prev, gallery: la }));
    onChange({ ...d, gallery: a });
  }

  /** Handle file selection when Cloudinary is not connected. */
  function handleLocalFile(files: File[], target: "cover" | "gallery" | "pdf" | `gallery:${number}`) {
    if (!files.length) return;
    const file = files[0];

    if (target === "pdf") {
      // For PDFs we can't show a preview but we can record the filename
      setLocal((prev) => ({ ...prev, pdf: file.name }));
      localRefs.current.pdf = file.name;
      return;
    }

    if (!file.type.startsWith("image/")) return;
    const blobUrl = URL.createObjectURL(file);

    if (target === "cover") {
      // Revoke previous blob if any
      if (localRefs.current.cover) URL.revokeObjectURL(localRefs.current.cover);
      localRefs.current.cover = blobUrl;
      setLocal((prev) => ({ ...prev, cover: blobUrl }));
      return;
    }

    if (target === "gallery") {
      const updated = [...localRefs.current.gallery, blobUrl];
      localRefs.current.gallery = updated;
      setLocal((prev) => ({ ...prev, gallery: updated }));
      // Also add a placeholder entry to the design's gallery so the slot exists
      const newEntry: Media = {
        id: crypto.randomUUID(),
        url: "", // Empty until Cloudinary uploads
        alt: file.name,
        label: file.name,
        kind: "Artwork",
        publicId: "",
      };
      onChange({ ...d, gallery: [...d.gallery, newEntry] });
      return;
    }

    if (target.startsWith("gallery:")) {
      const i = Number(target.split(":")[1]);
      const updated = [...localRefs.current.gallery];
      if (updated[i]) URL.revokeObjectURL(updated[i]);
      updated[i] = blobUrl;
      localRefs.current.gallery = updated;
      setLocal((prev) => ({ ...prev, gallery: updated }));
    }
  }

  function handleUpload(files: File[], target: "cover" | "gallery" | "pdf" | `gallery:${number}`) {
    if (cloudinaryConnected) {
      onUpload(files, target);
    } else {
      handleLocalFile(files, target);
    }
  }

  async function handleSave(action: "draft" | "publish" | "unpublish") {
    const errs = validate(d);
    if (errs.length) {
      setValidationErrors(errs);
      return;
    }
    setValidationErrors([]);
    await onSave(action);
  }

  // Effective display URL: prefer the persisted URL, fall back to local blob
  const coverDisplay = d.cover || local.cover || "";
  const galleryDisplay = d.gallery.map((m, i) => ({
    ...m,
    displayUrl: m.url || local.gallery[i] || "",
  }));

  return (
    <div className="design-editor">
      <div className="workflow">
        <span>1. Add details</span>
        <span>2. Upload files</span>
        <span>3. Preview &amp; publish</span>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="notice" role="alert" style={{ borderColor: "var(--error)", background: "#fdf0ef" }}>
          {validationErrors.map((e) => (
            <p key={e} className="error" style={{ margin: "4px 0" }}>{e}</p>
          ))}
        </div>
      )}

      {/* Cloudinary not connected notice */}
      {!cloudinaryConnected && (
        <div className="notice">
          <strong>Uploads are in local preview mode.</strong> Images you select
          are shown here only and are not saved permanently until Cloudinary is
          connected. Design details (name, format, collection, etc.) save
          normally.
        </div>
      )}

      <div className="admin-panel">
        <div className="panel-heading">
          <h2>Design details</h2>
          <span className="pill">{d.published ? "Published" : "Draft"}</span>
        </div>
        <div className="admin-fields">
          <label>
            Design name <span style={{ color: "var(--error)" }}>*</span>
            <input
              value={d.name}
              placeholder="e.g. Botanical studies"
              onChange={(e) => {
                const name = e.target.value;
                let id = d.id;
                if (newDesign && !manualSlug) {
                  const base = slugify(name);
                  id = c.designs.some((x, n) => n !== index && x.id === base)
                    ? `${base}-${d.code
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, "")
                        .slice(-6)}`
                    : base || `design-${d.code.toLowerCase().replace(/[^a-z0-9]/g, "").slice(-8)}`;
                }
                onChange({ ...d, name, id });
                if (name.trim()) setValidationErrors((prev) => prev.filter((e) => !e.includes("name")));
              }}
            />
          </label>
          <label>
            Design code <span style={{ color: "var(--error)" }}>*</span>
            <input
              value={d.code}
              placeholder="e.g. SC-001"
              onChange={(e) => {
                onChange({ ...d, code: e.target.value });
                if (e.target.value.trim()) setValidationErrors((prev) => prev.filter((e) => !e.includes("code")));
              }}
            />
          </label>
        </div>
        <Fields
          value={d}
          onChange={onChange}
          only={["format", "category", "collection", "description", "featured"]}
          options={{
            format: ["Horizontal", "Vertical"],
            category: c.categories.filter(Boolean),
            collection: c.collections.filter(Boolean),
          }}
        />
        <label className="status-field">
          Status
          <SelectField
            value={d.published ? "Published" : "Draft"}
            onChange={(val) =>
              onChange({ ...d, published: val === "Published" })
            }
            options={["Draft", "Published"]}
          />
        </label>
        <p className="fine">
          Status changes take effect when you publish. Saving a draft does not
          change the public website.
        </p>
      </div>

      {/* Cover image */}
      <div className="admin-panel">
        <h2>Cover image</h2>
        {!cloudinaryConnected && (
          <p className="fine">
            Cloudinary is not connected. Select an image to preview it here — it
            will not be saved until Cloudinary is set up.
          </p>
        )}
        {coverDisplay ? (
          <div className="cover-preview">
            <img src={coverDisplay} alt={`${d.name || "Design"} cover preview`} />
            {local.cover && !d.cover && (
              <p className="fine" style={{ marginTop: 8 }}>
                Local preview only — not saved. Connect Cloudinary to upload.
              </p>
            )}
          </div>
        ) : (
          <div className="empty">Upload the image customers will see first.</div>
        )}
        <div className="record-actions">
          <UploadButton
            label={coverDisplay ? "Replace Cover Image" : "Upload Cover Image"}
            disabled={busy}
            onFiles={(f) => handleUpload(f, "cover")}
          />
          {(d.cover || local.cover) && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() => {
                if (confirm("Remove this cover? The original asset will be kept.")) {
                  if (localRefs.current.cover) {
                    URL.revokeObjectURL(localRefs.current.cover);
                    localRefs.current.cover = undefined;
                  }
                  setLocal((prev) => ({ ...prev, cover: undefined }));
                  onChange({ ...d, cover: "" });
                }
              }}
            >
              Remove cover
            </button>
          )}
        </div>
      </div>

      {/* Gallery images */}
      <div className="admin-panel">
        <h2>Additional images</h2>
        <p className="fine">
          Add monthly artwork or product photographs, then use the arrows to
          arrange them.
        </p>
        <UploadButton
          label="Add Gallery Images"
          multiple
          disabled={busy}
          onFiles={(f) => handleUpload(f, "gallery")}
        />
        <div className="editor-gallery">
          {galleryDisplay.map((m, i) => (
            <article className="editor-image" key={m.id}>
              {m.displayUrl ? (
                <img src={m.displayUrl} alt={m.alt || m.label} />
              ) : (
                <div className="empty-image" style={{ height: 120, marginBottom: 12 }}>
                  No image saved yet
                </div>
              )}
              {!m.url && local.gallery[i] && (
                <p className="fine" style={{ fontSize: 13, marginBottom: 8 }}>
                  Local preview — not saved permanently.
                </p>
              )}
              <Fields
                value={m}
                onChange={(v) => gallery(i, v as Media)}
                only={["label", "alt", "kind"]}
                options={{ kind: ["Artwork", "Mockup"] }}
              />
              <div className="record-actions">
                <button
                  className="icon-button"
                  aria-label={`Move image ${i + 1} up`}
                  disabled={busy || i === 0}
                  onClick={() => move(i, -1)}
                >
                  ↑
                </button>
                <button
                  className="icon-button"
                  aria-label={`Move image ${i + 1} down`}
                  disabled={busy || i === d.gallery.length - 1}
                  onClick={() => move(i, 1)}
                >
                  ↓
                </button>
                {m.url && (
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => onChange({ ...d, cover: m.url })}
                  >
                    Use as cover
                  </button>
                )}
              </div>
              {m.url && (
                <UploadButton
                  label="Replace Image"
                  disabled={busy}
                  onFiles={(f) => handleUpload(f, `gallery:${i}`)}
                />
              )}
              <button
                className="text-button danger-text"
                disabled={busy}
                onClick={() => {
                  if (confirm("Remove this image? The original asset will be kept.")) {
                    // Clean up local blob if any
                    if (local.gallery[i]) URL.revokeObjectURL(local.gallery[i]);
                    const updated = [...localRefs.current.gallery];
                    updated.splice(i, 1);
                    localRefs.current.gallery = updated;
                    setLocal((prev) => {
                      const g = [...prev.gallery];
                      g.splice(i, 1);
                      return { ...prev, gallery: g };
                    });
                    onChange({ ...d, gallery: d.gallery.filter((_, n) => n !== i) });
                  }
                }}
              >
                Remove image
              </button>
            </article>
          ))}
        </div>
        {!d.gallery.length && <p className="fine">No gallery images added yet.</p>}
      </div>

      {/* PDF */}
      <div className="admin-panel">
        <h2>
          Catalogue PDF <span className="muted">optional</span>
        </h2>
        {!cloudinaryConnected && (
          <p className="fine">
            PDF uploads require Cloudinary. Once connected, upload your PDF
            catalogue here.
          </p>
        )}
        {cloudinaryConnected && (
          <UploadButton
            label="Upload PDF"
            kind="pdf"
            disabled={busy}
            onFiles={(f) => onUpload(f, "pdf")}
          />
        )}
        {local.pdf && !d.pdf && (
          <p className="fine" style={{ marginTop: 8 }}>
            Selected: <strong>{local.pdf}</strong> — connect Cloudinary to
            upload this PDF.
          </p>
        )}
        {d.pdf ? (
          <div className="record-actions">
            <a
              className="button outline"
              href={d.pdf}
              target="_blank"
              rel="noreferrer"
            >
              View PDF ↗
            </a>
            <button
              className="text-button danger-text"
              disabled={busy}
              onClick={() => {
                if (confirm("Remove this PDF reference? The original document will be kept."))
                  onChange({ ...d, pdf: "" });
              }}
            >
              Remove PDF
            </button>
          </div>
        ) : (
          !local.pdf && (
            <p className="fine">
              Customers will see PDF actions only when a document is attached.
            </p>
          )
        )}
      </div>

      {/* Advanced */}
      <details className="admin-panel advanced">
        <summary>Advanced settings</summary>
        <label>
          URL slug
          <input
            value={d.id}
            onChange={(e) => {
              setManualSlug(true);
              onChange({ ...d, id: e.target.value });
            }}
          />
        </label>
        <p className="fine">
          Generated from the name for a new design. Changing an existing URL can
          break shared links.
        </p>
        <Fields
          value={d}
          onChange={onChange}
          only={["dimensions", "order", "productId"]}
          options={{ productId: c.products.map((p) => p.id) }}
        />
        {c.media.filter((m) => m.kind !== "PDF").length > 0 && (
          <label>
            Choose an existing image from the media library
            <SelectField
              value=""
              onChange={(val) => {
                const m = c.media.find((m) => m.id === val || m.label === val);
                if (m) onChange({ ...d, cover: m.url });
              }}
              options={c.media
                .filter((m) => m.kind !== "PDF")
                .map((m) => m.label)}
              placeholder="Select a cover…"
            />
          </label>
        )}
        <Fields value={d} onChange={onChange} only={["cover", "pdf"]} />
        <button className="danger" disabled={busy} onClick={onDelete}>
          Delete design
        </button>
      </details>

      {/* Save bar */}
      <div className="editor-savebar">
        <button className="button outline" disabled={busy} onClick={onPreview}>
          Preview design
        </button>
        <button
          className="button outline"
          disabled={busy}
          onClick={() => handleSave("draft")}
        >
          Save draft
        </button>
        <button
          className="button"
          disabled={busy}
          onClick={() => handleSave("publish")}
        >
          Publish design
        </button>
        {!newDesign && d.published && (
          <button
            className="text-button"
            disabled={busy}
            onClick={() => handleSave("unpublish")}
          >
            Unpublish design
          </button>
        )}
      </div>
    </div>
  );
}
