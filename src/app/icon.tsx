import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const TEAL = "#0E9E92";
const WHITE = "#F7FDFC";

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <div
          style={{
            width: 15,
            height: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: WHITE,
            borderRadius: 4,
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              background: TEAL,
              borderRadius: 1,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
