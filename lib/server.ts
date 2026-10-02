import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { seed } from "./seed";
import { publicContent, type Content, type Inquiry } from "./model";
export const preview = process.env.APP_MODE !== "live";
export const contentCollection =
  process.env.CONTENT_COLLECTION || "signature_content_v1";
export const inquiriesCollection =
  process.env.INQUIRIES_COLLECTION || "signature_inquiries_v1";
export function firebase() {
  if (!getApps().length)
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  return { auth: getAuth(), db: getFirestore() };
}
type Store = { published: Content; draft: Content; inquiries: Inquiry[] };
const file = path.join(process.cwd(), ".data", "preview.json");
let queue: Promise<unknown> = Promise.resolve();
async function local(): Promise<Store> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    return {
      published: structuredClone(seed),
      draft: structuredClone(seed),
      inquiries: [],
    };
  }
}
async function mutateLocal(fn: (s: Store) => void) {
  const next = queue.then(async () => {
    const s = await local();
    fn(s);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file + ".tmp", JSON.stringify(s, null, 2));
    await fs.rename(file + ".tmp", file);
  });
  queue = next.catch(() => {});
  await next;
}
export async function readContent(draft = false): Promise<Content> {
  if (preview) {
    const s = await local();
    return withDefaults(draft ? s.draft : publicContent(s.published));
  }
  const doc = await firebase()
    .db.collection(contentCollection)
    .doc(draft ? "draft" : "published")
    .get();
  if (!doc.exists) {
    return {
      ...structuredClone(seed),
      designs: [],
      products: [],
      pricing: [],
      faqs: [],
      media: [],
    };
  }
  return withDefaults(
    draft ? (doc.data() as Content) : publicContent(doc.data() as Content),
  );
}
function withDefaults(c: Content): Content {
  return {
    ...c,
    business: { facebook: "", socialLinks: [], ...c.business },
    home: { ...seed.home, ...c.home },
    seo: c.seo.map((s) => ({ heading: "", introduction: "", ...s })),
  };
}
export function connectionStatus() {
  return {
    firebaseConfigured:
      !preview &&
      !!process.env.FIREBASE_PROJECT_ID &&
      !!process.env.FIREBASE_CLIENT_EMAIL &&
      !!process.env.FIREBASE_PRIVATE_KEY,
    cloudinaryConfigured:
      !!process.env.CLOUDINARY_CLOUD_NAME &&
      !!process.env.CLOUDINARY_API_KEY &&
      !!process.env.CLOUDINARY_API_SECRET,
  };
}
export async function saveContent(
  content: Content,
  publish = false,
  publishedOverride?: Content,
) {
  if (preview)
    return mutateLocal((s) => {
      s.draft = content;
      if (publish) s.published = structuredClone(publishedOverride || content);
    });
  const db = firebase().db;
  const batch = db.batch();
  batch.set(db.collection(contentCollection).doc("draft"), content);
  if (publish)
    batch.set(
      db.collection(contentCollection).doc("published"),
      publicContent(publishedOverride || content),
    );
  await batch.commit();
}
export async function inquiries() {
  return preview
    ? (await local()).inquiries
    : (
        await firebase()
          .db.collection(inquiriesCollection)
          .orderBy("createdAt", "desc")
          .limit(2000)
          .get()
      ).docs.map((d) => ({ ...d.data(), id: d.id }) as Inquiry);
}
export async function addInquiry(i: Inquiry) {
  if (preview)
    return mutateLocal((s) => {
      s.inquiries.unshift(i);
    });
  await firebase().db.collection(inquiriesCollection).doc(i.id).create(i);
}
export async function updateInquiry(
  id: string,
  patch: { status: string; notes: string },
) {
  if (preview)
    return mutateLocal((s) => {
      const i = s.inquiries.find((i) => i.id === id);
      if (!i) throw Error("Inquiry not found");
      Object.assign(i, patch);
    });
  await firebase().db.collection(inquiriesCollection).doc(id).update(patch);
}
const globalState = globalThis as typeof globalThis & { previewToken?: string };
export function devToken() {
  return (globalState.previewToken ??= randomBytes(32).toString("hex"));
}
export async function authorized() {
  const token = (await cookies()).get("sc-session")?.value;
  if (!token) return false;
  if (preview)
    return process.env.NODE_ENV === "development" && token === devToken();
  try {
    const claims = await firebase().auth.verifySessionCookie(token, true);
    const user = await firebase().auth.getUser(claims.uid);
    return !user.disabled && user.customClaims?.admin === true;
  } catch {
    return false;
  }
}
export async function requireAdmin() {
  if (!(await authorized())) throw Error("Unauthorized");
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) throw Error("Invalid request origin");
  if (process.env.NODE_ENV === "development") {
    const devOrigins = ["http://127.0.0.1:3000", "http://localhost:3000", "http://127.0.0.1:3001", "http://localhost:3001"];
    if (devOrigins.includes(origin)) return;
    throw Error("Invalid request origin");
  }
  // Production: allow SITE_URL or the request's own origin (covers all vercel.app preview URLs)
  const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
  const requestOrigin = new URL(req.url).origin;
  const allowed = [...(siteUrl ? [siteUrl] : []), requestOrigin];
  if (!allowed.includes(origin)) throw Error("Invalid request origin");
}
const limits = new Map<string, { count: number; start: number }>();
export async function rateLimit(key: string) {
  const id = createHash("sha256")
    .update(`${process.env.RATE_LIMIT_SALT || "preview"}:${key}`)
    .digest("hex");
  const now = Date.now();
  if (preview) {
    const old = limits.get(id);
    const v = old && now - old.start < 3600000 ? old : { count: 0, start: now };
    if (v.count >= 5)
      throw Error(
        "Too many inquiries. Please try again later or contact us on WhatsApp.",
      );
    v.count++;
    limits.set(id, v);
    return;
  }
  const db = firebase().db;
  const ref = db
    .collection(process.env.RATE_LIMIT_COLLECTION || "signature_rate_limits_v1")
    .doc(id);
  await db.runTransaction(async (tx) => {
    const d = (await tx.get(ref)).data();
    const v = d && now - d.start < 3600000 ? d : { count: 0, start: now };
    if (v.count >= 5)
      throw Error("Too many inquiries. Please try again later.");
    tx.set(ref, {
      count: v.count + 1,
      start: v.start,
      expiresAt: new Date(now + 3600000),
    });
  });
}
