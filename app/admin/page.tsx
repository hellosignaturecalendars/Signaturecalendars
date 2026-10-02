import {
  authorized,
  readContent,
  preview,
  connectionStatus,
} from "@/lib/server";
import { Dashboard } from "@/components/admin";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Owner studio | Signature Calendar",
  robots: { index: false, follow: false },
};
export default async function Admin() {
  if (!(await authorized())) redirect("/admin/login");
  return (
    <Dashboard
      initial={await readContent(true)}
      preview={preview}
      initialPublishedCount={(await readContent()).designs.length}
      connections={connectionStatus()}
    />
  );
}
