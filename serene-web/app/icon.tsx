import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 32, height: 32 };

export const contentType = "image/png";

/**
 * PNG favicon — reliably picked up by browsers (many ignore or cache SVG poorly).
 * Green leaf on dark tile, aligned with Serene palette.
 */
export default function Icon() {
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
          background: "#1A1A18",
          borderRadius: 9,
        }}
      >
        <div
          style={{
            width: 19,
            height: 21,
            marginTop: -3,
            background:
              "linear-gradient(165deg, #D8EDC8 0%, #8ABD80 38%, #5E9A52 72%, #2C4827 100%)",
            borderRadius: "52% 52% 48% 48% / 58% 58% 42% 42%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 1.5,
              height: 13,
              borderRadius: 1,
              background: "rgba(26,26,24,0.22)",
            }}
          />
        </div>
        <div
          style={{
            width: 2.2,
            height: 4,
            marginTop: -1,
            borderRadius: 1,
            background: "#4E7A44",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
