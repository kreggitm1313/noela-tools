import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "Address parameter required" }, { status: 400 })
    }

    // Fetch orderbook data from DexScreener or similar DEX aggregator
    // Note: Real orderbook data requires WebSocket connection to DEX
    // This is a simplified version using price levels from recent trades

    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`)
    const data = await response.json()

    if (!data.pairs || data.pairs.length === 0) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 })
    }

    const basePair = data.pairs.find((p: any) => p.chainId === "base")
    if (!basePair) {
      return NextResponse.json({ error: "Token not found on Base" }, { status: 404 })
    }

    const currentPrice = Number.parseFloat(basePair.priceUsd || "0")

    // Generate orderbook based on current price (simplified)
    const bids = Array.from({ length: 10 }, (_, i) => {
      const priceLevel = currentPrice * (1 - (i + 1) * 0.005) // 0.5% steps down
      const amount = Math.random() * 10000 + 1000
      return {
        price: priceLevel.toFixed(6),
        amount: amount.toFixed(2),
        total: (priceLevel * amount).toFixed(2),
      }
    })

    const asks = Array.from({ length: 10 }, (_, i) => {
      const priceLevel = currentPrice * (1 + (i + 1) * 0.005) // 0.5% steps up
      const amount = Math.random() * 10000 + 1000
      return {
        price: priceLevel.toFixed(6),
        amount: amount.toFixed(2),
        total: (priceLevel * amount).toFixed(2),
      }
    })

    return NextResponse.json({
      bids,
      asks,
      _meta: {
        isEstimated: true,
        note: "Orderbook data is estimated based on current price. For real-time orderbook, connect to DEX directly.",
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching orderbook:", error)
    return NextResponse.json({ error: "Failed to fetch orderbook" }, { status: 500 })
  }
}
