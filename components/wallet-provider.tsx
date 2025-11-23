"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"
import { useToast } from "@/hooks/use-toast"
import sdk from "@farcaster/frame-sdk"

interface WalletContextType {
  address: string | null
  isConnected: boolean
  chainId: number | null
  connect: (walletType?: string) => Promise<void>
  disconnect: () => void
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
  availableWallets: string[]
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  chainId: null,
  connect: async () => {},
  disconnect: () => {},
  provider: null,
  signer: null,
  availableWallets: [],
})

export const useWallet = () => useContext(WalletContext)

export function WalletProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [availableWallets, setAvailableWallets] = useState<string[]>([])
  const [isSwitchingChain, setIsSwitchingChain] = useState(false)

  const getFarcasterProvider = () => {
    try {
      // @ts-ignore - sdk might be undefined in some contexts
      if (typeof sdk !== "undefined" && sdk.wallet && sdk.wallet.ethProvider) {
        return sdk.wallet.ethProvider
      }
    } catch (e) {
      console.warn("[v0] Farcaster SDK provider not available:", e)
    }
    return null
  }

  const detectWallets = () => {
    const wallets: string[] = []

    if (typeof window !== "undefined") {
      try {
        if (getFarcasterProvider()) {
          wallets.push("farcaster")
          console.log("[v0] Farcaster Frame Wallet detected")
        }

        // Check for OKX Wallet
        if (window.okxwallet) {
          wallets.push("okx")
          console.log("[v0] OKX Wallet detected")
        }

        // Check for Binance Web3 Wallet
        if (window.BinanceChain) {
          wallets.push("binance")
          console.log("[v0] Binance Web3 Wallet detected")
        }

        // Check for Coinbase Wallet
        if (window.ethereum?.isCoinbaseWallet) {
          wallets.push("coinbase")
          console.log("[v0] Coinbase Wallet detected")
        }

        // Check for MetaMask
        if (window.ethereum?.isMetaMask) {
          wallets.push("metamask")
          console.log("[v0] MetaMask detected")
        }

        if (window.ethereum) {
          if (!wallets.includes("coinbase") && !wallets.includes("metamask")) {
            wallets.push("ethereum")
            console.log("[v0] Generic Ethereum wallet detected")
          }
        }
      } catch (e) {
        console.error("[v0] Error detecting wallets:", e)
      }
    }

    return wallets
  }

  const validateChain = async (provider: any): Promise<boolean> => {
    try {
      const chainId = await provider.request({ method: "eth_chainId" })
      // Base Mainnet is 8453 (0x2105)
      return Number.parseInt(chainId, 16) === 8453
    } catch (e) {
      console.error("Chain validation error:", e)
      return false
    }
  }

  const connect = async (walletType?: string) => {
    console.log("[v0] Attempting to connect wallet, type:", walletType)

    let ethProvider: any = null
    const farcasterProvider = getFarcasterProvider()

    try {
      if (walletType === "farcaster" && farcasterProvider) {
        ethProvider = farcasterProvider
        console.log("[v0] Using Farcaster Frame provider")
      } else if (!walletType) {
        // Auto-detect priority: Farcaster -> Injected (Mobile) -> Desktop Extensions
        if (farcasterProvider) {
          ethProvider = farcasterProvider
          console.log("[v0] Auto-selected Farcaster provider")
        } else if (window.ethereum) {
          ethProvider = window.ethereum
          console.log("[v0] Auto-selected injected provider")
        } else if (window.okxwallet) {
          ethProvider = window.okxwallet
        } else if (window.BinanceChain) {
          ethProvider = window.BinanceChain
        }
      }
      // Select the appropriate provider based on wallet type
      else if (walletType === "okx" && window.okxwallet) {
        ethProvider = window.okxwallet
        console.log("[v0] Using OKX Wallet provider")
      } else if (walletType === "binance" && window.BinanceChain) {
        ethProvider = window.BinanceChain
        console.log("[v0] Using Binance Web3 Wallet provider")
      } else if (walletType === "coinbase" && window.ethereum?.isCoinbaseWallet) {
        ethProvider = window.ethereum
        console.log("[v0] Using Coinbase Wallet provider")
      } else if (walletType === "metamask" && window.ethereum?.isMetaMask) {
        ethProvider = window.ethereum
        console.log("[v0] Using MetaMask provider")
      } else if (window.ethereum) {
        // Fallback to generic ethereum provider
        ethProvider = window.ethereum
        console.log("[v0] Using generic Ethereum provider")
      } else {
        toast({
          title: "Wallet not found",
          description:
            "No wallet detected. If you are on mobile, please use a Web3 browser like Coinbase Wallet or Warpcast.",
          variant: "destructive",
        })
        return
      }

      // Create ethers provider and request accounts
      const browserProvider = new ethers.BrowserProvider(ethProvider)
      console.log("[v0] Requesting accounts...")

      // Some mobile wallets might fail if we don't catch the request
      let accounts: string[] = []
      try {
        accounts = await browserProvider.send("eth_requestAccounts", [])
      } catch (reqError: any) {
        // Handle user rejection specifically
        if (reqError.code === 4001) {
          throw new Error("Connection rejected by user")
        }
        console.error("[v0] Request accounts error:", reqError)
        throw new Error("Failed to request accounts. Please try opening your wallet manually.")
      }

      console.log("[v0] Accounts received:", accounts)

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from wallet")
      }

      const network = await browserProvider.getNetwork()
      const walletSigner = await browserProvider.getSigner()

      setProvider(browserProvider)
      setSigner(walletSigner)
      setAddress(accounts[0])
      setChainId(Number(network.chainId))

      console.log("[v0] Wallet connected:", accounts[0], "Chain:", Number(network.chainId))

      toast({
        title: "Wallet Connected",
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      })

      // Switch to Base network if not already
      if (Number(network.chainId) !== 8453) {
        console.log("[v0] Switching to Base network...")
        setIsSwitchingChain(true)
        try {
          const switchPromise = ethProvider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x2105" }], // Base mainnet
          })

          // Race against a timeout
          await Promise.race([
            switchPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("Switch timeout")), 10000)),
          ])

          setChainId(8453)

          toast({
            title: "Network Switched",
            description: "Successfully switched to Base network",
          })

          const isValid = await validateChain(ethProvider)
          if (!isValid) {
            console.warn("Chain switch appeared to succeed but chain ID is still incorrect")
          }
        } catch (switchError: any) {
          console.log("[v0] Switch error:", switchError)
          // This error code indicates that the chain has not been added to the wallet
          if (switchError.code === 4902 || switchError.message?.includes("Unrecognized chain")) {
            try {
              await ethProvider.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0x2105",
                    chainName: "Base",
                    nativeCurrency: {
                      name: "Ethereum",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: ["https://mainnet.base.org"],
                    blockExplorerUrls: ["https://basescan.org"],
                  },
                ],
              })
              setChainId(8453)
            } catch (addError) {
              console.error("[v0] Failed to add Base network:", addError)
              toast({
                title: "Network Error",
                description: "Failed to add Base network. Please add it manually.",
                variant: "destructive",
              })
            }
          } else {
            // Don't show error for user rejection of switch
            if (switchError.code !== 4001) {
              toast({
                title: "Network Switch Required",
                description: "Please switch to Base network in your wallet to continue.",
                variant: "default",
              })
            }
          }
        } finally {
          setIsSwitchingChain(false)
        }
      }
    } catch (error: any) {
      console.error("[v0] Failed to connect wallet:", error)
      if (error.message === "Connection rejected by user" || error.code === 4001) {
        toast({
          title: "Connection Cancelled",
          description: "You cancelled the wallet connection.",
          variant: "default",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect wallet. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const disconnect = () => {
    console.log("[v0] Disconnecting wallet")
    setAddress(null)
    setChainId(null)
    setProvider(null)
    setSigner(null)
  }

  useEffect(() => {
    // Detect available wallets on mount
    const wallets = detectWallets()
    setAvailableWallets(wallets)
    console.log("[v0] Available wallets:", wallets)

    const checkExistingConnection = async () => {
      try {
        const farcasterProvider = getFarcasterProvider()
        if (farcasterProvider) {
          try {
            const accounts = await farcasterProvider.request({ method: "eth_accounts" })
            if (accounts && accounts.length > 0) {
              console.log("[v0] Found existing Farcaster connection")
              await connect("farcaster")
              return
            }
          } catch (e) {
            console.warn("[v0] Error checking Farcaster accounts:", e)
          }
        }

        // Try OKX first
        if (window.okxwallet) {
          const accounts = await window.okxwallet.request({ method: "eth_accounts" })
          if (accounts && accounts.length > 0) {
            console.log("[v0] Found existing OKX connection")
            await connect("okx")
            return
          }
        }

        // Try Binance
        if (window.BinanceChain) {
          const accounts = await window.BinanceChain.request({ method: "eth_accounts" })
          if (accounts && accounts.length > 0) {
            console.log("[v0] Found existing Binance connection")
            await connect("binance")
            return
          }
        }

        // Try Coinbase Wallet
        if (window.ethereum?.isCoinbaseWallet) {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts && accounts.length > 0) {
            console.log("[v0] Found existing Coinbase connection")
            await connect("coinbase")
            return
          }
        }

        // Try MetaMask
        if (window.ethereum?.isMetaMask) {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts && accounts.length > 0) {
            console.log("[v0] Found existing MetaMask connection")
            await connect("metamask")
            return
          }
        }

        // Try generic ethereum
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts && accounts.length > 0) {
            console.log("[v0] Found existing Ethereum connection")
            await connect() // Auto-connect generic
            return
          }
        }
      } catch (error) {
        console.error("[v0] Error checking existing connection:", error)
      }
    }

    setTimeout(checkExistingConnection, 500)

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("[v0] Accounts changed:", accounts)
      if (accounts.length === 0) {
        disconnect()
      } else {
        setAddress(accounts[0])
      }
    }

    const handleChainChanged = (newChainId: string) => {
      console.log("[v0] Chain changed:", newChainId)
      setChainId(Number.parseInt(newChainId, 16))
      // Reload page on chain change is recommended by MetaMask but we'll just update state
      // window.location.reload()
    }

    const setupListeners = (provider: any) => {
      if (!provider) return

      try {
        // Use standard removeListener if available, otherwise try removeAllListeners or off
        if (provider.on) {
          provider.on("accountsChanged", handleAccountsChanged)
          provider.on("chainChanged", handleChainChanged)
        }
      } catch (e) {
        console.error("[v0] Error setting up listeners:", e)
      }
    }

    const removeListeners = (provider: any) => {
      if (!provider) return

      try {
        if (provider.removeListener) {
          provider.removeListener("accountsChanged", handleAccountsChanged)
          provider.removeListener("chainChanged", handleChainChanged)
        } else if (provider.off) {
          provider.off("accountsChanged", handleAccountsChanged)
          provider.off("chainChanged", handleChainChanged)
        }
      } catch (e) {
        console.error("[v0] Error removing listeners:", e)
      }
    }

    const farcasterProvider = getFarcasterProvider()
    setupListeners(farcasterProvider)
    setupListeners(window.okxwallet)
    setupListeners(window.BinanceChain)
    setupListeners(window.ethereum)

    return () => {
      // Cleanup listeners
      removeListeners(farcasterProvider)
      removeListeners(window.okxwallet)
      removeListeners(window.BinanceChain)
      removeListeners(window.ethereum)
    }
  }, [])

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        chainId,
        connect,
        disconnect,
        provider,
        signer,
        availableWallets,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
