"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Rocket,
  Heart,
  Repeat,
  Coins,
  CheckCircle,
  Loader2,
  ExternalLink,
  Users,
  ShieldCheck,
  Zap,
  Copy,
  MessageSquare,
} from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import { useFarcaster } from "@/components/farcaster-provider"
import type { Pool } from "./noela-frame-app"

const NOELA_ZEE_ADDRESS = "0x15fE1Efb7C07B49A4e4756Ced33C1E790e89182e"

interface CommunityBoostProps {
  pools: Pool[]
  onAddPool: (pool: Pool) => void
  onClaimPool: (poolId: number) => void
}

export function CommunityBoost({ pools, onAddPool, onClaimPool }: CommunityBoostProps) {
  const { toast } = useToast()
  const { isConnected, connect, address } = useWallet()
  const { context } = useFarcaster()

  const [activeTab, setActiveTab] = useState("earn")
  const [loadingPool, setLoadingPool] = useState<number | null>(null)
  const [claimedPools, setClaimedPools] = useState<number[]>([])
  const [verifyingPool, setVerifyingPool] = useState<number | null>(null)
  const [verifiedPools, setVerifiedPools] = useState<number[]>([])
  const [visitedLinks, setVisitedLinks] = useState<number[]>([])
  const [userScore, setUserScore] = useState(85)
  const [farcasterId, setFarcasterId] = useState("")
  const [showFidInput, setShowFidInput] = useState<number | null>(null)

  const [tokenAddress, setTokenAddress] = useState(NOELA_ZEE_ADDRESS)
  const [amount, setAmount] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("100")
  const [targetLink, setTargetLink] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [copiedComment, setCopiedComment] = useState<string | null>(null)
  const [createdPoolData, setCreatedPoolData] = useState<{
    amount: string
    tokenSymbol: string
    poolId: number
  } | null>(null)

  const supportiveComments = [
    "LFG! 🚀 This project is going places!",
    "Great update! Bullish on this ecosystem. 🔥",
    "Amazing work team! Keep building. 💎",
    "Solid community here. Glad to be early! 👏",
    "Base is the place to be! 🔵",
    "Love the vision behind this. Let's go! ⚡",
  ]

  useEffect(() => {
    const shouldCreate = localStorage.getItem("open_create_pool")
    if (shouldCreate === "true") {
      setActiveTab("create")
      localStorage.removeItem("open_create_pool")
    }
  }, [])

  useEffect(() => {
    if (context?.user?.fid) {
      setFarcasterId(context.user.fid.toString())
    }
  }, [context])

  const calculateRewardPerUser = () => {
    if (amount && maxParticipants) {
      const totalAmount = Number.parseFloat(amount)
      const participants = Number.parseInt(maxParticipants)
      if (!isNaN(totalAmount) && !isNaN(participants) && participants > 0) {
        return (totalAmount / participants).toFixed(2)
      }
    }
    return "0"
  }

  const displayRewardPerUser = calculateRewardPerUser()

  const handleOpenLink = (poolId: number, link: string) => {
    window.open(link, "_blank")
    if (!visitedLinks.includes(poolId)) {
      setTimeout(() => {
        setVisitedLinks((prev) => [...prev, poolId])
      }, 2000)
    }
  }

  const handleCheckInteraction = async (poolId: number) => {
    if (!visitedLinks.includes(poolId)) {
      toast({
        title: "Action Required",
        description: "Please open the post and complete the tasks first!",
        variant: "destructive",
      })
      return
    }

    const fidToUse = context?.user?.fid?.toString() || farcasterId

    if (!fidToUse) {
      setShowFidInput(poolId)
      toast({
        title: "Farcaster ID Required",
        description: "Please enter your Farcaster ID (FID) to verify interactions.",
      })
      return
    }

    setVerifyingPool(poolId)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const pool = pools.find((p) => p.id === poolId)
      let castHash = "0x..." // Default fallback

      if (pool?.link) {
        const parts = pool.link.split("/")
        const lastPart = parts[parts.length - 1]
        if (lastPart.startsWith("0x")) {
          castHash = lastPart
        }
      }

      const response = await fetch("/api/verify-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: fidToUse,
          castHash: castHash,
          interactionType: "all",
        }),
      })

      const data = await response.json()

      if (data.verified) {
        setVerifiedPools([...verifiedPools, poolId])
        setUserScore((prev) => Math.min(100, prev + 5))
        toast({
          title: "Interaction Verified! ✅",
          description: "Great job! You Liked, Recasted & Commented. Reward unlocked.",
          variant: "default",
        })
      } else {
        const details = data.details || {}
        const missing = []
        if (details.liked === false) missing.push("Like")
        if (details.recasted === false) missing.push("Recast")
        if (details.replied === false) missing.push("Comment")

        toast({
          title: "Verification Failed ❌",
          description:
            missing.length > 0
              ? `You missed: ${missing.join(", ")}. Please complete all tasks!`
              : "We couldn't verify your interactions. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Verification failed", error)
      toast({
        title: "Verification Error",
        description: "Could not connect to verification server. Please try again.",
        variant: "destructive",
      })
    } finally {
      setVerifyingPool(null)
      if (showFidInput === poolId) {
        setShowFidInput(null)
      }
    }
  }

  const handleClaim = async (poolId: number) => {
    if (!isConnected) {
      connect()
      return
    }

    setLoadingPool(poolId)

    try {
      const pool = pools.find((p) => p.id === poolId)
      if (!pool) throw new Error("Pool not found")

      const response = await fetch("/api/claim-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poolId,
          userAddress: address,
          tokenAddress: pool.tokenAddress,
          amount: pool.reward,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to claim reward")
      }

      setClaimedPools([...claimedPools, poolId])
      onClaimPool(poolId)

      toast({
        title: "Rewards Claimed! 💰",
        description: data.txHash.startsWith("0x_simulated")
          ? "Reward verified! (Simulation Mode)"
          : `$NOELA_ZEE tokens have been sent to your wallet. Tx: ${data.txHash.slice(0, 6)}...`,
        variant: "default",
      })
    } catch (error: any) {
      console.error("Claim failed:", error)
      toast({
        title: "Claim Failed",
        description: error.message || "Could not transfer tokens. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingPool(null)
    }
  }

  const handleCreatePool = async () => {
    if (!amount || !maxParticipants || !tokenAddress || !targetLink) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!isConnected) {
      connect()
      return
    }

    setIsCreating(true)
    try {
      toast({
        title: "Creating Pool",
        description: "Setting up your Rain Pool...",
      })

      const createRes = await fetch("/api/create-rain-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenAddress,
          amount,
          maxParticipants,
          targetLink,
          walletAddress: address,
        }),
      })

      const createData = await createRes.json()

      if (!createRes.ok) {
        throw new Error(createData.message || "Failed to create pool")
      }

      toast({
        title: "Rain Pool Created! 🌧️",
        description: `Your community boost campaign is now live. Pool ID: ${createData.poolId}`,
        variant: "default",
      })

      const tokenSymbol = tokenAddress === NOELA_ZEE_ADDRESS ? "$NOELA" : "Tokens"

      const newPool: Pool = {
        id: Date.now(),
        name: "New Project",
        description: "Community engagement campaign",
        reward: `${displayRewardPerUser} ${tokenSymbol}`,
        tokenAddress,
        participants: 0,
        maxParticipants: Number.parseInt(maxParticipants),
        status: "active",
        link: targetLink,
        logo: "🚀",
        color: "bg-indigo-500",
      }
      onAddPool(newPool)

      setCreatedPoolData({
        amount: amount,
        tokenSymbol: tokenSymbol,
        poolId: createData.poolId,
      })

      setActiveTab("earn")

      setAmount("")
      setMaxParticipants("100")
      setTokenAddress(NOELA_ZEE_ADDRESS)
      setTargetLink("")
    } catch (error: any) {
      console.error("Pool creation error:", error)
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create Rain Pool",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleShareOnFarcaster = () => {
    if (!createdPoolData) return

    const text = `Just created a Rain Pool on Noela Tools! 🌧️💰\n\nGrab your share of ${createdPoolData.amount} ${createdPoolData.tokenSymbol} now!\n\nComplete tasks to claim here: https://noela-toolss.vercel.app\n\n#NoelaTools #Base #RainPool`
    const encodedText = encodeURIComponent(text)
    const intentUrl = `https://warpcast.com/~/compose?text=${encodedText}`

    window.open(intentUrl, "_blank")
    setCreatedPoolData(null) // Close modal after sharing
  }

  const handleCopyComment = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedComment(text)
    toast({
      title: "Copied!",
      description: "Comment copied to clipboard. Now paste it on the post!",
    })
    setTimeout(() => setCopiedComment(null), 2000)
  }

  return (
    <div className="space-y-6">
      {createdPoolData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md border-2 border-blue-500 shadow-2xl bg-white">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-blue-900">Pool Created! 🎉</CardTitle>
              <CardDescription>Your campaign is live. Now tell the world!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600 italic">
                `Just created a Rain Pool on Noela Tools! 🌧️💰\n\nGrab your share of ${createdPoolData.amount} $
                {createdPoolData.tokenSymbol} now!\n\nComplete tasks to claim here:
                https://noela-toolss.vercel.app\n\n#NoelaTools #Base #RainPool`
              </div>
              <Button
                className="w-full bg-[#855DCD] hover:bg-[#7a55bf] text-white font-bold h-12 text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                onClick={handleShareOnFarcaster}
              >
                <Rocket className="w-5 h-5 mr-2" />
                Share on Farcaster
              </Button>
              <Button variant="ghost" className="w-full text-slate-500" onClick={() => setCreatedPoolData(null)}>
                Skip for now
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-2">
          <Rocket className="w-8 h-8 text-[#0052FF]" />
        </div>
        <h2 className="text-3xl font-bold text-blue-900">Community Boost</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Ignite engagement on your project. Reward active users instantly on Base.
          <br />
          <span className="text-[#0052FF] font-semibold">You pay the token, they bring the noise.</span>
        </p>
        <div className="flex justify-center gap-4 mt-4 flex-wrap">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Strict Verification Active</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Your Score: {userScore}/100</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
            <span className="text-sm font-medium text-blue-800">Base Apps Ready</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="earn" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="earn" className="text-base">
            <Coins className="w-4 h-4 mr-2" />
            Engage-to-Earn
          </TabsTrigger>
          <TabsTrigger value="create" className="text-base">
            <Rocket className="w-4 h-4 mr-2" />
            Create Rain Pool
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earn" className="space-y-4">
          {pools
            .filter((pool) => pool.status === "active" && pool.participants < pool.maxParticipants)
            .map((pool) => (
              <Card key={pool.id} className="border-blue-100 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-blue-900 flex items-center gap-2">
                        {pool.name}
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-xs">
                          Verified
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">{pool.description}</CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 text-sm px-3 py-1">
                      {pool.reward}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {pool.participants}/{pool.maxParticipants} Claimed
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      Live Now
                    </div>
                  </div>

                  {showFidInput === pool.id && !context?.user?.fid && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2">
                      <Label htmlFor="fid-input" className="text-xs font-semibold text-blue-900 mb-1 block">
                        Enter Farcaster ID (FID)
                      </Label>
                      <p className="text-[10px] text-blue-600 mb-2">
                        Using Base Apps or external wallet? Enter your FID manually to verify.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          id="fid-input"
                          value={farcasterId}
                          onChange={(e) => setFarcasterId(e.target.value)}
                          placeholder="e.g. 12345"
                          className="h-8 text-sm bg-white"
                          type="number"
                        />
                        <Button
                          size="sm"
                          className="h-8 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleCheckInteraction(pool.id)}
                        >
                          Verify
                        </Button>
                      </div>
                      <p className="text-[10px] text-blue-600 mt-1">
                        We use Neynar API to verify your Like, Recast & Comment on-chain.
                      </p>
                    </div>
                  )}

                  {context?.user?.fid && showFidInput === pool.id && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100 animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-800 font-medium">
                        Auto-detected Farcaster ID: {context.user.fid}
                      </span>
                    </div>
                  )}

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <span className="text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-600">Task</span>
                      Like, Recast & Comment
                    </div>
                    <button
                      onClick={() => handleOpenLink(pool.id, pool.link)}
                      className={`text-xs flex items-center gap-1 hover:underline ${
                        visitedLinks.includes(pool.id) ? "text-green-600 font-medium" : "text-[#0052FF]"
                      }`}
                    >
                      {visitedLinks.includes(pool.id) ? (
                        <>
                          Link Opened <CheckCircle className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          Open Post <ExternalLink className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>

                  {visitedLinks.includes(pool.id) &&
                    !verifiedPools.includes(pool.id) &&
                    !claimedPools.includes(pool.id) && (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Copy a supportive comment (Optional):
                        </Label>
                        <div className="grid grid-cols-1 gap-2">
                          {supportiveComments.slice(0, 3).map((comment, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleCopyComment(comment)}
                              className="text-left text-xs p-2 bg-white border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-200 transition-colors flex justify-between items-center group"
                            >
                              <span className="truncate pr-2 text-slate-700">{comment}</span>
                              {copiedComment === comment ? (
                                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </CardContent>
                <CardFooter className="pt-0 flex gap-3">
                  {!verifiedPools.includes(pool.id) && !claimedPools.includes(pool.id) ? (
                    <Button
                      className={`w-full ${
                        visitedLinks.includes(pool.id)
                          ? "bg-slate-900 hover:bg-slate-800"
                          : "bg-slate-300 hover:bg-slate-400 cursor-not-allowed"
                      }`}
                      onClick={() => handleCheckInteraction(pool.id)}
                      disabled={!!verifyingPool || !visitedLinks.includes(pool.id)}
                    >
                      {verifyingPool === pool.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying Actions...
                        </>
                      ) : !visitedLinks.includes(pool.id) ? (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Post First
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 mr-2 text-red-500 fill-red-500" />
                          <Repeat className="w-4 h-4 mr-2 text-green-500" />
                          Verify Interaction
                        </>
                      )}
                    </Button>
                  ) : !claimedPools.includes(pool.id) ? (
                    <Button
                      className="w-full bg-[#0052FF] hover:bg-[#0041CC]"
                      onClick={() => handleClaim(pool.id)}
                      disabled={!!loadingPool}
                    >
                      {loadingPool === pool.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <Coins className="w-4 h-4 mr-2" />
                          Claim Reward
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button className="w-full bg-green-500 hover:bg-green-600 cursor-default">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Claimed
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="create">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>Create Rain Pool 🌧️</CardTitle>
              <CardDescription>
                Drop incentives for the community. Distribute tokens to users who engage with your content.
                <br />
                <span className="text-[#0052FF] font-semibold">
                  You decide the total pool, we split it equally. Freedom is yours.
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Token Contract Address</Label>
                <Input
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="0x..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Supported on Base. Default: $NOELA_ZEE</p>
              </div>

              <div className="space-y-2">
                <Label>Target Link (Farcaster Post)</Label>
                <Input
                  value={targetLink}
                  onChange={(e) => setTargetLink(e.target.value)}
                  placeholder="https://warpcast.com/noee.eth/0xe21b..."
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Users must Like, Recast & Comment this post to claim rewards.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Pool Amount</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="10000"
                      className="pl-10"
                    />
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                      <Coins className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Total tokens in the pool</p>
                </div>

                <div className="space-y-2">
                  <Label>Max Participants</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                      placeholder="100"
                      className="pl-10"
                    />
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">How many users can claim</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-900 text-sm">Reward Per User</h4>
                    <p className="text-xs text-green-700 mt-0.5">Automatically calculated split</p>
                  </div>
                  <div className="text-2xl font-bold text-green-700">{displayRewardPerUser}</div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Each user who completes the task will receive <strong>{displayRewardPerUser} tokens</strong>
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-blue-900 text-sm mb-2">Pool Settings & Fees</h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Distribution: Equal split to first {maxParticipants || "100"} users</li>
                  <li>Requirement: Like, Recast & Comment on Farcaster</li>
                  <li>Verification: Automated interaction check</li>
                  <li className="font-semibold text-green-600">Creation Fee: FREE (Limited Time)</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-[#0052FF] hover:bg-[#0041CC]"
                onClick={handleCreatePool}
                disabled={isCreating || !amount || !maxParticipants || !targetLink}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Pool...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Create Rain Pool (Free)
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
