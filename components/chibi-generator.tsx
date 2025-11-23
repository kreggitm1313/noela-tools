"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Sparkles, Loader2, Share2, Smartphone, Wallet, Copy, ExternalLink, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/components/wallet-provider"
import { useFarcasterWallet } from "@/components/farcaster-provider"
import sdk from "@farcaster/frame-sdk"
import { ethers } from "ethers"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Textarea } from "@/components/ui/textarea"
import { getAppUrl } from "@/lib/utils"

export function ChibiGenerator() {
  const [prompt, setPrompt] = useState("")
  const [style, setStyle] = useState("cute")
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [hasPaid, setHasPaid] = useState(false)
  const [showMintDialog, setShowMintDialog] = useState(false)
  const { toast } = useToast()
  const { isConnected: isWeb3Connected, connect: connectWeb3, signer: web3Signer } = useWallet()
  const {
    isConnected: isFarcasterConnected,
    connectWallet: connectFarcaster,
    address: farcasterAddress,
  } = useFarcasterWallet()

  const roadmapText = `NOELA DAO OFFICIAL ROADMAP

Phase 1: Genesis
- Community Building & Tool Access
- Exclusive Access to Noela Tools (Sniper, CopyTrade)
- Early Adopter Airdrops

Phase 2: Governance
- DAO Voting Rights for Holders
- Treasury Management
- Proposal Submission System

Phase 3: Expansion
- Revenue Share from Noela Tools Ecosystem
- Cross-chain Expansion (Base, Zora, Optimism)
- Metaverse Integration & 3D Avatars

Phase 4: Utility
- Exclusive Merch Store
- VIP Trading Signals
- Private Alpha Group Access

Join the revolution. Build with Noela.`

  const generateChibi = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please describe the chibi character you want to generate",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGeneratedImage(null)

    try {
      console.log("[v0] Calling generate-chibi API")

      const response = await fetch("/api/generate-chibi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, aspectRatio }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("[v0] API error:", data.error)
        throw new Error(data.error || "Failed to generate chibi")
      }

      if (!data.imageUrl) {
        throw new Error("No image URL received from server")
      }

      console.log("[v0] Generation successful, image URL:", data.imageUrl)
      setGeneratedImage(data.imageUrl)

      toast({
        title: "Generated!",
        description: "Your cute anime chibi has been created!",
      })
    } catch (error) {
      console.error("[v0] Generation error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate chibi. Please try again."

      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = async () => {
    if (!generatedImage) return

    try {
      toast({
        title: "Downloading...",
        description: "Preparing your download...",
      })

      const filename = `noela-chibi-${Date.now()}.png`
      let blob

      try {
        const response = await fetch(
          `/api/download-proxy?url=${encodeURIComponent(generatedImage)}&filename=${filename}`,
        )
        if (!response.ok) throw new Error("Proxy download failed")
        blob = await response.blob()
      } catch (proxyError) {
        console.warn("Proxy download failed, trying direct fetch:", proxyError)
        // Fallback to direct fetch (works if CORS is allowed)
        const response = await fetch(generatedImage, { mode: "cors" })
        if (!response.ok) throw new Error("Direct download failed")
        blob = await response.blob()
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Downloaded!",
        description: "Your chibi has been saved to your device",
      })
    } catch (error) {
      console.error("Download error:", error)
      const newWindow = window.open(generatedImage, "_blank")
      if (newWindow) {
        toast({
          title: "Download Started",
          description: "Image opened in new tab. Please save it manually if download didn't start.",
        })
      } else {
        toast({
          title: "Download Failed",
          description: "Please allow popups or try again.",
          variant: "destructive",
        })
      }
    }
  }

  const shareToFarcaster = () => {
    if (!generatedImage) return

    const encodedImage = encodeURIComponent(generatedImage)
    const appUrl = getAppUrl()
    const nftUrl = `${appUrl}/nft/${encodedImage}`
    const text = encodeURIComponent(
      `Just minted this exclusive NOELA DAO Chibi NFT! 🎨✨\n\n"${prompt}"\n\nJoin the revolution 👇`,
    )

    const farcasterShareUrl = `https://warpcast.com/~/compose?text=${text}&embeds[]=${nftUrl}`
    window.open(farcasterShareUrl, "_blank")

    toast({
      title: "Opening Farcaster",
      description: "Share your NFT with the community!",
    })
  }

  const useRandomPrompt = () => {
    const randomPrompts = [
      "A cute chibi girl with blue hair and sparkly eyes",
      "A futuristic chibi character with holographic accessories",
      "A pastel-colored chibi with galaxy-themed outfit",
      "A kawaii chibi with cat ears and magical powers",
    ]
    const random = randomPrompts[Math.floor(Math.random() * randomPrompts.length)]
    setPrompt(random)
  }

  const mintNFT = async () => {
    if (!generatedImage) return

    // Check if any wallet is connected
    if (!isWeb3Connected && !isFarcasterConnected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to mint this NFT",
        variant: "destructive",
      })
      // Try to connect based on context
      if (sdk.context) {
        connectFarcaster()
      } else {
        connectWeb3()
      }
      return
    }

    setIsMinting(true)

    try {
      // Fee recipient address (User's wallet)
      const recipientAddress = process.env.NEXT_PUBLIC_FEE_RECIPIENT || "0x23684DDbD3C0d0992DbBa0F2c15D75f005B76AD8"
      const mintFee = ethers.parseEther("0.001") // 0.001 ETH fee

      console.log("[v0] Processing payment to:", recipientAddress)

      let tx

      if (isFarcasterConnected && sdk.wallet.ethProvider) {
        console.log("[v0] Using Farcaster wallet provider")
        const provider = new ethers.BrowserProvider(sdk.wallet.ethProvider as any)
        const signer = await provider.getSigner()

        tx = await signer.sendTransaction({
          to: recipientAddress,
          value: mintFee,
        })
      } else if (web3Signer) {
        console.log("[v0] Using Web3 wallet signer")
        tx = await web3Signer.sendTransaction({
          to: recipientAddress,
          value: mintFee,
        })
      } else {
        throw new Error("No active wallet signer found")
      }

      console.log("[v0] Transaction sent:", tx.hash)

      toast({
        title: "Processing Payment...",
        description: "Transaction sent. Waiting for confirmation...",
      })

      await tx.wait()

      console.log("[v0] Transaction confirmed")
      setHasPaid(true)

      toast({
        title: "Payment Successful! 🎉",
        description: "You can now mint this on Zora/OpenSea!",
      })

      setShowMintDialog(true)
    } catch (error: any) {
      console.error("[v0] Payment error:", error)
      toast({
        title: "Payment Failed",
        description: error.message || "Transaction failed",
        variant: "destructive",
      })
    } finally {
      setIsMinting(false)
    }
  }

  const openZoraCreate = () => {
    setShowMintDialog(true)
  }

  const copyAndGoToZora = () => {
    const fullDescription = `${prompt}\n\n${roadmapText}`
    navigator.clipboard.writeText(fullDescription)

    toast({
      title: "Copied to Clipboard!",
      description: "Metadata copied. Paste it in Zora description.",
    })

    window.open("https://zora.co/create", "_blank")
    setShowMintDialog(false)
  }

  return (
    <>
      <Card className="border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="text-purple-900">AI Anime Chibi Generator</CardTitle>
          <CardDescription>Generate cute anime chibi art from your imagination</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <Accordion type="single" collapsible className="w-full border rounded-lg px-4 bg-purple-50/50">
              <AccordionItem value="roadmap" className="border-none">
                <AccordionTrigger className="text-purple-700 font-semibold">
                  <div className="flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    View NOELA DAO Roadmap & Utility
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="whitespace-pre-line text-sm text-gray-600 pl-6 border-l-2 border-purple-200">
                    {roadmapText}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Describe your chibi character</Label>
              <div className="flex gap-2">
                <Input
                  id="prompt"
                  placeholder="e.g., A cute chibi girl with blue hair and sparkly eyes..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={useRandomPrompt} variant="outline" size="icon">
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Style Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger id="style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cute">Cute & Pastel</SelectItem>
                    <SelectItem value="glossy">Glossy & Vibrant</SelectItem>
                    <SelectItem value="soft">Soft & Dreamy</SelectItem>
                    <SelectItem value="futuristic">Futuristic & Neon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ratio">Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger id="ratio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">Square (1:1)</SelectItem>
                    <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                    <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateChibi}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Magic...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Chibi
                </>
              )}
            </Button>

            {/* Result */}
            {generatedImage && (
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden shadow-xl border-2 border-purple-200 bg-gray-100">
                  <img
                    src={generatedImage || "/placeholder.svg"}
                    alt="Generated chibi"
                    className="w-full"
                    onLoad={() => {
                      console.log("[v0] Image loaded successfully")
                      toast({
                        title: "Image Loaded!",
                        description: "Your chibi is ready to download or mint",
                      })
                    }}
                    onError={(e) => {
                      console.error("[v0] Image failed to load:", generatedImage)
                      toast({
                        title: "Image Loading Failed",
                        description: "The image URL might be invalid. Please try generating again.",
                        variant: "destructive",
                      })
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={downloadImage} className="bg-purple-600 hover:bg-purple-700" size="lg">
                    <Smartphone className="w-4 h-4 mr-2 md:hidden" />
                    <Download className="w-4 h-4 mr-2 hidden md:inline" />
                    Download
                  </Button>

                  {!hasPaid ? (
                    <Button
                      onClick={mintNFT}
                      disabled={isMinting}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                      size="lg"
                    >
                      {isMinting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Wallet className="w-4 h-4 mr-2" />
                      )}
                      Unlock Mint (0.001 ETH)
                    </Button>
                  ) : (
                    <Button
                      onClick={openZoraCreate}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      size="lg"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Mint on Zora (OpenSea)
                    </Button>
                  )}
                </div>
                <Button
                  onClick={shareToFarcaster}
                  variant="outline"
                  size="lg"
                  className="w-full border-purple-200 bg-transparent"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share to Farcaster
                </Button>
                <Button onClick={() => setGeneratedImage(null)} variant="ghost" className="w-full">
                  Generate New
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showMintDialog} onOpenChange={setShowMintDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mint Your NOELA DAO NFT</DialogTitle>
            <DialogDescription>
              Copy this official metadata to ensure your NFT is recognized as part of the NOELA DAO ecosystem on
              OpenSea/Zora.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title (Recommended)</Label>
              <div className="flex gap-2">
                <Input value={`Noela Chibi #${Math.floor(Math.random() * 10000)}`} readOnly />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(`Noela Chibi #${Math.floor(Math.random() * 10000)}`)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description & Roadmap</Label>
              <Textarea value={`${prompt}\n\n${roadmapText}`} readOnly className="h-[200px] text-xs font-mono" />
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              onClick={copyAndGoToZora}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Metadata & Go to Zora
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
