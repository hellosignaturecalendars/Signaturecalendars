import Link from "next/link";
export default function NotFound() {
  return (
    <main className="page-intro">
      <span className="eyebrow">A PAGE OUT OF PLACE</span>
      <h1>Let’s turn the page.</h1>
      <p>This page or design is not available.</p>
      <Link className="button" href="/designs">
        Explore calendar designs ↗
      </Link>
    </main>
  );
}
