import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")

  if (!address) {
    return NextResponse.json({ error: "Token address required" }, { status: 400 })
  }

  if (!process.env.GOPLUS_API_KEY) {
    console.warn("GOPLUS_API_KEY is not configured")
    return NextResponse.json({
      buyTax: 0,
      sellTax: 0,
      isHoneypot: false,
      canBuy: true,
      canSell: true,
      warning: "Security data unavailable",
    })
  }

  try {
    const response = await fetch(`https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${address}`, {
      headers: {
        Authorization: `Bearer ${process.env.GOPLUS_API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch token data")
    }

    const data = await response.json()
    const tokenData = data.result?.[address.toLowerCase()]

    if (!tokenData) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 })
    }

    // Extract buy and sell tax
    const buyTax = Number.parseFloat(tokenData.buy_tax || "0") * 100
    const sellTax = Number.parseFloat(tokenData.sell_tax || "0") * 100

    return NextResponse.json({
      buyTax,
      sellTax,
      isHoneypot: tokenData.is_honeypot === "1",
      canBuy: tokenData.cannot_buy === "0",
      canSell: tokenData.cannot_sell_all === "0",
    })
  } catch (error) {
    console.error("Error checking token tax:", error)
    return NextResponse.json({ error: "Failed to check token tax" }, { status: 500 })
  }
}
