import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Same mark as app/icon.svg, rendered at Apple's recommended touch-icon size
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#16243E",
        }}
      >
        <svg width="180" height="180" viewBox="0 0 64 64">
          <g transform="translate(12.5 12.8) scale(0.62)">
            <path
              d="M30.52 -0.02Q31.22 -0.59 31.92 -0.02L62.12 24.6Q62.82 25.16 62.82 26.06L62.82 61.11Q62.82 61.91 62.02 61.91L22.86 61.91Q22.06 61.91 22.12 61.11L23.06 48.92Q23.12 48.12 23.92 48.12L35.1 48.12A11.8 11.8 0 0 0 46.9 36.32L46.9 33.15A10 10 0 0 0 36.9 23.15L17.89 23.15Q17.09 23.15 17 23.95L15.29 39.65Q15.2 40.45 14.4 40.45L0.55 40.45Q-0.25 40.45 -0.25 39.65L-0.25 25.96Q-0.25 25.06 0.45 24.49Z"
              fill="#F17202"
            />
            <path
              d="M-0.25 48.86Q-0.25 48.06 0.55 48.06L13.43 48.06Q14.23 48.06 14.16 48.86L13.01 61.1Q12.94 61.9 12.14 61.9L0.55 61.9Q-0.25 61.9 -0.25 61.1Z"
              fill="#FFFFFF"
            />
          </g>
        </svg>
      </div>
    ),
    { ...size },
  );
}
