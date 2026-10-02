# Signature Calendar

A responsive Next.js / React website and owner studio. The initial workspace contained only an empty Git repository: no existing source, Firebase settings, database schema or Cloudinary configuration was available. No remote data or assets have been read, changed or deleted.

## Open your website

1. Install Node.js 22 or newer.
2. Run `npm install`, then `npm run dev` in this folder.
3. Open http://127.0.0.1:3000. The owner dashboard is http://127.0.0.1:3000/admin.
4. Click **Enter local preview studio**. This is a development-only demonstration session, not Firebase authentication.
5. Change your business details, designs, products, pricing or page content. **Save draft** keeps changes private; **Publish changes** updates the public site immediately.

Preview records persist in `.data/preview.json`, excluded from Git. Back up that file if you want to keep your preview edits. Preview sessions stop working when the server restarts. Preview editing is disabled in production. The server binds to localhost by default.

Artwork is original SVG sample artwork, displayed as CSS calendar mockups. Replace it with your real photographs and artwork through the media library once Cloudinary is connected. Specifications and sample product assignments need owner review before launch. The supplied rates are assigned only to the sample horizontal product in preview; do not assume this assignment reflects an existing business policy.

## Connect your existing accounts — safely

Do not deploy the supplied rules over your current Firebase rules without reviewing and merging them. Do not point the new collection names at existing collections until their schemas have been reviewed. This project deliberately uses isolated `signature_*_v1` collection names and performs no automatic migration or seeding of live records.

1. Find your old website source and export/back up its Firestore data and security rules. Inventory existing collections, document shapes, admin claims and Cloudinary upload folders/presets. Review how those records map to `lib/model.ts`.
2. Copy `.env.example` to `.env.local`. Never commit it.
3. In Firebase Console → Project settings → Your apps, copy the web app's `apiKey`, `authDomain` and `projectId` into the three `NEXT_PUBLIC_FIREBASE_*` values. These identify the public Firebase application; they are not administrator credentials.
4. For server access, use a dedicated Firebase service account with only the permissions needed by this application. Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`. The key may contain escaped `\n` characters. Use your hosting provider's secret store in production. Do not paste a private key into chat or frontend code.
5. Enable Email/Password sign-in in Firebase Authentication. Create your owner user. Copy its UID, then run:

   `node --env-file=.env.local scripts/grant-admin.mjs YOUR_USER_UID`

   This adds `admin: true` while preserving existing claims. Sign in again after role changes. The server checks revoked sessions, disabled users and the current trusted admin claim on every protected request. A regular signed-in user is not an administrator.

6. Set your Cloudinary cloud name, API key and **server-only API secret** in `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Uploads pass through the authorized server endpoint and use the Cloudinary server SDK. No unsigned preset is needed. Files are restricted to JPEG, PNG, WebP or PDF, validated by signature and size (10 MB). PDFs use the raw resource type; verify your Cloudinary account permits public PDF delivery. Every upload gets a new asset ID; replacing a reference does not overwrite an old asset.
7. Create a Cloudflare Turnstile site for your production hostname. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and server-only `TURNSTILE_SECRET_KEY`. Add a long random `RATE_LIMIT_SALT`. Live inquiries fail closed until these exist. Turnstile is verified against the configured hostname and Firestore enforces a shared five-per-hour limit for each contact identity. Also enable hosting-level request/body limits and IP abuse protection at the trusted reverse proxy; do not trust arbitrary forwarded-IP headers. Configure TTL on `expiresAt` for the rate-limit collection.
8. Set `SITE_URL` to the exact public HTTPS origin and `APP_MODE=live`. Ensure your proxy preserves the request origin/host so same-origin checks succeed. Set all public environment variables before `npm run build`.
9. Merge `firestore.rules` with your existing rules and deploy through your existing Firebase project workflow. If changing collection names, update the exact rule paths too. Client writes are deliberately denied; the server performs exact field validation, authorization and abuse checks. Inquiries and rate-limit records never have public read access.
10. Start with an empty new namespace. The studio can create records without writing anything on initial load. Manually import a reviewed copy of compatible content into a _draft_ in staging if needed. Preserve source IDs and Cloudinary URLs, reconcile counts, preview, and publish only after checking. A rollback changes collection environment values back to the previous namespace; no destructive migration is needed.

## Publishing and media

- A server-rendered public site reads the published snapshot on every request; rebuilding is not required for content changes.
- The draft document is private. Publishing strips draft designs, draft FAQs and the media library before storing the public document. Media gallery entries on published designs are intentionally public.
- The dashboard edits business details, logo, homepage sections/visibility, collections/categories, designs/gallery order, products, pricing, FAQs, about/services and page metadata through labelled fields.
- Images and PDF URLs can be selected from uploaded media or entered as HTTPS URLs. Keep alt text useful. Gallery artwork and mockups have distinct labels.
- Removing a design or media reference requires confirmation. A used library reference cannot be removed. **This version intentionally never destroys Cloudinary source files**, including assets formerly referenced by published content. Clean up actual files only after an inventory covering old and new sites, drafts, backups and other accounts. This guarantees shared assets are not inadvertently deleted.
- Firestore content uses a bounded snapshot document (maximum validated payload 800 KB). Split into separately versioned collections before a catalogue outgrows that size. The gallery has incremental pagination; inquiries show/export the latest 2,000 records.
- Preview is a private summary of draft artwork, business text and pricing; it does not recreate every responsive public page.

## Inquiries and privacy

The contact form requires a name, message and at least a usable phone or email. It carries selected design name/code/URL and optional quantity. API validation rejects unexpected fields, including attempts to submit internal notes/status. There is a honeypot, Turnstile in live mode, request size checks and persistent rate limiting. Errors never report success. No email notification service is implemented and none is claimed.

The owner can search/filter inquiries, update status and private notes, use contact links, and export CSV. CSV cells neutralize spreadsheet formula prefixes. Preview inquiries remain local. The browser test adds one clearly named `Browser test inquiry` record to demonstrate this workflow.

## Verify and deploy

```text
npm run typecheck
npm test
npm run dev
# In a second terminal (Chrome must be installed):
npm run test:e2e
npm run build
npm start
```

Deploy to a Node-compatible Next.js host; this is not a static export. Use HTTPS, production secret management, server request limits, monitoring and backups. Keep `/admin` and `/api` out of search; robots and no-index metadata are included. Sitemap contains published design URLs. Do not launch `APP_MODE=preview` as a live business website.

Browser tests cover desktop/mobile pages, gallery filters, quantity calculations, image lightbox, inquiry submission, private endpoint access, draft isolation, published contact updates, hidden designs and updated prices. Unit tests cover tier boundaries, safe content projection, inquiry validation, unique codes and WhatsApp parameters. Live Firebase admin/non-admin authentication, existing-schema compatibility, Firestore rules deployment, actual Cloudinary uploads/PDF delivery and Turnstile must be tested with your accounts before launch. No existing remote integration has been verified in this workspace.

Implementation references: [Firebase session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies), [trusted custom claims](https://firebase.google.com/docs/auth/admin/custom-claims), [Cloudinary server uploads](https://cloudinary.com/documentation/upload_images), [Next.js cookies](https://nextjs.org/docs/app/api-reference/functions/cookies).
