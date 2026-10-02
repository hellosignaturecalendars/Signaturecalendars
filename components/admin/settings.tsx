"use client";
import { useState } from "react";
import type { Content } from "@/lib/model";
import { Fields, UploadButton } from "./fields";
export function Settings({
  content: c,
  onChange,
  onUpload,
  busy,
}: {
  content: Content;
  onChange: (c: Content) => void;
  onUpload: (files: File[], target: "logo" | "hero") => void;
  busy: boolean;
}) {
  const [tab, setTab] = useState("Business details");
  const tabs = ["Business details", "Homepage", "About", "FAQs"];
  const update = (key: keyof Content, value: unknown) =>
    onChange({ ...c, [key]: value });
  const missing = [
    !c.business.email ? "email" : "",
    !c.business.instagram ? "Instagram" : "",
    !c.business.linkedin ? "LinkedIn" : "",
    !c.business.facebook ? "Facebook" : "",
  ].filter(Boolean);
  return (
    <>
      <div className="admin-tabs" aria-label="Website settings">
        {tabs.map((t) => (
          <button
            key={t}
            aria-pressed={tab === t}
            className={t === tab ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Business details" && (
        <>
          <div className="admin-panel">
            <h2>Business & contact details</h2>
            <p>
              These details appear on the Contact page and in the footer. Leave
              optional fields blank to hide them.
            </p>
            {missing.length > 0 && (
              <div className="notice">
                Not configured: {missing.join(", ")}. Add these when available;
                missing links stay hidden from customers.
              </div>
            )}
            <Fields
              value={c.business}
              onChange={(v) => update("business", v)}
              only={["name", "phone", "whatsapp", "email", "address", "hours"]}
            />
          </div>
          <div className="admin-panel">
            <h2>Social links</h2>
            <Fields
              value={c.business}
              onChange={(v) => update("business", v)}
              only={["instagram", "linkedin", "facebook", "other"]}
            />
            {(c.business.socialLinks || []).map((social, i) => (
              <div className="inline-row" key={i}>
                <label>
                  Link label
                  <input
                    value={social.label}
                    onChange={(e) =>
                      update("business", {
                        ...c.business,
                        socialLinks: c.business.socialLinks!.map((s, n) =>
                          n === i ? { ...s, label: e.target.value } : s,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  HTTPS URL
                  <input
                    value={social.url}
                    onChange={(e) =>
                      update("business", {
                        ...c.business,
                        socialLinks: c.business.socialLinks!.map((s, n) =>
                          n === i ? { ...s, url: e.target.value } : s,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  className="icon-button"
                  aria-label={`Remove social link ${i + 1}`}
                  onClick={() => {
                    if (confirm("Remove this social link from the draft?"))
                      update("business", {
                        ...c.business,
                        socialLinks: c.business.socialLinks!.filter(
                          (_, n) => n !== i,
                        ),
                      });
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              className="button outline"
              onClick={() =>
                update("business", {
                  ...c.business,
                  socialLinks: [
                    ...(c.business.socialLinks || []),
                    { label: "", url: "" },
                  ],
                })
              }
            >
              + Add social link
            </button>
          </div>
          <details className="admin-panel advanced">
            <summary>Advanced settings</summary>
            <h3>Branding & footer</h3>
            {c.business.logo && (
              <img
                className="logo-preview"
                src={c.business.logo}
                alt="Current business logo"
              />
            )}
            <UploadButton
              label="Upload Logo"
              disabled={busy}
              onFiles={(f) => onUpload(f, "logo")}
            />
            <Fields
              value={c.business}
              onChange={(v) => update("business", v)}
              only={["logo", "tagline", "footer"]}
            />
          </details>
        </>
      )}
      {tab === "Homepage" && (
        <>
          <div className="admin-panel">
            <h2>Homepage introduction</h2>
            <Fields
              value={c.home}
              onChange={(v) => update("home", v)}
              only={[
                "eyebrow",
                "title",
                "description",
                "primaryLabel",
                "secondaryLabel",
              ]}
            />
            <UploadButton
              label="Upload Homepage Image"
              disabled={busy}
              onFiles={(f) => onUpload(f, "hero")}
            />
            {c.home.heroImage && (
              <img
                className="settings-image"
                src={c.home.heroImage}
                alt="Homepage image preview"
              />
            )}
          </div>
          <div className="admin-panel">
            <h2>Homepage sections</h2>
            <Fields
              value={c.home}
              onChange={(v) => update("home", v)}
              only={[
                "showCollections",
                "showProducts",
                "showProcess",
                "showQuality",
                "showPricing",
              ]}
            />
          </div>
          <details className="admin-panel advanced">
            <summary>Advanced settings</summary>
            <Fields
              value={c.home}
              onChange={(v) => update("home", v)}
              omit={[
                "eyebrow",
                "title",
                "description",
                "primaryLabel",
                "secondaryLabel",
                "showCollections",
                "showProducts",
                "showProcess",
                "showQuality",
                "showPricing",
              ]}
            />
          </details>
        </>
      )}
      {tab === "About" && (
        <div className="admin-panel">
          <h2>About your business</h2>
          <Fields value={c.about} onChange={(v) => update("about", v)} />
        </div>
      )}
      {tab === "FAQs" && (
        <>
          <button
            className="button outline"
            onClick={() =>
              update("faqs", [
                ...c.faqs,
                {
                  id: crypto.randomUUID(),
                  question: "New question",
                  answer: "",
                  published: false,
                },
              ])
            }
          >
            + Add FAQ
          </button>
          {c.faqs.map((f, i) => (
            <div className="admin-panel" key={f.id}>
              <Fields
                value={f}
                onChange={(v) =>
                  update(
                    "faqs",
                    c.faqs.map((x, n) => (n === i ? v : x)),
                  )
                }
                omit={["id"]}
              />
              <button
                className="text-button danger-text"
                onClick={() => {
                  if (confirm("Remove this question from the draft?"))
                    update(
                      "faqs",
                      c.faqs.filter((_, n) => n !== i),
                    );
                }}
              >
                Remove FAQ
              </button>
            </div>
          ))}
        </>
      )}
      <details className="admin-panel advanced">
        <summary>Advanced settings: page titles & search engines</summary>
        <p>
          Search titles and descriptions appear in search results. Page headings
          and introductions are optional overrides.
        </p>
        {c.seo.map((seo, i) => (
          <details className="seo-panel" key={seo.page}>
            <summary>
              {seo.page === "home"
                ? "Homepage"
                : seo.page[0].toUpperCase() + seo.page.slice(1)}
            </summary>
            <Fields
              value={seo}
              onChange={(v) =>
                update(
                  "seo",
                  c.seo.map((s, n) => (n === i ? v : s)),
                )
              }
              omit={["page"]}
            />
          </details>
        ))}
      </details>
    </>
  );
}
