import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Noela Chibi NFT"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image({ params }: { params: { id: string } }) {
  // Decode the image URL from the id parameter
  const imageUrl = decodeURIComponent(params.id)

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

      {/* Main Content Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 10,
          gap: "24px",
        }}
      >
        {/* Chibi Image */}
        <div
          style={{
            display: "flex",
            width: "400px",
            height: "400px",
            borderRadius: "24px",
            overflow: "hidden",
            border: "4px solid rgba(255,255,255,0.1)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <img
            src={imageUrl || "/placeholder.svg"}
            alt="Chibi NFT"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        {/* Title Badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "48px",
              fontWeight: "900",
              background: "linear-gradient(to right, #fff, #94a3b8)",
              backgroundClip: "text",
              color: "transparent",
              textAlign: "center",
              alignItems: "center",
              gap: "16px",
            }}
          >
            {/* Added mini Chibi head to the title */}
            <svg width="48" height="48" viewBox="0 0 200 200" fill="none">
              <rect x="40" y="50" width="120" height="110" rx="40" fill="#fff" />
              <path d="M30 80 L30 60 Q30 30 60 30 L70 35" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
              <circle cx="30" cy="80" r="15" fill="#3b82f6" />
              <path d="M40 35 L30 15 L60 25" fill="#3b82f6" />
              <path
                d="M170 80 L170 60 Q170 30 140 30 L130 35"
                stroke="#ec4899"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <circle cx="170" cy="80" r="15" fill="#ec4899" />
              <path d="M160 35 L170 15 L140 25" fill="#ec4899" />
              <ellipse cx="75" cy="100" rx="12" ry="18" fill="#0f172a" />
              <circle cx="78" cy="95" r="5" fill="white" />
              <ellipse cx="125" cy="100" rx="12" ry="18" fill="#0f172a" />
              <circle cx="128" cy="95" r="5" fill="white" />
              <circle cx="65" cy="120" r="8" fill="#fca5a5" opacity="0.6" />
              <circle cx="135" cy="120" r="8" fill="#fca5a5" opacity="0.6" />
              <path d="M90 125 Q100 135 110 125" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
            </svg>
            NOELA DAO NFT
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 24px",
              background: "rgba(147, 51, 234, 0.1)",
              borderRadius: "100px",
              fontSize: "20px",
              color: "#e9d5ff",
              border: "1px solid rgba(147, 51, 234, 0.2)",
              fontWeight: "600",
            }}
          >
            Minted on Base • Powered by Noela Frame
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  )
}
