import { type NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"

const NOELA_ZEE_ADDRESS = "0x15fE1Efb7C07B49A4e4756Ced33C1E790e89182e"
const REQUIRED_USD_VALUE = 10.0 // $10 USD requirement

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const walletAddress = searchParams.get("wallet")

  if (!walletAddress) {
    return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
  }

  try {
    // 1. Get NOELA_ZEE token balance
    const provider = new ethers.JsonRpcProvider(process.env.RPC_HTTP || "https://mainnet.base.org")
    const tokenContract = new ethers.Contract(NOELA_ZEE_ADDRESS, ERC20_ABI, provider)

    const [balance, decimals] = await Promise.all([tokenContract.balanceOf(walletAddress), tokenContract.decimals()])

    const balanceFormatted = Number(ethers.formatUnits(balance, decimals))

    // 2. Get NOELA_ZEE price from DEX (using a price oracle or DEX API)
    // For now, we'll use a mock price or fetch from CoinGecko/DexScreener
    // TODO: Replace with actual price feed
    let noelaPrice = 0.001 // Default fallback price in USD

    try {
      // Try to fetch real price from DexScreener API (Base network)
      const priceRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${NOELA_ZEE_ADDRESS}`, {
        next: { revalidate: 60 },
      })
      const priceData = await priceRes.json()

      if (priceData.pairs && priceData.pairs.length > 0) {
        // Get the pair with highest liquidity on Base
        const basePair = priceData.pairs.find((p: any) => p.chainId === "base")
        if (basePair && basePair.priceUsd) {
          noelaPrice = Number.parseFloat(basePair.priceUsd)
        }
      }
    } catch (priceError) {
      console.error("Failed to fetch NOELA price:", priceError)
      // Use fallback price
    }

    // 3. Calculate USD value
    const balanceUSD = balanceFormatted * noelaPrice
    const isValid = balanceUSD >= REQUIRED_USD_VALUE

    return NextResponse.json({
      isValid,
      balanceUSD,
      balanceNoela: balanceFormatted,
      noelaPrice,
      requiredUSD: REQUIRED_USD_VALUE,
      tokenAddress: NOELA_ZEE_ADDRESS,
    })
  } catch (error) {
    console.error("NOELA holding verification error:", error)
    return NextResponse.json(
      {
        isValid: false,
        error: "Failed to verify NOELA holding",
      },
      { status: 500 },
    )
  }
}
