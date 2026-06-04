import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "jobihome.vn — Quản lý team & nhân sự cho startup Việt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          color: "white",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
            fontSize: "32px",
            fontWeight: "700",
            opacity: 0.95,
          }}
        >
          💼 jobihome.vn
        </div>

        <div
          style={{
            fontSize: "72px",
            fontWeight: "800",
            lineHeight: 1.05,
            marginBottom: "24px",
            maxWidth: "1000px",
          }}
        >
          Quản lý team & nhân sự
        </div>
        <div
          style={{
            fontSize: "72px",
            fontWeight: "800",
            lineHeight: 1.05,
            marginBottom: "32px",
            color: "#fde047",
          }}
        >
          cho startup Việt
        </div>

        <div
          style={{
            fontSize: "28px",
            fontWeight: "400",
            lineHeight: 1.4,
            opacity: 0.9,
            maxWidth: "900px",
          }}
        >
          Tasks · Time tracking · Payroll · Audit. Tất cả trong 1 workspace.
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "60px",
            right: "80px",
            fontSize: "20px",
            opacity: 0.85,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🇻🇳 Made in Vietnam · 14 ngày miễn phí
        </div>
      </div>
    ),
    size,
  );
}
