import type { Metadata } from "next";
import "./globals.css";
import "./refinements.css";
import "./mobile.css";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: "Signature Calendar",
  description: "Premium calendars, personalized for your brand.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
