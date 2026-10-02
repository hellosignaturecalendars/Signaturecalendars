import { NextResponse } from "next/server";
import {
  requireAdmin,
  readContent,
  saveContent,
  sameOrigin,
} from "@/lib/server";
import { contentSchema } from "@/lib/model";
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
    const { content, publish } = await req.json();
    const valid = contentSchema.parse(content);
    if (Buffer.byteLength(JSON.stringify(valid)) > 800000)
      throw Error("Content is too large for this collection.");
    await saveContent(valid, publish === true);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: (e as Error).message === "Unauthorized" ? 401 : 400 },
    );
  }
}
