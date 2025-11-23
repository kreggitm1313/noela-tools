"use client"

import { Crown, Zap, TrendingUp, Bell, Users, Shield, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/components/wallet-provider"
import { useFarcaster } from "@/components/farcaster-provider"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { ethers } from "ethers"

export function AlphaMember() {
  const { address, signer, isConnected, connect } = useWallet()
  const { sdk, isFarcasterConnected } = useFarcaster()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMember, setIsMember] = useState(false)

  useEffect(() => {
    // Check if already a member
    const memberStatus = localStorage.getItem("alpha_member")
    if (memberStatus === "true") {
      setIsMember(true)
    }
  }, [])

  const handleJoin = async () => {
    if (!isConnected && !isFarcasterConnected) {
      connect()
      return
    }

    setIsProcessing(true)
    try {
      const feeRecipient = "0x23684DDbD3C0d0992DbBa0F2c15D75f005B76AD8"
      const membershipFee = "0.1" // 0.1 ETH

      let txHash: string

      if (isFarcasterConnected && sdk?.wallet) {
        const provider = new ethers.BrowserProvider(sdk.wallet.ethProvider)
        const farcasterSigner = await provider.getSigner()

        const tx = await farcasterSigner.sendTransaction({
          to: feeRecipient,
          value: ethers.parseEther(membershipFee),
        })

        toast({
          title: "Processing Payment",
          description: "Please wait for transaction confirmation...",
        })

        const receipt = await tx.wait()
        txHash = receipt?.hash || tx.hash
      } else if (signer) {
        const tx = await signer.sendTransaction({
          to: feeRecipient,
          value: ethers.parseEther(membershipFee),
        })

        toast({
          title: "Processing Payment",
          description: "Please wait for transaction confirmation...",
        })

        const receipt = await tx.wait()
        txHash = receipt?.hash || tx.hash
      } else {
        throw new Error("No wallet connected")
      }

      // Save membership status
      localStorage.setItem("alpha_member", "true")
      localStorage.setItem("alpha_member_tx", txHash)
      setIsMember(true)

      toast({
        title: "Welcome to Alpha Members!",
        description: "You now have access to exclusive features and signals",
      })
    } catch (error: any) {
      console.error("Join failed:", error)
      toast({
        title: "Payment Failed",
        description: error.message || "Transaction cancelled",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isMember) {
    return (
      <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <Badge className="mx-auto mb-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
            ALPHA MEMBER
          </Badge>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            You're In!
          </CardTitle>
          <CardDescription className="text-base">Welcome to the exclusive Alpha Members group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white/80 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-lg text-gray-900 mb-3">Your Exclusive Benefits:</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Priority Trading Signals</p>
                  <p className="text-sm text-gray-600">Get notified before public releases</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Advanced Analytics Dashboard</p>
                  <p className="text-sm text-gray-600">Deep insights and market data</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Private Community Access</p>
                  <p className="text-sm text-gray-600">Join our exclusive Telegram group</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Zero Platform Fees</p>
                  <p className="text-sm text-gray-600">Trade without additional charges</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Early Feature Access</p>
                  <p className="text-sm text-gray-600">Test new tools before everyone else</p>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => window.open("https://t.me/Noela_zee", "_blank")}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-6 shadow-lg"
          >
            <Users className="w-5 h-5 mr-2" />
            Join Private Telegram Group
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-yellow-400 shadow-2xl overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl"></div>
      <CardHeader className="text-center relative">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg animate-pulse">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <Badge className="mx-auto mb-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 animate-pulse">
          LIMITED SPOTS
        </Badge>
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
          Join Alpha Members
        </CardTitle>
        <CardDescription className="text-base">
          Get exclusive access to premium trading signals and features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-lg text-gray-900 mb-4">What You Get:</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Priority Trading Signals</p>
                <p className="text-sm text-gray-600">Get alpha calls before they go public</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Advanced Analytics</p>
                <p className="text-sm text-gray-600">Deep market insights and whale tracking</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Private Community</p>
                <p className="text-sm text-gray-600">Exclusive Telegram group with top traders</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Custom Alerts</p>
                <p className="text-sm text-gray-600">Real-time notifications for your watchlist</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Zero Platform Fees</p>
                <p className="text-sm text-gray-600">Trade without any additional charges</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600">Membership Fee</span>
            <span className="text-2xl font-bold text-gray-900">0.1 ETH</span>
          </div>
          <p className="text-xs text-gray-500">One-time payment • Lifetime access</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => window.open("https://x.com/messages/compose?recipient_id=1799378337923315712", "_blank")}
            variant="outline"
            className="flex-1 border-2 border-yellow-400 hover:bg-yellow-50"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2 fill-current" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            DM on X
          </Button>
          <Button
            onClick={() => window.open("https://t.me/Noela_zee", "_blank")}
            variant="outline"
            className="flex-1 border-2 border-yellow-400 hover:bg-yellow-50"
          >
            <Users className="w-4 h-4 mr-2" />
            Telegram
          </Button>
        </div>

        <Button
          onClick={handleJoin}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
        >
          {isProcessing ? (
            "Processing..."
          ) : (
            <>
              <Crown className="w-5 h-5 mr-2" />
              Join Alpha Members (0.1 ETH)
            </>
          )}
        </Button>

        <p className="text-xs text-center text-gray-500">Limited to 100 members • Secure payment via smart contract</p>
      </CardContent>
    </Card>
  )
}
