"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowDown, Settings, Info, RefreshCw, Search, ChevronDown, Route, Heart } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import { useFarcaster } from "@/components/farcaster-provider"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ethers } from "ethers"
import { sdk } from "@/components/farcaster-sdk" // Assuming Farcaster SDK is imported here

// Common Base tokens
const DEFAULT_TOKENS = [
  {
    symbol: "ETH",
    name: "Ethereum",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    logo: "🔷",
    decimals: 18,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    logo: "💵",
    decimals: 6,
  },
  {
    symbol: "DEGEN",
    name: "Degen",
    address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed",
    logo: "🎩",
    decimals: 18,
  },
  {
    symbol: "BRETT",
    name: "Brett",
    address: "0x532f27101965dd16442E59d40670FaF5eBB142E4",
    logo: "🧢",
    decimals: 18,
  },
  {
    symbol: "TOSHI",
    name: "Toshi",
    address: "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4",
    logo: "🐱",
    decimals: 18,
  },
]

interface Token {
  symbol: string
  name: string
  address: string
  logo: string
  decimals: number // Added decimals to interface
  balance?: string
  price?: number
}

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]

export function SwapInterface() {
  const { address: walletAddress, isConnected: walletConnected, connect, signer } = useWallet()
  const { walletAddress: farcasterAddress, connectWallet: connectFarcaster, isFarcasterContext } = useFarcaster()

  const isConnected = walletConnected || !!farcasterAddress
  const address = walletAddress || farcasterAddress

  const { toast } = useToast()

  const [payAmount, setPayAmount] = useState("")
  const [receiveAmount, setReceiveAmount] = useState("")
  const [payToken, setPayToken] = useState<Token>(DEFAULT_TOKENS[0])
  const [receiveToken, setReceiveToken] = useState<Token | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [slippage, setSlippage] = useState("0.5")
  const [priceImpact, setPriceImpact] = useState<number | null>(null)
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({})
  const [quoteData, setQuoteData] = useState<any>(null)
  const [routePath, setRoutePath] = useState<string>("") // New state for route path

  const [needsApproval, setNeedsApproval] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [deadline, setDeadline] = useState("20") // minutes
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false)

  // Token selector state
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false)
  const [selectorType, setSelectorType] = useState<"pay" | "receive">("pay")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Token[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Donation state
  const [isDonateOpen, setIsDonateOpen] = useState(false)

  const fetchBalances = async () => {
    if (!address) return

    setIsRefreshingBalance(true)
    const balances: Record<string, string> = {}

    for (const token of DEFAULT_TOKENS) {
      try {
        const response = await fetch(`/api/token-balance?token=${token.address}&wallet=${address}`)
        if (response.ok) {
          const data = await response.json()
          // Format to 4 decimal places for display
          const formatted = Number(data.formatted).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4,
          })
          balances[token.address] = formatted
        }
      } catch (error) {
        console.error(`Error fetching balance for ${token.symbol}:`, error)
      }
    }

    setTokenBalances(balances)
    setIsRefreshingBalance(false)
  }

  useEffect(() => {
    fetchBalances()
  }, [address])

  useEffect(() => {
    const calculateSwap = async () => {
      if (!payAmount || !payToken || !receiveToken) {
        setReceiveAmount("")
        setExchangeRate(null)
        setRoutePath("")
        setQuoteData(null) // Reset quote data
        setNeedsApproval(false)
        return
      }

      if (!validateSlippage(slippage)) {
        toast({
          title: "Invalid Slippage",
          description: "Please enter a slippage value between 0 and 50%",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Calculating swap:", { payAmount, payToken: payToken.symbol, receiveToken: receiveToken.symbol })

      setIsLoading(true)
      setNeedsApproval(false) // Reset approval state while fetching new quote

      try {
        // Convert amount to wei/smallest unit
        const decimals = payToken.decimals || 18
        const sellAmount = ethers.parseUnits(payAmount, decimals).toString()

        console.log("[v0] Sell amount in wei:", sellAmount)

        const senderParam = address ? `&sender=${address}` : ""

        const response = await fetch(
          `/api/swap-quote?sellToken=${payToken.address}&buyToken=${receiveToken.address}&sellAmount=${sellAmount}&slippage=${slippage}${senderParam}`,
        )

        console.log("[v0] Quote response status:", response.status)

        if (response.ok) {
          const quote = await response.json()
          console.log("[v0] Quote data:", quote)

          if (quote.buildError) {
            console.warn("Swap build warning:", quote.buildError)
            // We can still show the price, but maybe disable swap or show warning
          }

          const buyDecimals = receiveToken.decimals || 18
          const buyAmount = ethers.formatUnits(quote.buyAmount, buyDecimals)

          console.log("[v0] Buy amount formatted:", buyAmount)

          setReceiveAmount(buyAmount)
          // Calculate rate based on formatted amounts
          const rate = Number(buyAmount) / Number(payAmount)
          setExchangeRate(rate)

          // Set route path
          if (quote.route) {
            setRoutePath(quote.route)
          }

          // Store quote data for execution
          setQuoteData(quote)

          if (quote.error) {
            toast({
              title: "Quote Warning",
              description: quote.error,
              variant: "destructive",
            })
          }

          if (isConnected && address && payToken.symbol !== "ETH" && quote.to) {
            checkAllowance(payToken.address, quote.to, sellAmount)
          }
        } else {
          console.error("[v0] Quote fetch failed:", response.statusText)
          toast({
            title: "Quote Failed",
            description: "Unable to get swap quote. Please try again.",
            variant: "destructive",
          })
          setExchangeRate(1)
          setReceiveAmount(payAmount)
          setRoutePath("")
          setQuoteData(null)
        }
      } catch (error) {
        console.error("[v0] Error calculating swap:", error)
        toast({
          title: "Error",
          description: "Failed to calculate swap. Please try again.",
          variant: "destructive",
        })
        setExchangeRate(1)
        setReceiveAmount(payAmount)
        setRoutePath("")
        setQuoteData(null)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(calculateSwap, 500)
    return () => clearTimeout(timer)
  }, [payAmount, payToken, receiveToken, address, slippage, toast]) // Added isConnected dependency

  const checkAllowance = async (tokenAddress: string, spender: string, amount: string) => {
    try {
      let provider: ethers.Provider

      if (signer && signer.provider) {
        provider = signer.provider
      } else if (sdk?.wallet?.ethProvider) {
        // For Farcaster, we can't easily get a read provider from the frame SDK directly for standard ethers calls
        // without wrapping it. So we fallback to RPC for reading state.
        provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_HTTP || "https://mainnet.base.org")
      } else {
        provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_HTTP || "https://mainnet.base.org")
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

      // If we don't have an address, we can't check allowance
      if (!address) return

      const allowance = await tokenContract.allowance(address, spender)
      console.log("[v0] Allowance check:", { token: tokenAddress, spender, amount, allowance: allowance.toString() })

      if (BigInt(allowance) < BigInt(amount)) {
        setNeedsApproval(true)
        return false // Return false if approval needed
      } else {
        setNeedsApproval(false)
        return true // Return true if approved
      }
    } catch (error) {
      console.error("Error checking allowance:", error)
      return false // Return false on error
    }
  }

  const handleApprove = async () => {
    if (!isConnected || !payToken || !quoteData?.to) return

    setIsApproving(true)
    try {
      toast({
        title: "Approving Token...",
        description: `Please confirm the approval for ${payToken.symbol}`,
      })

      let txHash: string | null = null
      let txResponse: any = null

      // Execute with Farcaster wallet
      if (farcasterAddress && isFarcasterContext && sdk?.wallet?.ethProvider) {
        // Encode approve function call
        const iface = new ethers.Interface(ERC20_ABI)
        const data = iface.encodeFunctionData("approve", [quoteData.to, ethers.MaxUint256])

        txHash = await sdk.wallet.ethProvider.request({
          method: "eth_sendTransaction",
          params: [
            {
              to: payToken.address,
              data: data,
              value: "0x0",
            },
          ],
        })

        // so we still rely on a delay or polling if we can't wait for receipt.
        // But we can try to wait if we had a provider.
      }
      // Execute with browser wallet
      else if (signer) {
        const tokenContract = new ethers.Contract(payToken.address, ERC20_ABI, signer)
        const tx = await tokenContract.approve(quoteData.to, ethers.MaxUint256)
        txHash = tx.hash
        txResponse = tx
      }

      if (txHash) {
        toast({
          title: "Approval Pending",
          description: "Waiting for confirmation...",
        })

        if (txResponse && txResponse.wait) {
          await txResponse.wait()
          setNeedsApproval(false)
          toast({
            title: "Approved!",
            description: `You can now swap ${payToken.symbol}`,
          })
          setIsApproving(false)
        } else {
          // Fallback for Farcaster or if wait not available
          setTimeout(() => {
            setNeedsApproval(false)
            toast({
              title: "Approved!",
              description: `You can now swap ${payToken.symbol}`,
            })
            setIsApproving(false)
          }, 5000)
        }
      }
    } catch (error: any) {
      console.error("Approval error:", error)
      toast({
        title: "Approval Failed",
        description: error.message || "Transaction rejected",
        variant: "destructive",
      })
      setIsApproving(false)
    }
  }

  const handleSwap = async () => {
    if (!isConnected) {
      if (isFarcasterContext) {
        await connectFarcaster()
      } else {
        connect()
      }
      return
    }

    if (!validateSlippage(slippage)) {
      toast({
        title: "Invalid Slippage",
        description: "Please enter a slippage value between 0 and 50%",
        variant: "destructive",
      })
      return
    }

    if (!payAmount || !receiveAmount || !payToken || !receiveToken || !quoteData) {
      console.log("[v0] Swap validation failed:", { payAmount, receiveAmount, payToken, receiveToken, quoteData })
      return
    }

    if (quoteData.error) {
      toast({
        title: "Swap Error",
        description: quoteData.error,
        variant: "destructive",
      })
      return
    }

    if (payToken.symbol !== "ETH" && quoteData.to) {
      const decimals = payToken.decimals || 18
      const sellAmount = ethers.parseUnits(payAmount, decimals).toString()
      const isApproved = await checkAllowance(payToken.address, quoteData.to, sellAmount)

      if (!isApproved) {
        toast({
          title: "Approval Needed",
          description: "Please approve the token before swapping.",
          variant: "destructive",
        })
        return
      }
    }

    console.log("[v0] Starting swap execution")

    setIsLoading(true)
    try {
      if (
        !quoteData.data ||
        quoteData.data === "0x" ||
        !quoteData.to ||
        quoteData.to === "0x0000000000000000000000000000000000000000"
      ) {
        toast({
          title: "Swap Not Available",
          description: "Unable to execute swap. Please try connecting your wallet or try again later.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (payToken.symbol !== "ETH") {
        // We can re-check allowance here if needed, but relying on state is usually fine
        // if the user didn't just revoke it.
      }

      toast({
        title: "Confirming Swap...",
        description: `Swapping ${payAmount} ${payToken.symbol} for ${receiveAmount} ${receiveToken.symbol}`,
      })

      let txHash: string | null = null

      console.log("[v0] Executing swap with:", { to: quoteData.to, value: quoteData.value })

      // Execute with Farcaster wallet
      if (farcasterAddress && isFarcasterContext && sdk?.wallet?.ethProvider) {
        console.log("[v0] Using Farcaster wallet")
        const tx = {
          to: quoteData.to,
          data: quoteData.data,
          value: quoteData.value || "0x0",
        }

        txHash = await sdk.wallet.ethProvider.request({
          method: "eth_sendTransaction",
          params: [tx],
        })
        console.log("[v0] Farcaster tx hash:", txHash)
      }
      // Execute with browser wallet
      else if (signer) {
        console.log("[v0] Using browser wallet")
        const tx = {
          to: quoteData.to,
          data: quoteData.data,
          value: quoteData.value || "0x0",
          gasLimit: (BigInt(quoteData.estimatedGas || "200000") * 120n) / 100n,
        }

        const txResponse = await signer.sendTransaction(tx)
        txHash = txResponse.hash
        console.log("[v0] Browser wallet tx hash:", txHash)

        toast({
          title: "Transaction Pending",
          description: "Waiting for confirmation...",
        })

        await txResponse.wait()
        console.log("[v0] Transaction confirmed")
      }

      if (txHash) {
        toast({
          title: "Swap Successful!",
          description: `Transaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
        })

        setPayAmount("")
        setReceiveAmount("")
        setQuoteData(null) // Reset quote

        setTimeout(() => {
          fetchBalances()
        }, 2000)
      }
    } catch (error: any) {
      console.error("[v0] Swap error:", error)
      toast({
        title: "Swap Failed",
        description: error.message || "Transaction rejected or failed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openTokenSelector = (type: "pay" | "receive") => {
    setSelectorType(type)
    setSearchQuery("")
    setSearchResults(DEFAULT_TOKENS)
    setIsTokenSelectorOpen(true)
  }

  const handleSettingsOpen = () => {
    setIsSettingsOpen(true)
  }

  const handleTokenSelect = (token: Token) => {
    if (selectorType === "pay") {
      if (token.symbol === receiveToken?.symbol) {
        setReceiveToken(payToken) // Swap if same
      }
      setPayToken(token)
    } else {
      if (token.symbol === payToken.symbol) {
        setPayToken(receiveToken || DEFAULT_TOKENS[0]) // Swap if same
      }
      setReceiveToken(token)
    }
    setIsTokenSelectorOpen(false)
  }

  const searchToken = async (query: string) => {
    setSearchQuery(query)
    if (!query) {
      setSearchResults(DEFAULT_TOKENS)
      return
    }

    setIsSearching(true)
    // Filter default tokens
    const filtered = DEFAULT_TOKENS.filter(
      (t) =>
        t.symbol.toLowerCase().includes(query.toLowerCase()) ||
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.address.toLowerCase() === query.toLowerCase(),
    )

    if (filtered.length > 0) {
      setSearchResults(filtered)
      setIsSearching(false)
      return
    }

    // If looks like address, try to fetch
    if (query.startsWith("0x") && query.length === 42) {
      try {
        const response = await fetch(`/api/token-info?query=${query}`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults([
            {
              symbol: data.symbol,
              name: data.name,
              address: data.address,
              logo: "🪙",
              decimals: data.decimals || 18, // Use fetched decimals
            },
          ])
        }
      } catch (e) {
        console.error("Token fetch error", e)
      }
    }
    setIsSearching(false)
  }

  const handleDonate = async () => {
    if (!isConnected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to donate.",
        variant: "destructive",
      })
      return
    }

    const recipient = process.env.NEXT_PUBLIC_FEE_RECIPIENT || "0x23684DDbD3C0d0992DbBa0F2c15D75f005B76AD8"
    if (!recipient) {
      toast({
        title: "Configuration Error",
        description: "Donation recipient not configured.",
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: "Initiating Donation",
        description: "Please confirm the transaction in your wallet.",
      })

      const amount = ethers.parseEther("0.005") // Default donation amount ~ $15

      let txHash
      if (farcasterAddress && isFarcasterContext && sdk?.wallet?.ethProvider) {
        txHash = await sdk.wallet.ethProvider.request({
          method: "eth_sendTransaction",
          params: [
            {
              to: recipient,
              value: amount.toString(), // value in wei
              data: "0x",
            },
          ],
        })
      } else if (signer) {
        const tx = await signer.sendTransaction({
          to: recipient,
          value: amount,
        })
        txHash = tx.hash
      }

      if (txHash) {
        toast({
          title: "Thank You! ❤️",
          description: "Your support means a lot!",
        })
        setIsDonateOpen(false)
      }
    } catch (error: any) {
      console.error("Donation error:", error)
      toast({
        title: "Donation Failed",
        description: error.message || "Transaction rejected",
        variant: "destructive",
      })
    }
  }

  const validateSlippage = (value: string) => {
    const num = Number.parseFloat(value)
    if (isNaN(num) || num < 0 || num > 50) {
      return false
    }
    return true
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>

        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <RefreshCw className="w-6 h-6" />
              </div>
              Swap Tokens
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setIsDonateOpen(true)}
              >
                <Heart className="w-5 h-5 text-pink-300 fill-pink-300 animate-pulse" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleSettingsOpen}>
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-blue-100">Instant swaps with best rates on Base</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 relative z-10">
          {/* Pay Section */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label className="text-blue-900 font-semibold">You Pay</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Balance: {tokenBalances[payToken.address] || "-"}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={fetchBalances}
                  disabled={isRefreshingBalance}
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingBalance ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="0"
                className="text-3xl font-bold border-none bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-slate-300"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
              <Button
                variant="outline"
                className="rounded-full px-3 min-w-[100px] bg-white border-slate-200 hover:bg-slate-50 hover:border-pink-200"
                onClick={() => openTokenSelector("pay")}
              >
                <span className="mr-2 text-lg">{payToken.logo}</span>
                {payToken.symbol}
                <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {payAmount && exchangeRate ? `$${(Number(payAmount) * 3000).toLocaleString()}` : "$0.00"}
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="relative h-4 flex items-center justify-center z-10">
            <div className="absolute bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm cursor-pointer hover:scale-110 transition-transform">
              <ArrowDown className="w-4 h-4 text-pink-500" />
            </div>
          </div>

          {/* Receive Section */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label className="text-blue-900 font-semibold">You Receive</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  Balance: {receiveToken ? tokenBalances[receiveToken.address] || "0.00" : "0.00"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={fetchBalances}
                  disabled={isRefreshingBalance}
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingBalance ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="0"
                className="text-3xl font-bold border-none bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-slate-300"
                value={receiveAmount}
                readOnly
              />
              <Button
                variant={receiveToken ? "outline" : "default"}
                className={`rounded-full px-3 min-w-[100px] ${!receiveToken ? "bg-pink-500 hover:bg-pink-600 text-white" : "bg-white border-slate-200 hover:bg-slate-50 hover:border-pink-200"}`}
                onClick={() => openTokenSelector("receive")}
              >
                {receiveToken ? (
                  <>
                    <span className="mr-2 text-lg">{receiveToken.logo}</span>
                    {receiveToken.symbol}
                    <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                  </>
                ) : (
                  <>
                    Select token <ChevronDown className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {receiveAmount && exchangeRate
                ? `$${(Number(receiveAmount) * (3000 / exchangeRate)).toLocaleString()}`
                : "$0.00"}
            </div>
          </div>

          {/* Info Section */}
          {payToken && receiveToken && exchangeRate && (
            <div className="pt-2 px-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  Rate <Info className="w-3 h-3" />
                </span>
                <span>
                  1 {payToken.symbol} = {exchangeRate.toFixed(6)} {receiveToken.symbol}
                </span>
              </div>

              {/* Route Info */}
              {routePath && (
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    Route <Route className="w-3 h-3" />
                  </span>
                  <span className="font-medium text-pink-600 truncate max-w-[200px]">{routePath}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  Network Cost <Info className="w-3 h-3" />
                </span>
                <span className="flex items-center gap-1">
                  {/* Zap icon is not imported, so it's commented out */}
                  {/* <Zap className="w-3 h-3 text-orange-500" /> */}
                  ~$0.05
                </span>
              </div>

              {/* Platform Fee display */}
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">Platform Fee</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-4">
          <Button
            className="w-full h-12 text-lg font-semibold bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-200"
            disabled={!payAmount || !receiveToken || isLoading || isApproving}
            onClick={needsApproval ? handleApprove : handleSwap}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Swapping...
              </div>
            ) : isApproving ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Approving...
              </div>
            ) : !isConnected ? (
              "Connect Wallet"
            ) : !receiveToken ? (
              "Select a token"
            ) : !payAmount ? (
              "Enter an amount"
            ) : needsApproval ? (
              `Approve ${payToken.symbol}`
            ) : (
              "Swap"
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Swap Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Slippage Tolerance</Label>
              <div className="flex gap-2">
                {["0.1", "0.5", "1.0"].map((val) => (
                  <Button
                    key={val}
                    variant={slippage === val ? "default" : "outline"}
                    onClick={() => setSlippage(val)}
                    className="flex-1"
                  >
                    {val}%
                  </Button>
                ))}
                <div className="relative flex-1">
                  <Input
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                    className="pr-6 text-right"
                    placeholder="Custom"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Transaction Deadline</Label>
              <div className="flex items-center gap-2">
                <Input value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-24" type="number" />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Donation Dialog */}
      <Dialog open={isDonateOpen} onOpenChange={setIsDonateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
              Support Development
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              If you find this tool useful, consider supporting the developer with a small donation.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
              <p className="text-2xl font-bold text-pink-600">0.005 ETH</p>
              <p className="text-xs text-muted-foreground">~$15 USD</p>
            </div>
            <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white" onClick={handleDonate}>
              Donate Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Token Selector Dialog */}
      <Dialog open={isTokenSelectorOpen} onOpenChange={setIsTokenSelectorOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select a token</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or paste address"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => searchToken(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_TOKENS.slice(0, 4).map((token) => (
                <Badge
                  key={token.symbol}
                  variant="outline"
                  className="cursor-pointer hover:bg-slate-100 px-3 py-1"
                  onClick={() => handleTokenSelect(token)}
                >
                  <span className="mr-1">{token.logo}</span> {token.symbol}
                </Badge>
              ))}
            </div>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {isSearching ? (
                  <div className="text-center py-8 text-muted-foreground">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No tokens found</div>
                ) : (
                  searchResults.map((token) => (
                    <div
                      key={token.address}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => handleTokenSelect(token)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-lg">
                          {token.logo}
                        </div>
                        <div>
                          <p className="font-medium">{token.symbol}</p>
                          <p className="text-xs text-muted-foreground">{token.name}</p>
                        </div>
                      </div>
                      {token.balance && (
                        <div className="text-right">
                          <p className="text-sm font-medium">{token.balance}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// function Zap(props: any) {
//   return (
//     <svg
//       {...props}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
//     </svg>
//   )
// }
