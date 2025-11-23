import { type NextRequest, NextResponse } from "next/server"
import { generateWithFallbackInstant } from "@/lib/pollinations-helper"

export async function POST(req: NextRequest) {
  try {
    const { prompt, style, aspectRatio } = await req.json()

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Prompt is required",
        },
        { status: 400 },
      )
    }

    // Build enhanced prompt based on style
    const stylePrompts = {
      cute: "cute pastel colors, soft shading, kawaii aesthetic, highly detailed anime eyes",
      glossy: "glossy finish, vibrant colors, shiny highlights, 8k resolution, professional illustration",
      soft: "soft dreamy colors, gentle lighting, ethereal atmosphere, high detail, watercolor style",
      futuristic: "futuristic neon colors, holographic elements, cyberpunk aesthetic, sharp focus, digital art",
    }

    const enhancedPrompt = `${prompt}, anime chibi style, centered composition, perfect for PFP, ${stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.cute}, high quality digital art, masterpiece, 8k resolution, highly detailed, trending on artstation, clean background`

    console.log("[v0] Generate chibi request:", { prompt, style, aspectRatio })
    console.log("[v0] Enhanced prompt:", enhancedPrompt)

    const dimensions =
      aspectRatio === "1:1"
        ? { width: 1024, height: 1024 }
        : aspectRatio === "16:9"
          ? { width: 1280, height: 720 }
          : { width: 720, height: 1280 }

    try {
      console.log("[v0] Starting image generation...")
      const imageUrl = await generateWithFallbackInstant(enhancedPrompt, dimensions.width, dimensions.height)

      console.log("[v0] Successfully generated chibi image URL:", imageUrl)
      return NextResponse.json({ imageUrl, fallback: false })
    } catch (error) {
      console.error("[v0] Pollinations generation error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate chibi URL"

      return NextResponse.json(
        {
          error: `Image generation failed: ${errorMessage}. Please try again.`,
          fallback: true,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Generate chibi error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to generate chibi"
    return NextResponse.json(
      {
        error: errorMessage,
        fallback: true,
      },
      { status: 500 },
    )
  }
}
