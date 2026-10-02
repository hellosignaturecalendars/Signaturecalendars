import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin, sameOrigin } from "@/lib/server";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await requireAdmin();
    if (!process.env.CLOUDINARY_API_SECRET)
      return NextResponse.json(
        {
          error:
            "Cloudinary is not connected. Add your account settings to enable uploads.",
        },
        { status: 503 },
      );
    if (Number(req.headers.get("content-length")) > 11000000)
      throw Error("Maximum file size is 10 MB");
    const file = (await req.formData()).get("file");
    if (!(file instanceof File) || file.size > 10000000)
      throw Error("Choose a file smaller than 10 MB");
    const bytes = Buffer.from(await file.arrayBuffer());
    const pdf = bytes.subarray(0, 5).toString() === "%PDF-";
    const png = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp =
      bytes.subarray(0, 4).toString() === "RIFF" &&
      bytes.subarray(8, 12).toString() === "WEBP";
    if (!pdf && !png && !jpg && !webp)
      throw Error("Supported files: JPEG, PNG, WebP and PDF");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const result = await new Promise<any>((resolve, reject) =>
      cloudinary.uploader
        .upload_stream(
          {
            folder: "signature-calendar",
            resource_type: pdf ? "raw" : "image",
            ...(pdf
              ? { public_id: `catalogue-${crypto.randomUUID()}.pdf` }
              : {}),
          },
          (err, result) => (err ? reject(err) : resolve(result)),
        )
        .end(bytes),
    );
    return NextResponse.json({
      id: crypto.randomUUID(),
      url: result.secure_url,
      publicId: result.public_id,
      alt: file.name,
      label: file.name,
      kind: pdf ? "PDF" : "Artwork",
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: (e as Error).message === "Unauthorized" ? 401 : 400 },
    );
  }
}
