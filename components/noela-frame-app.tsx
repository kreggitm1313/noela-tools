"use client"

import { useEffect } from "react"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PhotoToChibi } from "@/components/photo-to-chibi"
import { ChibiGenerator } from "@/components/chibi-generator"
import { BannerMaker } from "@/components/banner-maker"
import { MusicPlayer } from "@/components/music-player"
import { ImageSplitter } from "@/components/image-splitter"
import { CopyTrader } from "@/components/copy-trader"
import { AlphaMember } from "@/components/alpha-member"
import { CommunityBoost } from "@/components/community-boost"
import { BoostCarousel } from "@/components/boost-carousel"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { WalletRoast } from "@/components/wallet-roast"
import { RugChecker } from "@/components/rug-checker"
import {
  Sparkles,
  ImageIcon,
  Layout,
  Share2,
  Grid,
  ArrowLeftRight,
  Loader2,
  Crown,
  Rocket,
  MessageSquareText,
  Flame,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useFarcaster } from "@/components/farcaster-provider"
import { MarketWidget } from "@/components/market-widget"
import { XReplyGenerator } from "@/components/x-reply-generator"

export interface Pool {
  id: number
  name: string
  description: string
  reward: string
  tokenAddress: string
  participants: number
  maxParticipants: number
  status: "active" | "ended"
  link: string
  logo: string
  color: string
}

const INITIAL_POOLS: Pool[] = [
  {
    id: 1,
    name: "Noela Official",
    description: "Support the launch of Noela Frame! Like & Recast our pinned post.",
    reward: "100 $NOELA",
    tokenAddress: "0x15fE1Efb7C07B49A4e4756Ced33C1E790e89182e",
    participants: 0,
    maxParticipants: 100,
    status: "active",
    link: "https://warpcast.com/noee.eth",
    logo: "🦁",
    color: "bg-blue-500",
  },
]

export function NoelaFrameApp() {
  const { toast } = useToast()
  const { isLoading } = useFarcaster()
  const [isMember, setIsMember] = useState(false)
  const [pools, setPools] = useState<Pool[]>(INITIAL_POOLS)
  const [activeTab, setActiveTab] = useState("photo")

  useEffect(() => {
    const memberStatus = localStorage.getItem("alpha_member")
    setIsMember(memberStatus === "true")
  }, [])

  const handleAddPool = (newPool: Pool) => {
    setPools((prev) => [newPool, ...prev])
  }

  const handleClaimPool = (poolId: number) => {
    setPools((prevPools) =>
      prevPools.map((pool) => {
        if (pool.id === poolId) {
          const newParticipants = pool.participants + 1
          return {
            ...pool,
            participants: newParticipants,
            status: newParticipants >= pool.maxParticipants ? "ended" : pool.status,
          }
        }
        return pool
      }),
    )
  }

  const handleNavigateToBoost = () => {
    setActiveTab("boost")
    const tabsElement = document.querySelector('[role="tablist"]')
    if (tabsElement) {
      tabsElement.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  const shareToFarcaster = () => {
    const text = encodeURIComponent("Check out Noela Frame - Create cute anime chibi art! ✨")
    const url = encodeURIComponent("https://noela-toolss.vercel.app")
    const farcasterShareUrl = `https://warpcast.com/~/compose?text=${text}&embeds[]=${url}`
    window.open(farcasterShareUrl, "_blank")

    toast({
      title: "Opening Farcaster",
      description: "Share Noela Frame with your followers!",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl base-gradient flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0052FF] mb-2">Loading Noela Frame</h2>
            <p className="text-sm text-muted-foreground">Preparing your creative tools...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 pb-40">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-blue-100/50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl base-gradient flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0052FF]">Noela Frame</h1>
                <p className="text-xs text-muted-foreground">Create Cute Anime Art</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-100 rounded-lg shadow-sm">
              <div className="flex gap-[2px]">
                <div className="w-3 h-3 bg-[#0052FF] rounded-[1px]"></div>
                <div className="w-3 h-3 bg-[#0052FF] rounded-[1px]"></div>
                <div className="w-3 h-3 bg-[#0052FF] rounded-[1px]"></div>
              </div>
              <span className="text-sm font-bold text-[#0052FF] tracking-wide">BASE</span>
            </div>
            <div className="flex items-center gap-2">
              <WalletConnectButton />
              <Button
                onClick={shareToFarcaster}
                variant="outline"
                size="sm"
                className="hidden sm:flex border-[#0052FF]/20 hover:bg-[#0052FF]/5 hover:border-[#0052FF]/40 text-[#0052FF] font-semibold bg-transparent"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <a
                href="https://warpcast.com/noee.eth"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#0052FF] hover:text-[#0041CC] font-semibold"
              >
                @noee.eth
              </a>
            </div>
          </div>
        </div>
      </header>

      {!isMember && (
        <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 py-3 px-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-white animate-pulse" />
              <p className="text-white font-bold text-sm sm:text-base">
                Join Alpha Members for exclusive trading signals & zero fees!
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="https://x.com/messages/compose?recipient_id=1799378337923315712"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105"
              >
                <Badge className="bg-white text-orange-600 font-bold hover:bg-white/90 cursor-pointer">DM on X</Badge>
              </a>
              <a
                href="https://t.me/Noela_zee"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105"
              >
                <Badge className="bg-white text-orange-600 font-bold hover:bg-white/90 cursor-pointer">Telegram</Badge>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-10 mb-8 bg-white shadow-md rounded-2xl p-1.5 border border-blue-100/50 h-auto">
            <TabsTrigger
              value="photo"
              className="data-[state=active]:bg-[#0052FF] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 text-xs sm:text-sm rounded-xl font-semibold transition-all py-2"
            >
              <ImageIcon className="w-4 h-4 mr-2 hidden sm:inline" />
              Photo
            </TabsTrigger>
            <TabsTrigger
              value="generate"
              className="data-[state=active]:bg-[#0052FF] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 text-xs sm:text-sm rounded-xl font-semibold transition-all py-2"
            >
              <Sparkles className="w-4 h-4 mr-2 hidden sm:inline" />
              Generate
            </TabsTrigger>
            <TabsTrigger
              value="boost"
              className="data-[state=active]:bg-[#0052FF] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 text-xs sm:text-sm rounded-xl font-semibold transition-all py-2"
            >
              <Rocket className="w-4 h-4 mr-2 hidden sm:inline" />
              Boost
            </TabsTrigger>
            <TabsTrigger
              value="alpha"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/30 text-xs sm:text-sm rounded-xl font-semibold transition-all py-2"
            >
              <Crown className="w-4 h-4 mr-2 hidden sm:inline" />
              Alpha
            </TabsTrigger>
            <TabsTrigger
              value="copytrade"
              className="data-[state=active]:bg-[#0052FF] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 text-xs sm:text-sm rounded-xl font-semibold transition-all py-2"
            >
              <ArrowLeftRight className="w-4 h-4 mr-2 hidden sm:inline" />
              SWAP
            </TabsTrigger>
            <TabsTrigger
              value="banner"
              className="data-[state=active]:bg-[#0052FF] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 text-xs sm:text-sm rounded-xl font-semibold transition-all py-2"
            >
              <Layout className="w-4 h-4 mr-2 hidden sm:inline" />
              Banner
            </TabsTrigger>
            <TabsTrigger
              value="splitter"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:via-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/40 text-xs sm:text-sm rounded-xl font-semibold transition-all py-2"
            >
              <Grid className="w-4 h-4 mr-2 hidden sm:inline" />
              Grid Anime
            </TabsTrigger>
            <TabsTrigger
              value="reply"
              className="data-[state=active]:bg-[#0052FF] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 text-xs sm:text-sm rounded-xl font-semibold transition-all py-2"
            >
              <MessageSquareText className="w-4 h-4 mr-2 hidden sm:inline" />X Reply
            </TabsTrigger>
            <TabsTrigger
              value="roast"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/30 text-xs sm:text-sm rounded-xl font-semibold transition-all py-2"
            >
              <Flame className="w-4 h-4 mr-2 hidden sm:inline" />
              Roast
            </TabsTrigger>
            <TabsTrigger
              value="rugcheck"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 text-xs sm:text-sm rounded-xl font-semibold transition-all py-2"
            >
              <ShieldCheck className="w-4 h-4 mr-2 hidden sm:inline" />
              Rug Check
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photo" className="mt-0">
            <PhotoToChibi />
          </TabsContent>

          <TabsContent value="generate" className="mt-0">
            <ChibiGenerator />
          </TabsContent>

          <TabsContent value="boost" className="mt-0">
            <CommunityBoost pools={pools} onAddPool={handleAddPool} onClaimPool={handleClaimPool} />
          </TabsContent>

          <TabsContent value="alpha" className="mt-0">
            <AlphaMember />
          </TabsContent>

          <TabsContent value="copytrade" className="mt-0">
            <CopyTrader />
          </TabsContent>

          <TabsContent value="banner" className="mt-0">
            <BannerMaker />
          </TabsContent>

          <TabsContent value="splitter" className="mt-0">
            <ImageSplitter />
          </TabsContent>

          <TabsContent value="reply" className="mt-0">
            <XReplyGenerator />
          </TabsContent>

          <TabsContent value="roast" className="mt-0">
            <WalletRoast />
          </TabsContent>

          <TabsContent value="rugcheck" className="mt-0">
            <RugChecker />
          </TabsContent>
        </Tabs>

        <BoostCarousel pools={pools} onNavigateToBoost={handleNavigateToBoost} />
      </main>

      {/* Sticky Music Player at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
        <div className="container mx-auto max-w-4xl flex justify-between items-end pointer-events-auto">
          <div className="hidden sm:block">
            <MarketWidget />
          </div>
          <div className="sm:hidden absolute bottom-20 left-4">
            <MarketWidget />
          </div>
          <MusicPlayer />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-12 border-t border-blue-100/50 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg base-gradient flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-[#0052FF]">Noela Frame</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The ultimate all-in-one creative and trading suite on Base. Create anime art, snipe tokens, and manage
                your portfolio with professional tools.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-blue-900">Utility & Roadmap</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  Phase 1: Creative Tools & Swap (Live)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                  Phase 2: Alpha Membership & Signals
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Phase 3: DAO Governance & Revenue Share
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-blue-900">Connect With Us</h3>
              <div className="flex gap-4">
                <a
                  href="https://zora.co/@noela_zee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-100 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                  title="Zora Profile"
                >
                  <div className="w-5 h-5 flex items-center justify-center font-bold text-xs border border-current rounded-full">
                    Z
                  </div>
                </a>
                <a
                  href="https://warpcast.com/noee.eth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-100 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-colors"
                  title="Farcaster"
                >
                  <Share2 className="w-5 h-5" />
                </a>
                <a
                  href="https://x.com/noela_zee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-100 rounded-lg hover:bg-black hover:text-white transition-colors"
                  title="X (Twitter)"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 text-center">
            <p className="text-xs text-muted-foreground">© 2025 Noela Frame. Built on Base 🔵</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
