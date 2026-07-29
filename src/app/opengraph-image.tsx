import { ImageResponse } from "next/og";

export const alt = "QRFrame — Custom QR Code Generator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TEAL = "#0E9E92";
const WHITE = "#F7FDFC";
const INK = "#101412";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          background: `radial-gradient(60% 60% at 15% 0%, ${TEAL}33, transparent 70%), radial-gradient(50% 50% at 100% 100%, ${TEAL}22, transparent 70%), ${INK}`,
        }}
      >
        <div
          style={{
            width: 128,
            height: 128,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: TEAL,
            borderRadius: 28,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: WHITE,
              borderRadius: 16,
            }}
          >
            <div style={{ width: 22, height: 22, background: TEAL, borderRadius: 5 }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, color: WHITE, letterSpacing: -1 }}>
            QRFrame
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#9FB0AC" }}>
            Design and save custom QR codes, free
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
