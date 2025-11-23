"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/components/wallet-provider"

export function useBalanceRequirement(thresholdUSD = 3.0) {
  const { address, isConnected } = useWallet()
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [balanceUSD, setBalanceUSD] = useState(0)

  useEffect(() => {
    const checkBalance = async () => {
      if (!address || !isConnected) {
        setIsVerified(false)
        return
      }

      setIsLoading(true)
      try {
        const res = await fetch(`/api/verify-balance-requirement?wallet=${address}`)
        const data = await res.json()

        if (data.isValid) {
          setIsVerified(true)
        } else {
          setIsVerified(false)
        }
        setBalanceUSD(data.balanceUSD || 0)
      } catch (error) {
        console.error("Failed to check balance requirement:", error)
        setIsVerified(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkBalance()
  }, [address, isConnected, thresholdUSD])

  return { isVerified, isLoading, balanceUSD }
}
