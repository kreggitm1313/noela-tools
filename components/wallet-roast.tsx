"use client"

import { useState } from "react"
import { useWallet } from "@/components/wallet-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Flame, Share2, Wallet } from "lucide-react"
import { ethers } from "ethers"
import { useToast } from "@/hooks/use-toast"

// Minimal ERC20 ABI
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]

// Popular Base Tokens to scan
const BASE_TOKENS = [
  {
    symbol: "WETH",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
    cgId: "weth",
  },
  {
    symbol: "USDC",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    cgId: "usd-coin",
  },
  {
    symbol: "BRETT",
    address: "0x532f27101965dd16442E59d40670FaF5eBB142E6",
    decimals: 18,
    cgId: "based-brett",
  },
  {
    symbol: "DEGEN",
    address: "0x4ed4E862860beD51a9570b96d8014731D394fF0D",
    decimals: 18,
    cgId: "degen-base",
  },
  {
    symbol: "TOSHI",
    address: "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4",
    decimals: 18,
    cgId: "toshi",
  },
]

interface TokenData {
  symbol: string
  balance: string
  valueUsd: number
}

export function WalletRoast() {
  const { isConnected, address, provider, connect } = useWallet()
  const { toast } = useToast()
  const [isScanning, setIsScanning] = useState(false)
  const [roast, setRoast] = useState("")
  const [portfolio, setPortfolio] = useState<TokenData[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [ensName, setEnsName] = useState<string | null>(null)

  const scanWallet = async () => {
    if (!isConnected || !address || !provider) {
      toast({
        title: "Connect Wallet First",
        description: "Please connect your wallet to roast it!",
        variant: "destructive",
      })
      connect()
      return
    }

    setIsScanning(true)
    setRoast("")
    setPortfolio([])
    setEnsName(null)

    try {
      let resolvedEns = null
      try {
        resolvedEns = await provider.lookupAddress(address)
        if (resolvedEns) setEnsName(resolvedEns)
      } catch (e) {
        console.log("No ENS found")
      }

      // 1. Fetch ETH Balance
      const ethBalanceWei = await provider.getBalance(address)
      const ethBalance = Number.parseFloat(ethers.formatEther(ethBalanceWei))

      // 2. Fetch Token Balances
      const tokens: TokenData[] = []

      // Initial ETH entry
      let ethPrice = 0

      try {
        // Try to get prices from CoinGecko
        const cgIds = ["ethereum", ...BASE_TOKENS.map((t) => t.cgId)].join(",")
        const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cgIds}&vs_currencies=usd`)
        const prices = await priceRes.json()

        ethPrice = prices.ethereum?.usd || 0

        tokens.push({
          symbol: "ETH",
          balance: ethBalance.toFixed(4),
          valueUsd: ethBalance * ethPrice,
        })

        // Scan other tokens
        for (const token of BASE_TOKENS) {
          try {
            const contract = new ethers.Contract(token.address, ERC20_ABI, provider)
            const balanceWei = await contract.balanceOf(address)

            if (balanceWei > 0) {
              const balance = Number.parseFloat(ethers.formatUnits(balanceWei, token.decimals))
              const price = prices[token.cgId]?.usd || 0

              tokens.push({
                symbol: token.symbol,
                balance: balance.toFixed(2),
                valueUsd: balance * price,
              })
            }
          } catch (e) {
            console.warn(`Failed to fetch ${token.symbol}`, e)
          }
        }
      } catch (e) {
        console.warn("Price fetch failed, using raw balances", e)
        // Fallback without prices
        tokens.push({ symbol: "ETH", balance: ethBalance.toFixed(4), valueUsd: 0 })
      }

      const total = tokens.reduce((acc, t) => acc + t.valueUsd, 0)
      setPortfolio(tokens)
      setTotalValue(total)

      // 3. Send to AI for Roasting
      const response = await fetch("/api/wallet-roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens, totalValue: total, ensName: resolvedEns }),
      })

      if (!response.ok) throw new Error("Roast generation failed")

      const data = await response.json()
      setRoast(data.roast)
    } catch (error) {
      console.error("Roast error:", error)
      toast({
        title: "Roast Failed",
        description: "Noela is taking a break. Try again later.",
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
    }
  }

  const shareRoast = () => {
    if (!roast) return
    const text = encodeURIComponent(`Noela just roasted my wallet! 🔥\n\n"${roast}"\n\nGet roasted too:`)
    const url = "https://noela-toolss.vercel.app"
    window.open(`https://warpcast.com/~/compose?text=${text}&embeds[]=${url}`, "_blank")
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 mx-auto mb-4">
          <Flame className="w-8 h-8 text-white animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600">
          Wallet Roast 🔥
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Ready for emotional damage? Let Noela analyze your on-chain portfolio and roast your life choices.
        </p>
      </div>

      <Card className="border-orange-100 shadow-xl bg-white/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          {!isConnected ? (
            <div className="text-center py-12 space-y-4">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-700">Connect Wallet to Get Roasted</h3>
              <Button onClick={() => connect()} size="lg" className="bg-[#0052FF] hover:bg-[#0041CC]">
                Connect Wallet
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-mono text-sm text-blue-700">
                    {ensName ? ensName : `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                  </span>
                </div>
                <Badge variant="secondary" className="bg-white text-blue-600">
                  Connected
                </Badge>
              </div>

              {!roast && !isScanning && (
                <Button
                  onClick={scanWallet}
                  className="w-full h-12 text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02]"
                >
                  🔥 Roast My Wallet
                </Button>
              )}

              {isScanning && (
                <div className="py-12 text-center space-y-4">
                  <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Analyzing Portfolio...</h3>
                    <p className="text-sm text-muted-foreground">Noela is judging your bags...</p>
                  </div>
                </div>
              )}

              {roast && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
                    <div className="relative bg-white p-6 rounded-xl border border-orange-100 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0">
                          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-2xl">🤬</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-bold text-red-600">Noela says:</h4>
                          <p className="text-lg font-medium text-gray-800 leading-relaxed">"{roast}"</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Summary */}
                  {portfolio.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 text-sm">
                      <p className="font-semibold text-gray-600 mb-2">Scanned Assets:</p>
                      <div className="flex flex-wrap gap-2">
                        {portfolio.map((t) => (
                          <Badge key={t.symbol} variant="outline" className="bg-white">
                            {t.balance} {t.symbol}
                          </Badge>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-400 text-right">Est. Value: ${totalValue.toFixed(2)}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={shareRoast}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share on Warpcast
                    </Button>
                    <Button
                      onClick={scanWallet}
                      variant="outline"
                      className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50 bg-transparent"
                    >
                      Roast Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
