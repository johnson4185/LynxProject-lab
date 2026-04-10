import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "url.ify — Platform",
  description: "url.ify dashboard platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
