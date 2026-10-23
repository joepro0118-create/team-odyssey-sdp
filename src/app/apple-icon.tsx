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
          borderRadius: 44,
          background:
            "linear-gradient(135deg, #C8102E 0%, #C8102E 55%, #E8602A 100%)",
        }}
      >
        <svg
          width="146"
          height="146"
          viewBox="0 0 96 96"
          style={{ display: "flex" }}
        >
          <g transform="translate(48 50) scale(1.14) translate(-48 -48)">
            <path
              d="M20 46 L48 22 L76 46"
              fill="none"
              stroke="#ffffff"
              strokeWidth="7.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="37" cy="52" r="7.5" fill="#ffffff" />
            <path d="M24 77 a13 13 0 0 1 26 0 z" fill="#ffffff" />
            <circle cx="59" cy="52" r="7.5" fill="#FFC72C" />
            <path d="M46 77 a13 13 0 0 1 26 0 z" fill="#FFC72C" />
          </g>
        </svg>
      </div>
    ),
    {
      ...size,
    },
  );
}
