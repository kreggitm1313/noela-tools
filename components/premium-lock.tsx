"use client"

import { Lock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@/components/wallet-provider"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { ethers } from "ethers"

interface PremiumLockProps {
  featureName: string
  price?: string
  onUnlock?: () => void
}

export function PremiumLock({ featureName, price = "0.01", onUnlock }: PremiumLockProps) {
  const { address, signer, isConnected, connect } = useWallet()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => {
    // Check if already unlocked in localStorage
    const unlocked = localStorage.getItem(`premium_unlocked_${featureName}`)
    if (unlocked === "true") {
      setIsUnlocked(true)
      onUnlock?.()
    }
  }, [featureName, onUnlock])

  const handleUnlock = async () => {
    if (!isConnected) {
      connect()
      return
    }

    if (!signer) return

    setIsProcessing(true)
    try {
      const feeRecipient = process.env.NEXT_PUBLIC_FEE_RECIPIENT || "0x23684DDbD3C0d0992DbBa0F2c15D75f005B76AD8"

      const tx = await signer.sendTransaction({
        to: feeRecipient,
        value: ethers.parseEther(price),
      })

      toast({
        title: "Processing Payment",
        description: "Please wait for transaction confirmation...",
      })

      await tx.wait()

      localStorage.setItem(`premium_unlocked_${featureName}`, "true")
      setIsUnlocked(true)
      onUnlock?.()

      toast({
        title: "Feature Unlocked!",
        description: `You now have access to ${featureName}`,
      })
    } catch (error: any) {
      console.error("Unlock failed:", error)
      toast({
        title: "Payment Failed",
        description: error.message || "Transaction cancelled",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isUnlocked) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
      <Card className="w-full max-w-md border-orange-200 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-orange-900">Unlock {featureName}</CardTitle>
          <CardDescription>Get lifetime access to this premium feature for just {price} ETH</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              Advanced sniping capabilities
            </p>
            <p className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              Real-time data analytics
            </p>
            <p className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              Priority execution speed
            </p>
          </div>
          <Button
            onClick={handleUnlock}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-6"
          >
            {isProcessing ? "Processing..." : `Pay ${price} ETH to Unlock`}
          </Button>
          <p className="text-xs text-center text-muted-foreground">One-time payment • Lifetime access</p>
        </CardContent>
      </Card>
    </div>
  )
}
