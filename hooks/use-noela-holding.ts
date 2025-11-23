"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/components/wallet-provider"

export function useNoelaHolding(requiredUSD = 10.0) {
  const { address, isConnected } = useWallet()
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [balanceUSD, setBalanceUSD] = useState(0)
  const [balanceNoela, setBalanceNoela] = useState(0)

  useEffect(() => {
    const checkHolding = async () => {
      if (!address || !isConnected) {
        setIsVerified(false)
        return
      }

      setIsLoading(true)
      try {
        const res = await fetch(`/api/verify-noela-holding?wallet=${address}`)
        const data = await res.json()

        if (data.isValid) {
          setIsVerified(true)
        } else {
          setIsVerified(false)
        }
        setBalanceUSD(data.balanceUSD || 0)
        setBalanceNoela(data.balanceNoela || 0)
      } catch (error) {
        console.error("Failed to check NOELA holding:", error)
        setIsVerified(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkHolding()
  }, [address, isConnected, requiredUSD])

  return { isVerified, isLoading, balanceUSD, balanceNoela }
}
