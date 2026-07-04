import type { MetadataRoute } from "next";

// Public marketing pages are crawlable; the authenticated app + token surfaces are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard", "/onboarding", "/properties", "/units", "/tenants",
        "/leases", "/rent", "/maintenance", "/construction", "/crm", "/legal", "/portal", "/receipt",
        "/owners", "/owner", "/claim-owner",
        "/login", "/claim", "/pay",
      ],
    },
    sitemap: "https://konkereplus.com/sitemap.xml",
    host: "https://konkereplus.com",
  };
}
