"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Wallet, LogOut, ChevronDown, CreditCard, Smartphone } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"

export function WalletConnectButton() {
  const { isConnected, address, connect, disconnect, availableWallets } = useWallet()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = typeof window.navigator === "undefined" ? "" : navigator.userAgent
      const mobile = Boolean(userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i))
      setIsMobile(mobile)
    }
    checkMobile()
  }, [])

  const handleConnect = async (walletType?: string) => {
    setIsOpen(false)
    await connect(walletType)
  }

  const handleSmartConnect = () => {
    // If only one wallet is available or we are on mobile, connect directly
    if (isMobile || availableWallets.length === 1 || availableWallets.includes("farcaster")) {
      handleConnect()
    } else {
      setIsOpen(true)
    }
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="font-mono bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            {address.slice(0, 6)}...{address.slice(-4)}
            <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={disconnect} className="text-red-600 cursor-pointer">
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <Button
        onClick={handleSmartConnect}
        className="bg-[#0052FF] hover:bg-[#0041CC] text-white font-medium shadow-sm transition-all hover:shadow-md"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>Choose a wallet to connect to Base network.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {availableWallets.includes("farcaster") && (
              <Button
                variant="outline"
                className="justify-start h-14 px-4 border-purple-200 bg-purple-50 hover:bg-purple-100"
                onClick={() => handleConnect("farcaster")}
              >
                <Smartphone className="w-6 h-6 mr-3 text-purple-600" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-purple-900">Farcaster Wallet</span>
                  <span className="text-xs text-purple-600">Connected via Frame</span>
                </div>
              </Button>
            )}

            {availableWallets.includes("metamask") && (
              <Button
                variant="outline"
                className="justify-start h-14 px-4 bg-transparent"
                onClick={() => handleConnect("metamask")}
              >
                <div className="w-6 h-6 mr-3 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                  M
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">MetaMask</span>
                  <span className="text-xs text-muted-foreground">Browser Extension</span>
                </div>
              </Button>
            )}

            {availableWallets.includes("coinbase") && (
              <Button
                variant="outline"
                className="justify-start h-14 px-4 bg-transparent"
                onClick={() => handleConnect("coinbase")}
              >
                <div className="w-6 h-6 mr-3 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  C
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Coinbase Wallet</span>
                  <span className="text-xs text-muted-foreground">Mobile & Extension</span>
                </div>
              </Button>
            )}

            {availableWallets.includes("okx") && (
              <Button
                variant="outline"
                className="justify-start h-14 px-4 bg-transparent"
                onClick={() => handleConnect("okx")}
              >
                <div className="w-6 h-6 mr-3 rounded-full bg-black flex items-center justify-center text-white font-bold">
                  O
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">OKX Wallet</span>
                  <span className="text-xs text-muted-foreground">Multi-chain Wallet</span>
                </div>
              </Button>
            )}

            {/* Generic option always available as fallback */}
            <Button
              variant="outline"
              className="justify-start h-14 px-4 bg-transparent"
              onClick={() => handleConnect()}
            >
              <CreditCard className="w-6 h-6 mr-3 text-slate-600" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Browser Wallet</span>
                <span className="text-xs text-muted-foreground">Injected Provider</span>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
