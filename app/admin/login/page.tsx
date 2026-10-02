import { redirect } from "next/navigation";
import { authorized, preview, readContent } from "@/lib/server";
import { Login } from "@/components/admin/login";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin Login | Signature Calendar",
  robots: { index: false, follow: false },
};
export default async function Page() {
  if (await authorized()) redirect("/admin");
  const c = await readContent();
  return <Login preview={preview} businessName={c.business.name} />;
}
