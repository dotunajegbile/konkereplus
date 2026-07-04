import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "KonkerePlus — Build. Sell. Lease. Manage.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px",
          background: "linear-gradient(135deg, #0a0c10 0%, #12183a 60%, #1c46b8 130%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 16, background: "#2f6bff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 34, fontWeight: 900,
            }}
          >
            K+
          </div>
          <div style={{ fontSize: 34, fontWeight: 800 }}>KonkerePlus</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.05, maxWidth: 960 }}>
            Build. Sell. Lease. Manage every property.
          </div>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.7)", maxWidth: 900 }}>
            Construction · Leasing · Tenants · Rent · Maintenance — one multi-tenant platform.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 24, color: "rgba(255,255,255,0.55)" }}>
          <span>konkereplus.com</span>
          <span>·</span>
          <span>🇳🇬 Built for West-African developers</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
