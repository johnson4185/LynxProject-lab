import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "url.ify — Turn Every Link Into Intelligence",
  description:
    "The link intelligence platform trusted by 68,000+ teams. Shorten, brand, track, and scale every URL with real-time analytics and team collaboration.",
  keywords: ["link shortener", "URL shortener", "URL analytics", "branded links", "link tracking"],
  openGraph: {
    title: "url.ify — Turn Every Link Into Intelligence",
    description: "Real-time link analytics, custom domains, and team collaboration — in one powerful platform.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
