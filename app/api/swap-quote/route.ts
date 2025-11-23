import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sellToken = searchParams.get("sellToken")
  const buyToken = searchParams.get("buyToken")
  const sellAmount = searchParams.get("sellAmount")
  const slippage = searchParams.get("slippage") || "1"
  const sender = searchParams.get("sender")

  console.log("[v0] Swap quote request received")

  if (!sellToken || !buyToken || !sellAmount) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(sellToken) || !/^0x[a-fA-F0-9]{40}$/.test(buyToken)) {
    return NextResponse.json({ error: "Invalid token address" }, { status: 400 })
  }

  const slippageNum = Number.parseFloat(slippage)
  if (isNaN(slippageNum) || slippageNum < 0 || slippageNum > 50) {
    return NextResponse.json({ error: "Invalid slippage value" }, { status: 400 })
  }

  try {
    // Use OpenOcean API for Base network (Chain ID 8453)
    // OpenOcean uses 'base' as chain identifier
    const chain = "base"
    const gasPrice = "1.5" // Default gas price in gwei if needed

    // 1. Get Quote and Params from OpenOcean
    // OpenOcean requires amount in natural units (with decimals) for the 'amount' param in v3/v4
    // But let's check the specific endpoint requirements.
    // V4 Quote: https://open-api.openocean.finance/v4/base/quote

    // Note: OpenOcean API expects amount in "units" (e.g. 1.5 ETH), NOT wei, for 'amount' param usually,
    // BUT for 'amountDecimals' it expects raw units.
    // Let's use the 'swap_quote' endpoint which usually returns calldata.

    const baseUrl = `https://open-api.openocean.finance/v3/${chain}`

    // We need to know decimals to convert wei to unit if API requires unit
    // However, OpenOcean V3 'quote' endpoint takes 'amount' in natural units (e.g. 1.0)
    // OR 'swap_quote' might take raw.
    // Let's try the V4 endpoint which is more modern.

    const v4BaseUrl = `https://open-api.openocean.finance/v4/${chain}`

    const YOUR_WALLET_ADDRESS = process.env.NEXT_PUBLIC_FEE_RECIPIENT || "0x23684DDbD3C0d0992DbBa0F2c15D75f005B76AD8"

    const params = new URLSearchParams({
      inTokenAddress: sellToken,
      outTokenAddress: buyToken,
      amount: sellAmount,
      amountDecimals: sellAmount,
      gasPrice: "5000000",
      slippage: slippage,
      account: sender || "0x0000000000000000000000000000000000000000",
      referrer: YOUR_WALLET_ADDRESS, // Added referrer for monetization
    })

    console.log("[v0] Fetching quote from OpenOcean")

    const response = await fetch(`${v4BaseUrl}/swap?${params.toString()}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] OpenOcean API error:", errorText)
      throw new Error(`OpenOcean API error: ${response.statusText}`)
    }

    const data = await response.json()
    // console.log("[v0] OpenOcean response:", data)

    if (data.code !== 200) {
      throw new Error(data.message || "OpenOcean API returned error")
    }

    const result = data.data

    return NextResponse.json({
      buyAmount: result.outAmount,
      sellAmount: sellAmount,
      price: (Number(result.outAmount) / Number(sellAmount)).toString(), // Approximate price
      estimatedGas: result.estimatedGas || "200000",
      to: result.to,
      data: result.data,
      value: result.value,
      gasPrice: result.gasPrice,
      buyTokenAddress: buyToken,
      sellTokenAddress: sellToken,
      priceImpact: result.priceImpact || "0",
      minOutAmount: result.minOutAmount,
      route: "OpenOcean",
    })
  } catch (error: any) {
    console.error("[v0] Swap quote error:", error)

    // Fallback for UI testing if API fails (so UI doesn't break completely)
    // But we return an error flag so UI knows it's not executable
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch swap quote",
        buyAmount: "0",
        sellAmount: sellAmount,
        route: "Error",
      },
      { status: 500 },
    )
  }
}
