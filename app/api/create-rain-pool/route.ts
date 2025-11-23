import { type NextRequest, NextResponse } from "next/server"

const NOELA_ZEE_ADDRESS = "0x15fE1Efb7C07B49A4e4756Ced33C1E790e89182e"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tokenAddress, amount, walletAddress, targetLink } = body

    if (!tokenAddress || !amount || !walletAddress || !targetLink) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Create pool record (in production, save to database)
    const poolId = `pool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // TODO: Save to database
    // await db.pools.create({
    //   id: poolId,
    //   tokenAddress,
    //   amount,
    //   creator: walletAddress,
    //   createdAt: new Date(),
    //   status: 'active',
    //   link: targetLink // Added link to DB mock
    // })

    return NextResponse.json({
      success: true,
      poolId,
      message: "Rain Pool created successfully",
      tokenAddress,
      amount,
      creator: walletAddress,
      targetLink, // Return targetLink in response
    })
  } catch (error: any) {
    console.error("Pool creation error:", error)
    return NextResponse.json(
      {
        error: "Failed to create pool",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
