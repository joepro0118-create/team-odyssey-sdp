import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

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
          borderRadius: 40,
          background:
            "linear-gradient(135deg, #C8102E 0%, #C8102E 45%, #E8602A 75%, #FFC72C 100%)",
          color: "#ffffff",
          fontSize: 104,
          fontWeight: 900,
          fontFamily: "sans-serif",
        }}
      >
        T
      </div>
    ),
    {
      ...size,
    },
  );
}
