import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Noela Frame - All-in-One Crypto & AI Tools"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#030712", // slate-950
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.15) 0px, transparent 50%)
        `,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Grid Pattern Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(circle at center, black 40%, transparent 100%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 10,
          gap: "20px",
        }}
      >
        {/* Logo/Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "200px",
            height: "200px",
            marginBottom: "10px",
            filter: "drop-shadow(0 0 30px rgba(59, 130, 246, 0.5))",
          }}
        >
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Head */}
            <rect x="40" y="50" width="120" height="110" rx="40" fill="#fff" />
            <rect x="40" y="50" width="120" height="110" rx="40" fill="url(#gradient)" opacity="0.5" />
            {/* Cat Ear Headphones (Left) */}
            <path d="M30 80 L30 60 Q30 30 60 30 L70 35" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
            <circle cx="30" cy="80" r="15" fill="#3b82f6" />
            <path d="M40 35 L30 15 L60 25" fill="#3b82f6" />
            {/* Cat Ear Headphones (Right) */}
            <path d="M170 80 L170 60 Q170 30 140 30 L130 35" stroke="#ec4899" strokeWidth="12" strokeLinecap="round" />
            <circle cx="170" cy="80" r="15" fill="#ec4899" />
            <path d="M160 35 L170 15 L140 25" fill="#ec4899" />
            {/* Face */}
            {/* Eyes */}
            <ellipse cx="75" cy="100" rx="12" ry="18" fill="#0f172a" />
            <circle cx="78" cy="95" r="5" fill="white" /> {/* Highlight */}
            <ellipse cx="125" cy="100" rx="12" ry="18" fill="#0f172a" />
            <circle cx="128" cy="95" r="5" fill="white" /> {/* Highlight */}
            {/* Cheeks */}
            <circle cx="65" cy="120" r="8" fill="#fca5a5" opacity="0.6" />
            <circle cx="135" cy="120" r="8" fill="#fca5a5" opacity="0.6" />
            {/* Mouth */}
            <path d="M90 125 Q100 135 110 125" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
            {/* Definitions */}
            <defs>
              <linearGradient id="gradient" x1="40" y1="50" x2="160" y2="160" gradientUnits="userSpaceOnUse">
                <stop stopColor="#e2e8f0" />
                <stop offset="1" stopColor="#cbd5e1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div
          style={{
            fontSize: "72px",
            fontWeight: "800",
            background: "linear-gradient(to bottom right, #ffffff, #94a3b8)",
            backgroundClip: "text",
            color: "transparent",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          Noela Frame
        </div>

        <div
          style={{
            fontSize: "32px",
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: "800px",
            fontWeight: "500",
          }}
        >
          The Ultimate Web3 Toolkit on Base
        </div>

        {/* Feature Pills */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "40px",
          }}
        >
          {["AI Chibi", "Token Sniper", "Copy Trade", "Swap"].map((item) => (
            <div
              key={item}
              style={{
                padding: "12px 24px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "100px",
                color: "#e2e8f0",
                fontSize: "20px",
                fontWeight: "600",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: "#64748b",
          fontSize: "24px",
          fontWeight: "500",
        }}
      >
        <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#3b82f6" }} />
        Powered by Base
      </div>
    </div>,
    { ...size },
  )
}
