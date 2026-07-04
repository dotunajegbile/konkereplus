import type { Metadata } from "next";
import "./globals.css";

const DESCRIPTION =
  "One platform to build, sell, lease and manage every property — construction, leasing, tenants, rent and maintenance. Multi-tenant, permission-first, built for Nigeria and beyond.";

export const metadata: Metadata = {
  metadataBase: new URL("https://konkereplus.com"),
  title: {
    default: "KonkerePlus — Build. Sell. Lease. Manage.",
    template: "%s · KonkerePlus",
  },
  description: DESCRIPTION,
  applicationName: "KonkerePlus",
  keywords: [
    "property management software Nigeria", "real estate SaaS", "rent collection",
    "lease management", "tenant portal", "facilities management", "construction management",
    "KonkerePlus",
  ],
  authors: [{ name: "KonkerePlus" }],
  openGraph: {
    type: "website",
    siteName: "KonkerePlus",
    url: "https://konkereplus.com",
    title: "KonkerePlus — Build. Sell. Lease. Manage.",
    description: DESCRIPTION,
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "KonkerePlus — Build. Sell. Lease. Manage.",
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
