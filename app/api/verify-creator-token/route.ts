import { NextResponse } from "next/server"
import { ethers } from "ethers"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tokenAddress = searchParams.get("address")

  if (!tokenAddress) {
    return NextResponse.json({ error: "Token address required" }, { status: 400 })
  }

  try {
    const isCreatorToken = await checkIfCreatorToken(tokenAddress)

    return NextResponse.json({
      isCreatorToken,
      tokenAddress,
    })
  } catch (error) {
    console.error("Error verifying creator token:", error)
    return NextResponse.json({ error: "Failed to verify token", isCreatorToken: false }, { status: 500 })
  }
}

async function checkIfCreatorToken(address: string): Promise<boolean> {
  // Creator tokens are ERC20s deployed via Zora Coins SDK
  // NOT Zora 1155 or 721 contracts (posts/NFTs)

  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_HTTP || "https://mainnet.base.org")

    // Check if contract exists
    const code = await provider.getCode(address)
    if (code === "0x") {
      return false // Not a contract
    }

    // Check for ERC20 interface
    const ERC20_ABI = [
      "function totalSupply() view returns (uint256)",
      "function balanceOf(address) view returns (uint256)",
      "function transfer(address, uint256) returns (bool)",
    ]

    const contract = new ethers.Contract(address, ERC20_ABI, provider)

    try {
      // Try calling ERC20 functions
      await contract.totalSupply()
      await contract.balanceOf(ethers.ZeroAddress)

      // If these succeed, it's likely an ERC20 (could be creator token)
      // For more robust verification, we'd check:
      // 1. Contract deployer is Zora factory
      // 2. Specific creator token functions exist
      // But for now, this basic check prevents 721/1155 from passing
      return true
    } catch (e) {
      // Not ERC20
      return false
    }
  } catch (error) {
    console.error("Error in checkIfCreatorToken:", error)
    return false
  }
}
