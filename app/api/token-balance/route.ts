import { type NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tokenAddress = searchParams.get("token")
  const walletAddress = searchParams.get("wallet")

  if (!tokenAddress || !walletAddress) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
  }

  try {
    // Use Base RPC
    const provider = new ethers.JsonRpcProvider(process.env.RPC_HTTP || "https://mainnet.base.org")

    // Handle native ETH
    if (tokenAddress.toLowerCase() === "native" || tokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
      const balance = await provider.getBalance(walletAddress)
      return NextResponse.json({
        balance: ethers.formatEther(balance),
        decimals: 18,
        symbol: "ETH",
        formatted: ethers.formatEther(balance),
      })
    }

    // ERC20 token
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

    const [balance, decimals, symbol] = await Promise.all([
      tokenContract.balanceOf(walletAddress),
      tokenContract.decimals(),
      tokenContract.symbol(),
    ])

    const formatted = ethers.formatUnits(balance, decimals)

    return NextResponse.json({
      balance: balance.toString(),
      decimals,
      symbol,
      formatted,
    })
  } catch (error) {
    console.error("Token balance error:", error)
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
  }
}
