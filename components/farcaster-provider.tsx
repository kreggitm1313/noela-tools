"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import sdk, { type FrameContext } from "@farcaster/frame-sdk"

interface FarcasterContextType {
  isSDKLoaded: boolean
  context: FrameContext | null
  walletAddress: string | null
  connectWallet: () => Promise<void>
  isConnecting: boolean
  isLoading: boolean
  isFarcasterContext: boolean
}

const FarcasterContext = createContext<FarcasterContextType>({
  isSDKLoaded: false,
  context: null,
  walletAddress: null,
  connectWallet: async () => {},
  isConnecting: false,
  isLoading: true,
  isFarcasterContext: false,
})

export const useFarcaster = () => useContext(FarcasterContext)

export const useFarcasterWallet = () => {
  const context = useContext(FarcasterContext)
  return {
    ...context,
    isConnected: !!context.walletAddress,
    address: context.walletAddress,
  }
}

export default function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [context, setContext] = useState<FrameContext | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isFarcasterContext, setIsFarcasterContext] = useState(false)

  useEffect(() => {
    const load = async () => {
      console.log("[v0] Starting Farcaster SDK initialization")
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("SDK load timeout")), 10000),
        )

        const contextPromise = sdk.context

        const frameContext = (await Promise.race([contextPromise, timeoutPromise])) as FrameContext
        console.log("[v0] Farcaster context loaded:", frameContext)
        setContext(frameContext)
        setIsFarcasterContext(true)

        if (frameContext.user?.verifications) {
          const ethAddress = frameContext.user.verifications.find((v) => v.protocol === "ethereum")?.address
          if (ethAddress) {
            setWalletAddress(ethAddress)
            console.log("[v0] Found existing Farcaster wallet:", ethAddress)
          }
        }

        if (!walletAddress) {
          try {
            console.log("[v0] Attempting auto-connect Farcaster wallet")
            const accounts = await sdk.wallet.ethProvider.request({
              method: "eth_accounts",
            })

            if (accounts && Array.isArray(accounts) && accounts.length > 0) {
              setWalletAddress(accounts[0] as string)
              console.log("[v0] Auto-connected Farcaster wallet:", accounts[0])
            }
          } catch (autoConnectError) {
            console.log("[v0] Auto-connect not available, user needs to manually connect:", autoConnectError)
          }
        }

        sdk.actions.ready()
        console.log("[v0] Farcaster SDK ready signal sent")
      } catch (error) {
        console.log("[v0] Not running in Farcaster context or timeout, will use universal wallet:", error)
        setIsFarcasterContext(false)
      } finally {
        setIsLoading(false)
        console.log("[v0] SDK initialization complete")
      }
    }

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true)
      load()
    }
  }, [isSDKLoaded])

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("[v0] Safety timeout reached, stopping loading")
        setIsLoading(false)
      }
    }, 12000) // Increased from 5s to 12s to match SDK timeout

    return () => clearTimeout(safetyTimeout)
  }, [isLoading])

  const connectWallet = async () => {
    if (!isFarcasterContext) {
      console.log("[v0] Not in Farcaster context, cannot connect Farcaster wallet")
      return
    }

    setIsConnecting(true)
    try {
      console.log("[v0] Attempting to connect Farcaster wallet")
      // Request wallet connection through Farcaster Frame SDK
      const result = await sdk.wallet.ethProvider.request({
        method: "eth_requestAccounts",
      })

      if (result && Array.isArray(result) && result.length > 0) {
        setWalletAddress(result[0] as string)
        console.log("[v0] Farcaster wallet connected:", result[0])
      }
    } catch (error) {
      console.error("[v0] Failed to connect Farcaster wallet:", error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <FarcasterContext.Provider
      value={{
        isSDKLoaded,
        context,
        walletAddress,
        connectWallet,
        isConnecting,
        isLoading,
        isFarcasterContext,
      }}
    >
      {children}
    </FarcasterContext.Provider>
  )
}
