export const MAX_UPLOAD_BYTES = 10_000_000;
export function validateFile(
  file: { size: number; type: string },
  kind: "image" | "pdf" | "any" = "any",
) {
  if (!file.size || file.size > MAX_UPLOAD_BYTES)
    throw Error("Choose a non-empty file smaller than 10 MB.");
  const images = ["image/jpeg", "image/png", "image/webp"];
  const allowed =
    kind === "image"
      ? images
      : kind === "pdf"
        ? ["application/pdf"]
        : [...images, "application/pdf"];
  if (!allowed.includes(file.type))
    throw Error(
      kind === "pdf"
        ? "Choose a PDF document."
        : "Choose a JPG, PNG or WebP image" +
            (kind === "any" ? ", or a PDF." : "."),
    );
}
export function fileKind(bytes: Uint8Array): "image" | "pdf" | null {
  const text = (a: number, b: number) =>
    String.fromCharCode(...bytes.subarray(a, b));
  if (text(0, 5) === "%PDF-") return "pdf";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n))
    return "image";
  if (text(0, 4) === "RIFF" && text(8, 12) === "WEBP") return "image";
  return null;
}
export function trustedCloudinaryPdf(value: string, cloudName?: string) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      u.hostname === "res.cloudinary.com" &&
      !u.username &&
      !u.password &&
      (!cloudName || u.pathname.startsWith(`/${cloudName}/`)) &&
      /\/(raw|image)\/upload\//.test(u.pathname)
    );
  } catch {
    return false;
  }
}
