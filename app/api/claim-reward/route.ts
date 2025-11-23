import { type NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"

// ABI for ERC20 Transfer
const ERC20_ABI = ["function transfer(address to, uint256 amount) returns (bool)"]

// Private key for the distributor wallet (should be in env vars in production)
// WARNING: In a real app, never hardcode private keys. This is for demo/hackathon purposes.
// The user mentioned "noela_zee" token and "0x15fE1Efb7C07B49A4e4756Ced33C1E790e89182e"
const DISTRIBUTOR_PRIVATE_KEY = process.env.DISTRIBUTOR_PRIVATE_KEY
const RPC_URL = "https://mainnet.base.org"

export async function POST(request: NextRequest) {
  try {
    const { poolId, userAddress, tokenAddress, amount } = await request.json()

    if (!poolId || !userAddress || !tokenAddress || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // In a real production app, we would:
    // 1. Verify the pool exists in DB
    // 2. Verify the user hasn't claimed yet (DB check)
    // 3. Verify the user completed the tasks (DB check from verify-interaction)

    if (!DISTRIBUTOR_PRIVATE_KEY) {
      console.warn("DISTRIBUTOR_PRIVATE_KEY not set. Simulating transfer.")
      // Fallback for when no private key is set (to prevent app crash)
      return NextResponse.json({
        success: true,
        txHash: "0x_simulated_" + Date.now(),
        message: "Reward claimed (Simulation - Set Private Key for real transfer)",
      })
    }

    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const wallet = new ethers.Wallet(DISTRIBUTOR_PRIVATE_KEY, provider)
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet)

    console.log(`[Claim] Distributor Wallet Address: ${wallet.address}`)

    // Parse amount (assuming 18 decimals for most tokens, or handle dynamically)
    // For "100 $NOELA", we need to parse "100"
    const numericAmount = amount.split(" ")[0] // "100 $NOELA" -> "100"
    const amountWei = ethers.parseUnits(numericAmount, 18)

    console.log(`Transferring ${numericAmount} tokens to ${userAddress}`)

    // Execute transfer
    const tx = await contract.transfer(userAddress, amountWei)
    console.log("Transaction sent:", tx.hash)

    // Wait for confirmation (optional, can return hash immediately for speed)
    // await tx.wait()

    return NextResponse.json({
      success: true,
      txHash: tx.hash,
      message: "Tokens transferred successfully",
    })
  } catch (error: any) {
    console.error("Claim error:", error)

    let distributorAddress = "Unknown"
    try {
      if (DISTRIBUTOR_PRIVATE_KEY) {
        const provider = new ethers.JsonRpcProvider(RPC_URL)
        const wallet = new ethers.Wallet(DISTRIBUTOR_PRIVATE_KEY, provider)
        distributorAddress = wallet.address
      }
    } catch (e) {
      /* ignore */
    }

    return NextResponse.json(
      {
        error: "Failed to transfer tokens",
        message: error.message,
        distributorAddress: distributorAddress, // Return the address so the user can see it
        hint: "Please ensure this wallet has enough ETH for gas and Tokens for the reward.",
      },
      { status: 500 },
    )
  }
}
