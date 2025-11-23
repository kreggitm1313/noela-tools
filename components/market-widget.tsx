"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Activity, ChevronUp, ChevronDown, DollarSign, Percent } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MarketData {
  altIndex: {
    marketCap: number
    dominance: number
    totalMarketCap: number
  }
  eth: {
    price: number
    change24h: number
  }
  trending: Array<{
    id: string
    name: string
    symbol: string
    thumb: string
    data: {
      price: string
      price_change_percentage_24h: {
        usd: number
      }
    }
  }>
}

export function MarketWidget() {
  const [data, setData] = useState<MarketData | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/market-data")
        if (!res.ok) throw new Error("Failed to fetch")
        const jsonData = await res.json()
        setData(jsonData)
        setIsError(false)
      } catch (error) {
        console.error("Market widget error:", error)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    return `$${value.toFixed(2)}`
  }

  if (isError) return null // Hide if error

  return (
    <div className="flex flex-col items-start gap-2">
      {isOpen && data && (
        <Card className="w-[280px] sm:w-[320px] shadow-xl border-blue-100/50 bg-white/95 backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 mb-2">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-[#0052FF] flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Market Pulse
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono bg-blue-50 text-blue-600 border-blue-100">
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {/* ALT Index Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ALT Index</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Alt M.Cap
                  </div>
                  <div className="text-sm font-bold text-slate-900">{formatCurrency(data.altIndex.marketCap)}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Percent className="w-3 h-3" /> Alt Dom
                  </div>
                  <div className="text-sm font-bold text-slate-900">{data.altIndex.dominance.toFixed(1)}%</div>
                </div>
                {/* ETH Data Card */}
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 col-span-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#627EEA] flex items-center justify-center text-white text-[10px] font-bold">
                      ETH
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground">Ethereum</span>
                      <span className="text-sm font-bold text-slate-900">${data.eth.price.toLocaleString()}</span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-xs font-medium flex items-center",
                      data.eth.change24h >= 0 ? "text-green-600" : "text-red-600",
                    )}
                  >
                    {data.eth.change24h >= 0 ? (
                      <ChevronUp className="w-3 h-3 mr-0.5" />
                    ) : (
                      <ChevronDown className="w-3 h-3 mr-0.5" />
                    )}
                    {Math.abs(data.eth.change24h).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Trending Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Trending Now
              </h4>
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-100">
                {data.trending.map((coin) => (
                  <div
                    key={coin.id}
                    className="flex items-center justify-between p-2 hover:bg-blue-50/50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <img src={coin.thumb || "/placeholder.svg"} alt={coin.name} className="w-5 h-5 rounded-full" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors">
                          {coin.symbol}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{coin.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-medium text-slate-900">{coin.data.price}</div>
                      <div
                        className={cn(
                          "text-[10px] font-medium flex items-center justify-end",
                          coin.data.price_change_percentage_24h.usd >= 0 ? "text-green-600" : "text-red-600",
                        )}
                      >
                        {coin.data.price_change_percentage_24h.usd >= 0 ? (
                          <ChevronUp className="w-3 h-3 mr-0.5" />
                        ) : (
                          <ChevronDown className="w-3 h-3 mr-0.5" />
                        )}
                        {Math.abs(coin.data.price_change_percentage_24h.usd).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="sm"
        className={cn(
          "rounded-full shadow-lg transition-all duration-300 border",
          isOpen
            ? "bg-[#0052FF] text-white border-[#0052FF] hover:bg-[#0041CC]"
            : "bg-white text-slate-900 border-blue-100 hover:border-blue-300 hover:bg-blue-50",
        )}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : (
          <Activity className="w-4 h-4 mr-2" />
        )}
        <span className="font-semibold text-xs">Market Pulse</span>
        {isOpen ? <ChevronDown className="w-4 h-4 ml-2" /> : <ChevronUp className="w-4 h-4 ml-2" />}
      </Button>
    </div>
  )
}
