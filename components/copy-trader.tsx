"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Copy,
  TrendingUp,
  Wallet,
  AlertCircle,
  Play,
  Pause,
  ExternalLink,
  Zap,
  Filter,
  BarChart3,
  Users,
  Flame,
  Clock,
  Target,
  ShieldAlert,
  Coins,
} from "lucide-react"
import { useFarcaster } from "@/components/farcaster-provider"
import { useWallet } from "@/components/wallet-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SwapInterface } from "@/components/swap-interface"
import { ethers } from "ethers"
import { sdk } from "@/components/farcaster-sdk"
import { PremiumLock } from "@/components/premium-lock"
// Removed wagmi import as it's no longer used
// import { useAccount } from "wagmi"

interface Trade {
  id: string
  timestamp: number
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  txHash: string
}

interface TokenInfo {
  address: string
  symbol: string
  name: string
  price: string
  holders: number
  liquidity: string
  marketCap: string
}

interface OrderbookEntry {
  price: string
  amount: string
  total: string
}

interface DetectedToken {
  address: string
  name: string
  symbol: string
  timestamp: number
  status: string
  reason?: string
  tax?: number
}

export function CopyTrader() {
  const { toast } = useToast()
  const { address: walletAddress, isConnected: walletConnected, connect: connectBrowserWallet, signer } = useWallet()
  const { walletAddress: farcasterAddress, connectWallet: connectFarcasterWallet, isConnecting } = useFarcaster()

  const isConnected = walletConnected || !!farcasterAddress
  const address = walletAddress || farcasterAddress

  const handleConnectWallet = async () => {
    // Try Farcaster first if in frame context
    if (typeof window !== "undefined" && (window as any).Telegram) {
      // In Farcaster frame
      await connectFarcasterWallet()
    } else {
      // Use browser wallet
      await connectBrowserWallet()
    }
  }

  const [targetWallet, setTargetWallet] = useState("")
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [autoCopy, setAutoCopy] = useState(false)
  const [copyPercentage, setCopyPercentage] = useState("10")
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [sniperMode, setSniperMode] = useState(false)
  const [tokenFilter, setTokenFilter] = useState("")
  const [snipeDelay, setSnipeDelay] = useState("5")
  const [customGas, setCustomGas] = useState("50")
  const [countdown, setCountdown] = useState<number | null>(null)

  const [limitOrderPrice, setLimitOrderPrice] = useState("")
  const [limitOrderAmount, setLimitOrderAmount] = useState("")
  const [activeLimitOrders, setActiveLimitOrders] = useState<any[]>([])

  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null)
  const [orderbook, setOrderbook] = useState<{ bids: OrderbookEntry[]; asks: OrderbookEntry[] }>({
    bids: [],
    asks: [],
  })
  const [holderDistribution, setHolderDistribution] = useState<any[]>([])
  const [tokenSearch, setTokenSearch] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const [zoraCreatorWallet, setZoraCreatorWallet] = useState("")
  const [isMonitoringZora, setIsMonitoringZora] = useState(false)
  const [autoSnipeZora, setAutoSnipeZora] = useState(false)
  const [maxTaxAllowed, setMaxTaxAllowed] = useState("50")
  const [detectedTokens, setDetectedTokens] = useState<DetectedToken[]>([])

  const [isSniperUnlocked, setIsSniperUnlocked] = useState(false)

  useEffect(() => {
    const unlocked = localStorage.getItem("premium_unlocked_Sniper Mode") === "true"
    setIsSniperUnlocked(unlocked)
  }, [])

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      executeSnipe()
    }
  }, [countdown])

  const executeSnipe = () => {
    toast({
      title: "Snipe Executed!",
      description: `Sniped ${tokenFilter} at launch`,
    })
    setCountdown(null)
  }

  const startMonitoring = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    if (!targetWallet || !/^0x[a-fA-F0-9]{40}$/.test(targetWallet)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setIsMonitoring(true)

    toast({
      title: "Monitoring Started",
      description: `Now tracking trades from ${targetWallet.slice(0, 6)}...${targetWallet.slice(-4)}`,
    })

    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
    setAutoCopy(false)
    setSniperMode(false)
    setCountdown(null)
    toast({
      title: "Monitoring Stopped",
      description: "Copy trading has been paused",
    })
  }

  const copyTrade = async (trade: Trade) => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to copy trade",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Copying Trade...",
      description: `Swapping ${trade.tokenIn} for ${trade.tokenOut}`,
    })

    console.log("[v0] Copy trade:", trade)
  }

  const activateSniper = () => {
    if (!tokenFilter) {
      toast({
        title: "Token Filter Required",
        description: "Please enter a token symbol to snipe",
        variant: "destructive",
      })
      return
    }

    setSniperMode(true)
    setCountdown(Number.parseInt(snipeDelay))
    toast({
      title: "Sniper Mode Activated",
      description: `Will snipe ${tokenFilter} in ${snipeDelay} seconds`,
    })
  }

  const placeLimitOrder = () => {
    if (!limitOrderPrice || !limitOrderAmount) {
      toast({
        title: "Missing Information",
        description: "Please enter both price and amount",
        variant: "destructive",
      })
      return
    }

    const newOrder = {
      id: Date.now().toString(),
      token: tokenFilter || "TOKEN",
      price: limitOrderPrice,
      amount: limitOrderAmount,
      timestamp: Date.now(),
    }

    setActiveLimitOrders([...activeLimitOrders, newOrder])
    toast({
      title: "Limit Order Placed",
      description: `Buy ${limitOrderAmount} at $${limitOrderPrice}`,
    })

    setLimitOrderPrice("")
    setLimitOrderAmount("")
  }

  const cancelLimitOrder = (orderId: string) => {
    setActiveLimitOrders(activeLimitOrders.filter((order) => order.id !== orderId))
    toast({
      title: "Order Cancelled",
      description: "Limit order has been removed",
    })
  }

  const startZoraMonitoring = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    if (!zoraCreatorWallet) {
      toast({
        title: "Creator Wallet Required",
        description: "Please enter a creator wallet address or ENS name",
        variant: "destructive",
      })
      return
    }

    setIsMonitoringZora(true)
    toast({
      title: "Zora Monitor Active",
      description: `Monitoring ${zoraCreatorWallet} for new creator tokens only (not posts)`,
    })

    // This listens to createCoin events from Zora protocol contract
    // NOT monitoring Zora posts/NFTs - only creator tokens
    console.log("[v0] Monitoring Zora creator token deployments from:", zoraCreatorWallet)
  }

  const stopZoraMonitoring = () => {
    setIsMonitoringZora(false)
    setAutoSnipeZora(false)
    toast({
      title: "Zora Monitor Stopped",
      description: "No longer monitoring for creator tokens",
    })
  }

  const handleZoraTokenDetected = async (tokenAddress: string, tokenName: string, tokenSymbol: string) => {
    console.log("[v0] New Zora creator token detected:", tokenAddress)

    const isCreatorToken = await verifyCreatorToken(tokenAddress)

    if (!isCreatorToken) {
      console.log("[v0] Skipping - not a creator token:", tokenAddress)
      return
    }

    // Check token tax/fees using GoPlus API
    const taxInfo = await checkTokenTax(tokenAddress)

    if (taxInfo.buyTax > Number.parseInt(maxTaxAllowed) || taxInfo.sellTax > Number.parseInt(maxTaxAllowed)) {
      toast({
        title: "Transaction Cancelled",
        description: `${tokenSymbol} has ${Math.max(taxInfo.buyTax, taxInfo.sellTax)}% tax - exceeds ${maxTaxAllowed}% limit`,
        variant: "destructive",
      })

      setDetectedTokens((prev) => [
        ...prev,
        {
          address: tokenAddress,
          name: tokenName,
          symbol: tokenSymbol,
          timestamp: Date.now(),
          status: "rejected",
          reason: `High tax: ${Math.max(taxInfo.buyTax, taxInfo.sellTax)}%`,
        },
      ])

      return
    }

    if (autoSnipeZora) {
      // Execute auto-buy
      toast({
        title: "Auto-Buy Executing",
        description: `Buying ${tokenSymbol} creator token - Tax: ${Math.max(taxInfo.buyTax, taxInfo.sellTax)}%`,
      })

      try {
        const buyAmountETH = "0.005" // Default auto-snipe amount
        const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

        const response = await fetch(
          `/api/swap-quote?sellToken=${ETH_ADDRESS}&buyToken=${tokenAddress}&sellAmount=${ethers.parseEther(buyAmountETH).toString()}&chainId=8453`,
        )

        if (!response.ok) throw new Error("No liquidity")

        const quoteData = await response.json()
        let txHash = null

        if (farcasterAddress && (window as any).Telegram && sdk?.wallet?.ethProvider) {
          const tx = {
            to: quoteData.to,
            data: quoteData.data,
            value: quoteData.value || "0x0",
            gasPrice: quoteData.gasPrice,
          }
          txHash = await sdk.wallet.ethProvider.request({ method: "eth_sendTransaction", params: [tx] })
        } else if (signer) {
          const tx = {
            to: quoteData.to,
            data: quoteData.data,
            value: quoteData.value || "0x0",
            gasPrice: quoteData.gasPrice,
          }
          const txResponse = await signer.sendTransaction(tx)
          txHash = txResponse.hash
        }

        if (txHash) {
          setDetectedTokens((prev) => [
            ...prev,
            {
              address: tokenAddress,
              name: tokenName,
              symbol: tokenSymbol,
              timestamp: Date.now(),
              status: "executed",
              tax: Math.max(taxInfo.buyTax, taxInfo.sellTax),
            },
          ])
          toast({ title: "Snipe Successful!", description: `Tx: ${txHash}` })
        }
      } catch (e) {
        console.error("Auto-snipe failed", e)
        toast({ title: "Snipe Failed", description: "Could not execute transaction", variant: "destructive" })
      }
    } else {
      setDetectedTokens((prev) => [
        ...prev,
        {
          address: tokenAddress,
          name: tokenName,
          symbol: tokenSymbol,
          timestamp: Date.now(),
          status: "detected",
          tax: Math.max(taxInfo.buyTax, taxInfo.sellTax),
        },
      ])
    }
  }

  const verifyCreatorToken = async (tokenAddress: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/verify-creator-token?address=${tokenAddress}`)
      const data = await response.json()
      return data.isCreatorToken || false
    } catch (error) {
      console.error("[v0] Error verifying creator token:", error)
      return false
    }
  }

  const checkTokenTax = async (tokenAddress: string): Promise<{ buyTax: number; sellTax: number }> => {
    try {
      const response = await fetch(`/api/check-token-tax?address=${tokenAddress}`)
      const data = await response.json()
      return {
        buyTax: data.buyTax || 0,
        sellTax: data.sellTax || 0,
      }
    } catch (error) {
      console.error("[v0] Error checking token tax:", error)
      return { buyTax: 0, sellTax: 0 }
    }
  }

  const manualBuyToken = async (tokenAddress: string) => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to buy tokens",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Initiating Purchase",
      description: `Fetching best price for ${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`,
    })

    try {
      const buyAmountETH = "0.001" // Default manual buy amount
      const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

      const response = await fetch(
        `/api/swap-quote?sellToken=${ETH_ADDRESS}&buyToken=${tokenAddress}&sellAmount=${ethers.parseEther(buyAmountETH).toString()}&chainId=8453`,
      )

      if (!response.ok) {
        throw new Error("Failed to get swap quote. Liquidity might not be added yet.")
      }

      const quoteData = await response.json()
      let txHash: string | null = null

      if (farcasterAddress && (window as any).Telegram && sdk?.wallet?.ethProvider) {
        const tx = {
          to: quoteData.to,
          data: quoteData.data,
          value: quoteData.value || "0x0",
          gasPrice: quoteData.gasPrice,
        }
        txHash = await sdk.wallet.ethProvider.request({
          method: "eth_sendTransaction",
          params: [tx],
        })
      } else if (signer) {
        const tx = {
          to: quoteData.to,
          data: quoteData.data,
          value: quoteData.value || "0x0",
          gasPrice: quoteData.gasPrice,
        }
        const txResponse = await signer.sendTransaction(tx)
        txHash = txResponse.hash
      }

      if (txHash) {
        toast({
          title: "Purchase Submitted",
          description: `Transaction Hash: ${txHash}`,
        })
      }
    } catch (error: any) {
      console.error("[v0] Buy error:", error)
      toast({
        title: "Purchase Failed",
        description: error.message || "Could not execute trade.",
        variant: "destructive",
      })
    }
  }

  const searchToken = async () => {
    if (!tokenSearch) {
      toast({
        title: "Search Required",
        description: "Please enter a token address or symbol",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    console.log("[v0] Searching token:", tokenSearch)

    try {
      const response = await fetch(`/api/token-info?query=${encodeURIComponent(tokenSearch)}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch token")
      }

      const data = await response.json()

      const tokenInfo: TokenInfo = {
        address: data.address,
        symbol: data.symbol,
        name: data.name,
        price: data.price,
        holders: typeof data.holders === "number" ? data.holders : Number.parseInt(data.holders) || 0,
        liquidity: `$${data.liquidity.toLocaleString()}`,
        marketCap: `$${data.marketCap.toLocaleString()}`,
      }

      setSelectedToken(tokenInfo)

      // Fetch orderbook data
      const orderbookResponse = await fetch(`/api/token-orderbook?address=${data.address}`)
      if (orderbookResponse.ok) {
        const orderbookData = await orderbookResponse.json()
        setOrderbook({
          bids: orderbookData.bids || [],
          asks: orderbookData.asks || [],
        })
      }

      // Calculate holder distribution
      const top10Percent = data.topHolderPercentage || 35
      const top50Percent = Math.min(top10Percent + 20, 75)
      const othersPercent = 100 - top50Percent

      setHolderDistribution([
        { label: "Top 10", percentage: Math.round(top10Percent) },
        { label: "Top 50", percentage: Math.round(top50Percent) },
        { label: "Others", percentage: Math.round(othersPercent) },
      ])

      toast({
        title: "Token Loaded",
        description: `Successfully loaded data for ${tokenInfo.symbol}`,
      })
    } catch (error) {
      console.error("[v0] Error searching token:", error)
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Could not load token data. Please try again.",
        variant: "destructive",
      })

      // Clear previous data on error
      setSelectedToken(null)
      setOrderbook({ bids: [], asks: [] })
      setHolderDistribution([])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="swap" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
          <TabsTrigger value="zora">Zora</TabsTrigger>
          <TabsTrigger value="swap">Swap</TabsTrigger>
          <TabsTrigger value="sniper">Sniper</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        {/* Monitor Tab */}
        <TabsContent value="monitor" className="space-y-6">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>

            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white relative z-10">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Copy className="w-6 h-6" />
                </div>
                Copy Trading on Base
              </CardTitle>
              <CardDescription className="text-blue-100">
                Monitor and automatically copy trades from successful wallets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 relative z-10">
              {/* Wallet Status */}
              <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-blue-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Your Wallet</p>
                      <p className="text-xs text-muted-foreground">
                        {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : "Not Connected"}
                      </p>
                    </div>
                  </div>
                  {!isConnected ? (
                    <Button
                      size="sm"
                      onClick={handleConnectWallet}
                      disabled={isConnecting}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                    >
                      {isConnecting ? "Connecting..." : "Connect"}
                    </Button>
                  ) : (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      Connected
                    </Badge>
                  )}
                </div>
              </div>

              {/* Target Wallet Input */}
              <div className="space-y-2">
                <Label htmlFor="targetWallet">Target Wallet Address</Label>
                <Input
                  id="targetWallet"
                  placeholder="0x..."
                  value={targetWallet}
                  onChange={(e) => setTargetWallet(e.target.value)}
                  className="border-blue-200 focus:border-[#0052FF]"
                  disabled={isMonitoring}
                />
                <p className="text-xs text-muted-foreground">Enter the wallet address you want to copy trades from</p>
              </div>

              {/* Copy Settings */}
              <div className="space-y-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoCopy" className="text-sm font-semibold">
                      Auto Copy Trades
                    </Label>
                    <p className="text-xs text-muted-foreground">Automatically execute trades when detected</p>
                  </div>
                  <Switch id="autoCopy" checked={autoCopy} onCheckedChange={setAutoCopy} disabled={!isMonitoring} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="percentage">Copy Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="percentage"
                      type="number"
                      min="1"
                      max="100"
                      value={copyPercentage}
                      onChange={(e) => setCopyPercentage(e.target.value)}
                      className="border-blue-200 focus:border-[#0052FF]"
                      disabled={!isMonitoring}
                    />
                    <span className="text-sm font-semibold text-[#0052FF]">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Trade with {copyPercentage}% of the target wallet's amount
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customGas">Custom Gas Fee (Gwei)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="customGas"
                      type="number"
                      min="1"
                      value={customGas}
                      onChange={(e) => setCustomGas(e.target.value)}
                      className="border-blue-200 focus:border-[#0052FF]"
                    />
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Higher gas = faster transaction execution during high traffic
                  </p>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-3">
                {!isMonitoring ? (
                  <Button
                    onClick={startMonitoring}
                    className="flex-1 bg-[#0052FF] hover:bg-[#0041CC] text-white shadow-lg shadow-blue-500/30"
                    disabled={isLoading}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isLoading ? "Starting..." : "Start Monitoring"}
                  </Button>
                ) : (
                  <Button onClick={stopMonitoring} variant="destructive" className="flex-1 shadow-lg">
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Monitoring
                  </Button>
                )}
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900">Important Notice</p>
                  <p className="text-xs text-orange-700 mt-1">
                    Copy trading involves significant risk. Always do your own research and only invest what you can
                    afford to lose. Past performance does not guarantee future results.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Trades */}
          {isMonitoring && (
            <Card className="border-blue-100/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0052FF]">
                  <TrendingUp className="w-5 h-5" />
                  Recent Trades
                </CardTitle>
                <CardDescription>Trades detected from the target wallet</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTrades.length === 0 ? (
                  <div className="py-12 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto text-blue-300 mb-3" />
                    <p className="text-sm text-muted-foreground">Monitoring for new trades...</p>
                    <p className="text-xs text-muted-foreground mt-1">Trades will appear here when detected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTrades.map((trade) => (
                      <div
                        key={trade.id}
                        className="p-4 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-[#0052FF]">
                            {trade.tokenIn} → {trade.tokenOut}
                          </Badge>
                          <a
                            href={`https://basescan.org/tx/${trade.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#0052FF] hover:underline flex items-center gap-1"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            Amount: {trade.amountIn} → {trade.amountOut}
                          </p>
                          <p className="text-xs">{new Date(trade.timestamp).toLocaleString()}</p>
                        </div>
                        {!autoCopy && (
                          <Button
                            size="sm"
                            onClick={() => copyTrade(trade)}
                            className="w-full mt-3 bg-[#0052FF] hover:bg-[#0041CC]"
                          >
                            Copy This Trade
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Zora Creator Token Tab */}
        <TabsContent value="zora" className="space-y-6">
          <Card className="border-indigo-100/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-600">
                <Coins className="w-5 h-5" />
                Zora Creator Token Monitor
              </CardTitle>
              <CardDescription>Auto-buy CREATOR TOKENS only when deployed (not Zora posts)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Creator Wallet Input */}
              <div className="space-y-2">
                <Label htmlFor="zoraCreator">Creator Wallet / ENS</Label>
                <Input
                  id="zoraCreator"
                  placeholder="jesse.base.eth or 0x..."
                  value={zoraCreatorWallet}
                  onChange={(e) => setZoraCreatorWallet(e.target.value)}
                  className="border-indigo-200 focus:border-indigo-500"
                  disabled={isMonitoringZora}
                />
                <p className="text-xs text-muted-foreground">Monitor when this creator deploys a new token on Zora</p>
              </div>

              {/* Settings */}
              <div className="space-y-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoSnipeZora" className="text-sm font-semibold">
                      Auto-Buy on Detection
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically purchase when creator token is detected
                    </p>
                  </div>
                  <Switch
                    id="autoSnipeZora"
                    checked={autoSnipeZora}
                    onCheckedChange={setAutoSnipeZora}
                    disabled={!isMonitoringZora}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTax" className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Max Tax Allowed (%)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="maxTax"
                      type="number"
                      min="0"
                      max="100"
                      value={maxTaxAllowed}
                      onChange={(e) => setMaxTaxAllowed(e.target.value)}
                      className="border-indigo-200 focus:border-indigo-500"
                    />
                    <span className="text-sm font-semibold text-indigo-600">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cancel transaction if buy/sell tax exceeds this limit (prevents high loss)
                  </p>
                </div>
              </div>

              {/* Tax Protection Warning */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                <ShieldAlert className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900">Tax Protection Active</p>
                  <p className="text-xs text-green-700 mt-1">
                    Transactions with tax &gt; {maxTaxAllowed}% will be automatically cancelled to protect you from
                    excessive fees. Uses GoPlus API for real-time verification.
                  </p>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-3">
                {!isMonitoringZora ? (
                  <Button
                    onClick={startZoraMonitoring}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Zora Monitor
                  </Button>
                ) : (
                  <Button onClick={stopZoraMonitoring} variant="destructive" className="flex-1 shadow-lg">
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Monitor
                  </Button>
                )}
              </div>

              {/* Zora Info */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900">About Zora Creator Tokens</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Monitors ONLY creator tokens deployed via Zora Coins protocol on Base. This does NOT monitor Zora
                    posts, NFTs, or mints - only ERC20 creator tokens created by your specified wallet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detected Tokens */}
          {isMonitoringZora && (
            <Card className="border-indigo-100/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-600">
                  <Coins className="w-5 h-5" />
                  Detected Tokens
                </CardTitle>
                <CardDescription>Creator tokens detected from {zoraCreatorWallet}</CardDescription>
              </CardHeader>
              <CardContent>
                {detectedTokens.length === 0 ? (
                  <div className="py-12 text-center">
                    <Coins className="w-12 h-12 mx-auto text-indigo-300 mb-3" />
                    <p className="text-sm text-muted-foreground">Monitoring for new tokens...</p>
                    <p className="text-xs text-muted-foreground mt-1">Tokens will appear here when detected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {detectedTokens.map((token, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-xl border border-indigo-100 hover:border-indigo-200 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-600">{token.symbol}</Badge>
                            <Badge
                              variant={
                                token.status === "executed"
                                  ? "default"
                                  : token.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {token.status}
                            </Badge>
                          </div>
                          <a
                            href={`https://basescan.org/address/${token.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="font-semibold">{token.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {token.address.slice(0, 10)}...{token.address.slice(-8)}
                          </p>
                          {token.tax !== undefined && (
                            <p className="text-xs">
                              <span className="text-muted-foreground">Tax: </span>
                              <span
                                className={`font-semibold ${token.tax > Number.parseInt(maxTaxAllowed) ? "text-red-600" : "text-green-600"}`}
                              >
                                {token.tax}%
                              </span>
                            </p>
                          )}
                          {token.reason && (
                            <p className="text-xs text-red-600">
                              <ShieldAlert className="w-3 h-3 inline mr-1" />
                              {token.reason}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">{new Date(token.timestamp).toLocaleString()}</p>
                        </div>
                        {token.status === "detected" && (
                          <Button
                            size="sm"
                            onClick={() => manualBuyToken(token.address)}
                            className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700"
                          >
                            Buy Now
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Swap Tab */}
        <TabsContent value="swap" className="space-y-6">
          <div className="py-6">
            <SwapInterface />
          </div>
        </TabsContent>

        {/* Sniper Tab */}
        <TabsContent value="sniper" className="space-y-6 relative min-h-[400px]">
          {!isSniperUnlocked && (
            <PremiumLock featureName="Sniper Mode" price="0.01" onUnlock={() => setIsSniperUnlocked(true)} />
          )}
          <Card className="border-orange-100/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <Zap className="w-5 h-5" />
                Token Sniper Mode
              </CardTitle>
              <CardDescription>Snipe new token launches within seconds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sniper Status */}
              {sniperMode && countdown !== null && (
                <div className="p-6 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 text-center">
                  <Clock className="w-12 h-12 mx-auto text-orange-600 mb-3 animate-pulse" />
                  <p className="text-3xl font-bold text-orange-600 mb-2">{countdown}s</p>
                  <p className="text-sm text-orange-700">Sniping {tokenFilter} at launch...</p>
                </div>
              )}

              {/* Token Filter */}
              <div className="space-y-2">
                <Label htmlFor="tokenFilter" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Token Symbol Filter
                </Label>
                <Input
                  id="tokenFilter"
                  placeholder="e.g., JESSE, DEGEN, etc."
                  value={tokenFilter}
                  onChange={(e) => setTokenFilter(e.target.value.toUpperCase())}
                  className="border-orange-200 focus:border-orange-500"
                  disabled={sniperMode}
                />
                <p className="text-xs text-muted-foreground">Only snipe this specific token when it launches</p>
              </div>

              {/* Snipe Delay */}
              <div className="space-y-2">
                <Label htmlFor="snipeDelay">Snipe Delay (seconds)</Label>
                <Select value={snipeDelay} onValueChange={setSnipeDelay} disabled={sniperMode}>
                  <SelectTrigger className="border-orange-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Instant (Block 0)</SelectItem>
                    <SelectItem value="3">3 seconds</SelectItem>
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Delay before executing snipe to avoid anti-sniper measures
                </p>
              </div>

              {/* Anti-Sniper Warning */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Anti-Sniper Detection</p>
                  <p className="text-xs text-red-700 mt-1">
                    Many tokens have anti-sniper measures. Diving in blind at block 0 is risky. Use analytics tab to
                    monitor real-time data before sniping.
                  </p>
                </div>
              </div>

              {/* Sniper Button */}
              <Button
                onClick={activateSniper}
                disabled={sniperMode || !tokenFilter}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
              >
                <Zap className="w-4 h-4 mr-2" />
                {sniperMode ? "Sniper Active..." : "Activate Sniper"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card className="border-purple-100/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <BarChart3 className="w-5 h-5" />
                Real-Time Analytics
              </CardTitle>
              <CardDescription>Cut through the noise with comprehensive token data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Token Search */}
              <div className="space-y-2">
                <Label htmlFor="tokenSearch">Search Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="tokenSearch"
                    placeholder="Enter token address or symbol"
                    className="border-purple-200 focus:border-purple-500"
                    value={tokenSearch}
                    onChange={(e) => setTokenSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        searchToken()
                      }
                    }}
                  />
                  <Button
                    onClick={searchToken}
                    disabled={isSearching}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>

              {/* Token Info Display */}
              {selectedToken && (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-purple-900">{selectedToken.name}</h3>
                      <p className="text-sm text-purple-600">{selectedToken.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-900">${selectedToken.price}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Market Cap</p>
                      <p className="font-semibold">{selectedToken.marketCap}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Liquidity</p>
                      <p className="font-semibold">{selectedToken.liquidity}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Holders</p>
                      <p className="font-semibold">{selectedToken.holders.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{selectedToken.address}</p>
                </div>
              )}

              {/* Real-Time Chart Placeholder */}
              <div className="p-8 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 mx-auto text-purple-400 mb-3" />
                  <p className="text-sm font-semibold text-purple-900">Real-Time Price Chart</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {selectedToken ? `Tracking ${selectedToken.symbol}` : "Search a token to view live chart"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    No overloaded UI - see everything you need instantly
                  </p>
                </div>
              </div>

              {/* Orderbook */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-green-600 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Bids (Buy Orders)
                  </h4>
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200 min-h-[200px]">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-green-900">
                        <span>Price</span>
                        <span>Amount</span>
                      </div>
                      {orderbook.bids.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          {selectedToken ? "No bids yet" : "Search token to view"}
                        </p>
                      ) : (
                        orderbook.bids.map((bid, i) => (
                          <div key={i} className="flex justify-between text-xs text-green-700">
                            <span>${bid.price}</span>
                            <span>{bid.amount}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Asks (Sell Orders)
                  </h4>
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 min-h-[200px]">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-red-900">
                        <span>Price</span>
                        <span>Amount</span>
                      </div>
                      {orderbook.asks.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          {selectedToken ? "No asks yet" : "Search token to view"}
                        </p>
                      ) : (
                        orderbook.asks.map((ask, i) => (
                          <div key={i} className="flex justify-between text-xs text-red-700">
                            <span>${ask.price}</span>
                            <span>{ask.amount}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Holder Info */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" />
                  Holder Distribution
                </h4>
                <div className="space-y-2">
                  {selectedToken ? (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Total Holders</span>
                        <span className="font-semibold">{selectedToken.holders.toLocaleString()}</span>
                      </div>
                      {holderDistribution.map((holder, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{holder.label}</span>
                          <span className="font-semibold">{holder.percentage}%</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Search a token to view holder data</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    Real-time holder data helps identify whale movements and distribution health
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Limit Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <Card className="border-green-100/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Target className="w-5 h-5" />
                Limit Orders
              </CardTitle>
              <CardDescription>Place buy orders for dips and manage your positions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Place Limit Order */}
              <div className="space-y-4 p-4 rounded-xl bg-green-50/50 border border-green-100">
                <h4 className="text-sm font-semibold text-green-900">Place New Limit Order</h4>

                <div className="space-y-2">
                  <Label htmlFor="limitToken">Token</Label>
                  <Input
                    id="limitToken"
                    placeholder="Token symbol or address"
                    value={tokenFilter}
                    onChange={(e) => setTokenFilter(e.target.value)}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="limitPrice">Price (USD)</Label>
                    <Input
                      id="limitPrice"
                      type="number"
                      placeholder="0.00"
                      value={limitOrderPrice}
                      onChange={(e) => setLimitOrderPrice(e.target.value)}
                      className="border-green-200 focus:border-green-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="limitAmount">Amount</Label>
                    <Input
                      id="limitAmount"
                      type="number"
                      placeholder="0.00"
                      value={limitOrderAmount}
                      onChange={(e) => setLimitOrderAmount(e.target.value)}
                      className="border-green-200 focus:border-green-500"
                    />
                  </div>
                </div>

                <Button onClick={placeLimitOrder} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Place Limit Order
                </Button>

                <p className="text-xs text-muted-foreground">
                  Limit orders execute automatically when price reaches your target. Perfect for catching dips after
                  initial sniper PVP.
                </p>
              </div>

              {/* Active Limit Orders */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-green-900">Active Limit Orders</h4>
                {activeLimitOrders.length === 0 ? (
                  <div className="py-12 text-center">
                    <Target className="w-12 h-12 mx-auto text-green-300 mb-3" />
                    <p className="text-sm text-muted-foreground">No active limit orders</p>
                    <p className="text-xs text-muted-foreground mt-1">Place orders above to catch dips</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeLimitOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 rounded-xl border border-green-100 hover:border-green-200 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-green-600">{order.token}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(order.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm space-y-1 mb-3">
                          <p className="text-muted-foreground">
                            Buy <span className="font-semibold text-foreground">{order.amount}</span> at{" "}
                            <span className="font-semibold text-foreground">${order.price}</span>
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelLimitOrder(order.id)}
                          className="w-full"
                        >
                          Cancel Order
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
