import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { inquirySchema } from "@/lib/model";
import {
  requireAdmin,
  inquiries,
  addInquiry,
  updateInquiry,
  sameOrigin,
  rateLimit,
  preview,
} from "@/lib/server";
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await inquiries(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    if (Number(req.headers.get("content-length")) > 12000)
      throw Error("Message is too large");
    const data = inquirySchema.parse(await req.json());
    const isDev = process.env.NODE_ENV === "development";
    if (!preview && !isDev) {
      if (!process.env.TURNSTILE_SECRET_KEY || !process.env.RATE_LIMIT_SALT)
        throw Error(
          "Online inquiries are not configured yet. Please use WhatsApp.",
        );
      const result = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: new URLSearchParams({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: data.token,
          }),
        },
      ).then((r) => r.json());
      if (
        !result.success ||
        result.hostname !== new URL(process.env.SITE_URL!).hostname
      )
        throw Error("Please complete the security check again.");
    }
    await rateLimit(
      `${data.phone.replace(/\D/g, "")}|${data.email.toLowerCase()}`,
    );
    const { website, token, ...fields } = data;
    await addInquiry({
      ...fields,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: "New",
      notes: "",
    });
    return NextResponse.json({ ok: true, preview });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
export async function PATCH(req: Request) {
  try {
    sameOrigin(req);
    await requireAdmin();
    const { id, ...patch } = z
      .object({
        id: z.string().min(1).max(100),
        status: z.enum(["New", "Contacted", "Quoted", "Confirmed", "Closed"]),
        notes: z.string().max(10000),
      })
      .strict()
      .parse(await req.json());
    await updateInquiry(id, patch);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: (e as Error).message === "Unauthorized" ? 401 : 400 },
    );
  }
}
