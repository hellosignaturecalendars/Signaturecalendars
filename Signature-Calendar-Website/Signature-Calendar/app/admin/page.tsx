import { authorized, readContent, preview } from "@/lib/server";
import { Login, Dashboard } from "@/components/admin";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Owner studio | Signature Calendar",
  robots: { index: false, follow: false },
};
export default async function Admin() {
  if (!(await authorized())) return <Login preview={preview} />;
  return (
    <Dashboard
      initial={await readContent(true)}
      preview={preview}
      initialPublishedCount={(await readContent()).designs.length}
    />
  );
}
