import { readContent, authorized } from "@/lib/server";
import { deliverPdf } from "@/lib/pdf";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const query = new URL(req.url).searchParams;
  const draft = query.get("draft") === "1";
  if (draft && !(await authorized()))
    return new Response("Unauthorized", { status: 401 });
  const c = await readContent(draft);
  const d = c.designs.find((d) => d.id === id);
  if (!d?.pdf) return new Response("PDF not found", { status: 404 });
  return deliverPdf(
    d.pdf,
    d.id,
    query.get("download") === "1",
    draft,
    process.env.CLOUDINARY_CLOUD_NAME,
  );
}
