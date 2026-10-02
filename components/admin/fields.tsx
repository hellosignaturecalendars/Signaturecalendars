"use client";
import { useId } from "react";
import { Upload } from "lucide-react";
import type { Media } from "@/lib/model";
import { validateFile } from "@/lib/media";
import { SelectField } from "./select-field";
const labels: Record<string, string> = {
  name: "Name",
  id: "URL slug",
  code: "Design code",
  description: "Short description",
  moq: "Minimum quantity (0 = confirm with quote)",
  phone: "Phone",
  email: "Email address",
  featured: "Featured on homepage",
  whatsapp: "WhatsApp number",
  address: "Address or service area",
  hours: "Business hours",
  other: "Other social URL",
  primaryHref: "Main button destination",
  secondaryHref: "Contact button destination",
  primaryLabel: "Main button label",
  secondaryLabel: "Contact button label",
  heroImage: "Hero image URL",
  paper: "Paper GSM and finish",
  pages: "Page configuration",
  branding: "Branding options",
  order: "Display order",
  productId: "Product",
  alt: "Image description (alt text)",
  packaging: "Packaging note",
  tax: "Tax note",
  shipping: "Delivery note",
  publicId: "Cloudinary asset ID",
};
export function Fields<T extends object>({
  value,
  onChange,
  only,
  omit = [],
  options = {},
}: {
  value: T;
  onChange: (v: T) => void;
  only?: string[];
  omit?: string[];
  options?: Record<string, string[]>;
}) {
  return (
    <div className="admin-fields">
      {Object.entries(value)
        .filter(
          ([k, v]) =>
            (!only || only.includes(k)) &&
            !omit.includes(k) &&
            !Array.isArray(v) &&
            typeof v !== "object",
        )
        .map(([k, v]) => {
          const label =
            labels[k] ||
            k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
          const set = (n: unknown) => onChange({ ...value, [k]: n });
          return typeof v === "boolean" ? (
            <label className="checkbox" key={k}>
              <input
                type="checkbox"
                checked={v}
                onChange={(e) => set(e.target.checked)}
              />
              {label}
            </label>
          ) : (
            <label key={k}>
              {label}
              {options[k] ? (
                <SelectField
                  value={String(v ?? "")}
                  onChange={(val) => set(val)}
                  options={[...new Set([...options[k], ...(v ? [String(v)] : [])])].filter(Boolean)}
                  placeholder="Choose…"
                />
              ) : typeof v === "number" ? (
                <input
                  type="number"
                  value={v}
                  onChange={(e) => set(Number(e.target.value))}
                />
              ) : [
                  "description",
                  "body",
                  "answer",
                  "approach",
                  "services",
                  "qualityText",
                  "title",
                ].includes(k) ? (
                <textarea
                  rows={3}
                  value={v ?? ""}
                  onChange={(e) => set(e.target.value)}
                />
              ) : (
                <input
                  type={k === "email" ? "email" : "text"}
                  value={v ?? ""}
                  onChange={(e) => set(e.target.value)}
                />
              )}
            </label>
          );
        })}
    </div>
  );
}
export function UploadButton({
  label,
  kind = "image",
  multiple = false,
  disabled = false,
  onFiles,
}: {
  label: string;
  kind?: "image" | "pdf" | "any";
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}) {
  const id = useId();
  return (
    <div className="upload-control">
      <input
        id={id}
        type="file"
        accept={
          kind === "pdf"
            ? ".pdf,application/pdf"
            : kind === "any"
              ? ".jpg,.jpeg,.png,.webp,.pdf"
              : "image/jpeg,image/png,image/webp"
        }
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
      <label
        className={`button outline ${disabled ? "disabled" : ""}`}
        htmlFor={id}
      >
        <Upload size={18} />
        {label}
      </label>
    </div>
  );
}
export async function uploadMedia(
  file: File,
  kind: "image" | "pdf" | "any",
  progress: (n: number) => void,
): Promise<Media & { warning?: string }> {
  validateFile(file, kind);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/media");
    xhr.timeout = 120000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) progress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () =>
      reject(Error("Upload failed. Check your connection and try again."));
    xhr.ontimeout = () => reject(Error("Upload timed out. Please try again."));
    xhr.onload = () => {
      try {
        const r = JSON.parse(xhr.responseText);
        if (xhr.status !== 200) throw Error(r.error || "Upload failed");
        resolve(r);
      } catch (e) {
        reject(e);
      }
    };
    const data = new FormData();
    data.set("file", file);
    xhr.send(data);
  });
}
export async function api(url: string, method = "GET", body?: unknown) {
  const r = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "Request failed. Try again.");
  return data;
}
export function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70) || "calendar"
  );
}
