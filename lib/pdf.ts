import { trustedCloudinaryPdf, MAX_UPLOAD_BYTES } from "./media";
export async function deliverPdf(
  url: string,
  filename: string,
  download: boolean,
  privateDraft = false,
  cloudName?: string,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  if (!trustedCloudinaryPdf(url, cloudName))
    return new Response(
      "This PDF needs a Cloudinary delivery URL. Please contact us for the catalogue.",
      { status: 400 },
    );
  try {
    const upstream = await fetcher(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });
    if (!upstream.ok || !upstream.body) throw Error("Unavailable");
    if (Number(upstream.headers.get("content-length")) > MAX_UPLOAD_BYTES)
      throw Error("Too large");
    const reader = upstream.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_UPLOAD_BYTES) {
        await reader.cancel();
        throw Error("Too large");
      }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks);
    if (bytes.subarray(0, 5).toString() !== "%PDF-") throw Error("Not PDF");
    const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, "-");
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeName}.pdf"`,
        "Cache-Control": privateDraft ? "private, no-store" : "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(
      "The catalogue is temporarily unavailable. Please contact us for a copy.",
      { status: 502 },
    );
  }
}
