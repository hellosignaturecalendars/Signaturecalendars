import { NextResponse } from "next/server";
import {
  requireAdmin,
  readContent,
  saveContent,
  sameOrigin,
} from "@/lib/server";
import { contentSchema } from "@/lib/model";
import { ZodError } from "zod";
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await readContent(true), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
export async function PUT(req: Request) {
  try {
    sameOrigin(req);
    await requireAdmin();
    if (Number(req.headers.get("content-length")) > 800000)
      throw Error("Content is too large");
    const { content, publish, designId } = await req.json();
    const valid = contentSchema.parse(content);
    if (Buffer.byteLength(JSON.stringify(valid)) > 800000)
      throw Error("Content is too large for this collection.");
    let publishedOverride;
    if (publish === true && typeof designId === "string") {
      const design = valid.designs.find((d) => d.id === designId);
      if (!design) throw Error("Design not found in this draft.");
      const current = await readContent();
      publishedOverride = {
        ...current,
        designs: [
          ...current.designs.filter((d) => d.id !== designId && d.code.toLowerCase() !== design.code.toLowerCase()),
          ...(design.published ? [design] : []),
        ],
      };
      if (
        design.category &&
        !publishedOverride.categories.includes(design.category)
      )
        publishedOverride.categories = [
          ...publishedOverride.categories,
          design.category,
        ];
      if (
        design.collection &&
        !publishedOverride.collections.includes(design.collection)
      )
        publishedOverride.collections = [
          ...publishedOverride.collections,
          design.collection,
        ];
    }
    if (
      publish === true &&
      !(publishedOverride || valid).designs.every(
        (d) => !d.published || (!!d.name.trim() && !!d.cover),
      )
    )
      throw Error("Each published design needs a name and cover image.");
    await saveContent(valid, publish === true, publishedOverride);
    return NextResponse.json({
      ok: true,
      publishedCount: (await readContent()).designs.length,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof ZodError
            ? e.issues
                .map((i) => `${i.path.join(" → ") || "Content"}: ${i.message}`)
                .join(". ")
            : (e as Error).message,
      },
      { status: (e as Error).message === "Unauthorized" ? 401 : 400 },
    );
  }
}
