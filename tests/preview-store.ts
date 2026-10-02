import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
// Local regression tests preserve the exact draft, published content and inquiries.
export default async function setup() {
  const file = path.join(process.cwd(), ".data", "preview.json");
  const response = await fetch("http://127.0.0.1:3000/admin/login");
  if (!(await response.text()).includes("Enter local preview studio"))
    throw Error("Tests require the local preview, never a live Firebase site.");
  const original = await readFile(file);
  const backup = path.join(process.cwd(), ".data", "test-backups");
  await mkdir(backup, { recursive: true });
  await writeFile(path.join(backup, `${Date.now()}.json`), original);
  return async () => {
    await writeFile(file, original);
  };
}
