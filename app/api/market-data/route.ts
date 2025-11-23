import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Fetch Global Data (Market Cap, Dominance)
    const globalRes = await fetch("https://api.coingecko.com/api/v3/global", {
      next: { revalidate: 60 }, // Cache for 60 seconds
    })
    const globalData = await globalRes.json()

    // Fetch Trending Coins
    const trendingRes = await fetch("https://api.coingecko.com/api/v3/search/trending", {
      next: { revalidate: 60 }, // Cache for 60 seconds
    })
    const trendingData = await trendingRes.json()

    const ethRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true",
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
      },
    )
    const ethData = await ethRes.json()

    if (!globalData.data || !trendingData.coins || !ethData.ethereum) {
      throw new Error("Invalid data from CoinGecko")
    }

    // Calculate ALT Index
    // Altcoin Market Cap = Total Market Cap - BTC Market Cap (approx)
    // Or just use Total Market Cap and BTC Dominance to infer
    const totalMarketCap = globalData.data.total_market_cap.usd
    const btcDominance = globalData.data.market_cap_percentage.btc
    const altDominance = 100 - btcDominance
    const altMarketCap = totalMarketCap * (altDominance / 100)

    return NextResponse.json({
      altIndex: {
        marketCap: altMarketCap,
        dominance: altDominance,
        totalMarketCap: totalMarketCap,
      },
      eth: {
        price: ethData.ethereum.usd,
        change24h: ethData.ethereum.usd_24h_change,
      },
      trending: trendingData.coins.slice(0, 5).map((item: any) => ({
        id: item.item.id,
        name: item.item.name,
        symbol: item.item.symbol,
        thumb: item.item.thumb,
        price_btc: item.item.price_btc,
        score: item.item.score,
        data: item.item.data,
      })),
    })
  } catch (error) {
    console.error("Error fetching market data:", error)
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 })
  }
}
