import { type NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const walletAddress = searchParams.get("wallet")
  const thresholdUSD = 3.0 // $3 USD requirement

  if (!walletAddress) {
    return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
  }

  try {
    // 1. Get ETH Price
    const ethRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd", {
      next: { revalidate: 60 },
    })
    const ethData = await ethRes.json()
    const ethPriceUSD = ethData.ethereum?.usd || 2000 // Fallback price if API fails

    // 2. Get Wallet Balance
    const provider = new ethers.JsonRpcProvider(process.env.RPC_HTTP || "https://mainnet.base.org")
    const balanceWei = await provider.getBalance(walletAddress)
    const balanceEth = Number(ethers.formatEther(balanceWei))

    // 3. Calculate USD Value
    const balanceUSD = balanceEth * ethPriceUSD
    const isValid = balanceUSD >= thresholdUSD

    return NextResponse.json({
      isValid,
      balanceUSD,
      balanceEth,
      thresholdUSD,
      ethPriceUSD,
    })
  } catch (error) {
    console.error("Balance verification error:", error)
    // Fail open or closed? For security, fail closed, but for UX maybe fail open?
    // Let's return false but with error
    return NextResponse.json(
      {
        isValid: false,
        error: "Failed to verify balance",
      },
      { status: 500 },
    )
  }
}
