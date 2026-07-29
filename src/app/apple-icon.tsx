import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const TEAL = "#0E9E92";
const WHITE = "#F7FDFC";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: TEAL,
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: WHITE,
            borderRadius: 22,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              background: TEAL,
              borderRadius: 7,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
