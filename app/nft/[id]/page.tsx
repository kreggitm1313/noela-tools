import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAppUrl } from "@/lib/utils"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const imageUrl = decodeURIComponent(params.id)
  const appUrl = getAppUrl()

  return {
    title: "Noela Chibi NFT - NOELA DAO Collection",
    description:
      "Exclusive Chibi NFT from NOELA DAO. Join the revolution with governance rights, revenue share, and exclusive utilities.",
    openGraph: {
      title: "Noela Chibi NFT - NOELA DAO Collection",
      description: "Exclusive Chibi NFT from NOELA DAO. Mint yours on Zora/OpenSea!",
      images: [
        {
          url: `/nft/${params.id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: "Noela Chibi NFT",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Noela Chibi NFT - NOELA DAO Collection",
      description: "Exclusive Chibi NFT from NOELA DAO. Mint yours on Zora/OpenSea!",
      images: [`/nft/${params.id}/opengraph-image`], // Use the branded OG image for Twitter card too
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": `${appUrl}/nft/${params.id}/opengraph-image`, // Use the branded OG image for Frame consistency
      "fc:frame:image:aspect_ratio": "1.91:1", // Update aspect ratio to match the OG image (1200x630)
      "fc:frame:button:1": "View Collection",
      "fc:frame:button:1:action": "link",
      "fc:frame:button:1:target": `${appUrl}/`,
      "fc:frame:button:2": "Mint on Zora",
      "fc:frame:button:2:action": "link",
      "fc:frame:button:2:target": "https://zora.co/create",
    },
  }
}

export default function NFTPage({ params }: { params: { id: string } }) {
  // Redirect to main app
  redirect("/")
}
