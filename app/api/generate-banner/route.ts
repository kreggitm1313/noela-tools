import { type NextRequest, NextResponse } from "next/server"
import { generateWithFallback } from "@/lib/pollinations-helper"

export async function POST(req: NextRequest) {
  try {
    const { prompt, bannerType } = await req.json()

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Prompt is required",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Generate banner request:", { prompt, bannerType })

    const dimensions = {
      banner: { width: 1280, height: 720, ratio: "16:9" },
      header: { width: 1500, height: 500, ratio: "3:1" },
      dexscreener: { width: 600, height: 200, ratio: "3:1" },
    }

    const bannerConfig = dimensions[bannerType as keyof typeof dimensions] || dimensions.banner

    const enhancedPrompt = `Professional ${bannerType} design, ${prompt}, Noela Universe aesthetic with blue and white color scheme, clean modern layout, high quality digital art, perfect for social media, wide banner format, no text overlay, ${bannerConfig.ratio} aspect ratio, masterpiece`

    console.log("[v0] Enhanced banner prompt:", enhancedPrompt)

    try {
      const imageUrl = await generateWithFallback(enhancedPrompt, bannerConfig.width, bannerConfig.height)

      console.log("[v0] Successfully generated banner URL (instant, unlimited)")
      return NextResponse.json({
        imageUrl,
        dimensions: bannerConfig,
        fallback: false,
      })
    } catch (error) {
      console.error("[v0] Banner URL generation error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate banner"

      console.log("[v0] Returning fallback placeholder image")
      return NextResponse.json({
        imageUrl: `/placeholder.svg?height=${bannerConfig.height}&width=${bannerConfig.width}&query=${encodeURIComponent(prompt)}`,
        dimensions: bannerConfig,
        fallback: true,
        message: `Generation service is unavailable. ${errorMessage}`,
      })
    }
  } catch (error) {
    console.error("[v0] Generate banner error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to generate banner"

    const bannerConfig = { width: 1280, height: 720, ratio: "16:9" }
    return NextResponse.json(
      {
        error: errorMessage,
        imageUrl: `/placeholder.svg?height=${bannerConfig.height}&width=${bannerConfig.width}&query=professional banner design`,
        dimensions: bannerConfig,
        fallback: true,
      },
      { status: 500 },
    )
  }
}
