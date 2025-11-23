import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { BaseBackground } from "@/components/base-background"
import FarcasterProvider from "@/components/farcaster-provider"
import { WalletProvider } from "@/components/wallet-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import "./globals.css"
import { getAppUrl } from "@/lib/utils"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const appUrl = getAppUrl()

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0052FF", // Base Blue
}

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Noela Frame - All-in-One Crypto & AI Tools",
    template: "%s | Noela Frame",
  },
  description:
    "The ultimate Web3 toolkit on Base: AI Chibi Generator, Token Sniper, Copy Trading, Swap, and Real-time Market Analytics.",
  applicationName: "Noela Frame",
  authors: [{ name: "Noela DAO", url: "https://twitter.com/noela_tools" }],
  generator: "Next.js",
  keywords: ["Base", "Crypto", "AI", "NFT", "Trading", "Noela"],
  referrer: "origin-when-cross-origin",
  creator: "Noela DAO",
  publisher: "Noela DAO",
  robots: "index, follow",

  other: {
    "fc:frame": "vNext",
    "fc:frame:image": `${appUrl}/opengraph-image`,
    "fc:frame:image:aspect_ratio": "1.91:1",
    "fc:frame:button:1": "🚀 Launch App",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": `${appUrl}/`,
    "fc:frame:button:2": "🎨 Create Chibi",
    "fc:frame:button:2:action": "link",
    "fc:frame:button:2:target": `${appUrl}/?tab=chibi`,
    "fc:frame:post_url": `${appUrl}/api/frame`,
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Noela Frame - All-in-One Crypto & AI Tools",
    description:
      "The ultimate Web3 toolkit on Base: AI Chibi Generator, Token Sniper, Copy Trading, Swap, and Real-time Market Analytics.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Noela Frame Preview",
        type: "image/png",
      },
    ],
    type: "website",
    url: appUrl,
    siteName: "Noela Frame",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noela Frame - All-in-One Crypto & AI Tools",
    description:
      "The ultimate Web3 toolkit on Base: AI Chibi Generator, Token Sniper, Copy Trading, Swap, and Real-time Market Analytics.",
    images: ["/opengraph-image"],
    creator: "@noela_tools",
    site: "@noela_tools",
  },
  appleWebApp: {
    capable: true,
    title: "Noela Frame",
    statusBarStyle: "black-translucent",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ErrorBoundary>
          <WalletProvider>
            <FarcasterProvider>
              <BaseBackground />
              <div className="relative z-10">{children}</div>
              <Toaster />
              <Analytics />
            </FarcasterProvider>
          </WalletProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
