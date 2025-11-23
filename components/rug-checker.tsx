"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ShieldCheck, ShieldAlert, Share2, Search, Lock, Unlock, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

interface SecurityData {
  token_name: string
  token_symbol: string
  is_honeypot: string // "1" or "0"
  buy_tax: string
  sell_tax: string
  is_open_source: string // "1" or "0"
  lp_holder_count: string
  is_proxy: string // "1" or "0"
  owner_address: string
  creator_address: string
  lp_total_supply: string
}

export function RugChecker() {
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ analysis: string; data: SecurityData } | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const { toast } = useToast()

  const handleScan = async () => {
    if (!address || !address.startsWith("0x") || address.length !== 42) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Base contract address (starts with 0x...)",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/rug-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to scan token")
      }

      setResult(data)
    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const shareResult = () => {
    if (!result) return
    const text = encodeURIComponent(
      `🛡️ Noela Rug Check: ${result.data.token_name || "Unknown Token"}\n\nVerdict: ${result.analysis.slice(0, 100)}...\n\nCheck securely on Noela Frame! 🔵`,
    )
    const url = encodeURIComponent("https://noela-toolss.vercel.app")
    window.open(`https://warpcast.com/~/compose?text=${text}&embeds[]=${url}`, "_blank")
  }

  const isSafe =
    result && result.data.is_honeypot === "0" && Number(result.data.buy_tax) < 10 && Number(result.data.sell_tax) < 10

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2 relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 flex items-center justify-center gap-2">
          Waifu Security 🛡️
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-muted-foreground hover:text-emerald-500 transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        </h2>

        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mt-2 text-sm text-emerald-800 text-left relative">
                <p className="font-bold mb-1">Huh? You doubt me? 💢</p>
                <p>
                  I use <span className="font-bold">GoPlus Security API</span> (the industry gold standard) AND my own{" "}
                  <span className="font-bold">AI Brain</span> to scan the smart contract code directly on-chain!
                </p>
                <p className="mt-2">
                  I check for Honeypots, Hidden Taxes, and Liquidity Locks that human eyes miss. If you trust a random
                  influencer more than on-chain data... enjoy getting rugged, Baka! 😤
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-sm text-muted-foreground">Paste a token address to check if it's safe or a rug pull.</p>
      </div>

      <Card className="border-emerald-100/50 shadow-lg shadow-emerald-500/5 overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Paste token address (0x...)"
                className="pl-9 border-emerald-100 focus-visible:ring-emerald-500"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <Button
              onClick={handleScan}
              disabled={isLoading}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-md shadow-emerald-500/20"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Verdict Card */}
            <Card
              className={`border-0 shadow-xl overflow-hidden ${
                isSafe
                  ? "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30"
                  : "bg-gradient-to-br from-red-500 to-orange-600 shadow-red-500/30"
              }`}
            >
              <CardContent className="p-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    {isSafe ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 opacity-90">
                      <h3 className="text-lg font-bold">Noela's Analysis</h3>
                      {result.data.token_name && (
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-sm font-medium">
                          {result.data.token_name} ({result.data.token_symbol})
                        </span>
                      )}
                    </div>
                    <p className="text-lg sm:text-xl font-medium leading-relaxed">"{result.analysis}"</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-emerald-100/50 shadow-sm">
                <CardContent className="p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Honeypot Check</p>
                  <div
                    className={`flex items-center gap-2 font-bold ${result.data.is_honeypot === "1" ? "text-red-500" : "text-green-500"}`}
                  >
                    {result.data.is_honeypot === "1" ? (
                      <>
                        <ShieldAlert className="w-4 h-4" /> DETECTED
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" /> CLEARED
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-100/50 shadow-sm">
                <CardContent className="p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Taxes (Buy/Sell)</p>
                  <p
                    className={`font-bold ${
                      Number(result.data.buy_tax) > 10 || Number(result.data.sell_tax) > 10
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {Number(result.data.buy_tax * 100).toFixed(1)}% / {Number(result.data.sell_tax * 100).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="border-emerald-100/50 shadow-sm">
                <CardContent className="p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Contract Source</p>
                  <div className="flex items-center gap-2 font-bold text-blue-600">
                    {result.data.is_open_source === "1" ? (
                      <>
                        <Unlock className="w-4 h-4" /> VERIFIED
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" /> UNVERIFIED
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-100/50 shadow-sm">
                <CardContent className="p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase">LP Holders</p>
                  <p className="font-bold text-gray-700">{result.data.lp_holder_count || "Unknown"}</p>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={shareResult}
              className="w-full h-12 text-lg font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 rounded-xl"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share Alert to Farcaster
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
