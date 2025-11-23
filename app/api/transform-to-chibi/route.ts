import { type NextRequest, NextResponse } from "next/server"
import { generateWithFallback } from "@/lib/pollinations-helper"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

// Initialize OpenAI provider
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-init",
})

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()

    console.log("[v0] Transform to chibi request received")

    if (!image || !image.startsWith("data:image/")) {
      return NextResponse.json(
        {
          error: "Invalid image format",
        },
        { status: 400 },
      )
    }

    const imageSizeKB = (image.length * 3) / 4 / 1024
    console.log("[v0] Image size:", imageSizeKB.toFixed(2), "KB")

    if (imageSizeKB > 4000) {
      return NextResponse.json(
        {
          error: "Image too large. Please use an image smaller than 3MB.",
        },
        { status: 413 },
      )
    }

    let promptDescription = ""

    // Step 1: Analyze image with GPT-4o if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log("[v0] Analyzing image with GPT-4o Vision...")
        const { text } = await generateText({
          model: openai("gpt-4o"),
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Describe the main person in this image for an anime chibi character generation. Focus strictly on visual traits: gender, hair color & style, eye color, clothing details, accessories (glasses, hats), and facial expression. Keep it comma-separated and concise. Example: 'boy, messy black hair, blue hoodie, glasses, happy smile'.",
                },
                { type: "image", image: image }, // image is already base64 data URL
              ],
            },
          ],
        })

        promptDescription = text
        console.log("[v0] Vision analysis result:", promptDescription)
      } catch (visionError) {
        console.error("[v0] Vision analysis failed:", visionError)
        // Fallback if vision fails
        promptDescription = "cute anime character, colorful style"
      }
    } else {
      console.warn("[v0] No OpenAI API key found, skipping vision analysis")
      promptDescription = "cute anime character, colorful style"
    }

    // Step 2: Generate Chibi using the description
    const enhancedPrompt = `cute chibi version of ${promptDescription}, anime style, big sparkly eyes, adorable proportions, glossy finish, pastel colors, kawaii aesthetic, high quality digital art, masterpiece, white background, soft lighting`

    console.log("[v0] Generating chibi with prompt:", enhancedPrompt)

    try {
      const imageUrl = await generateWithFallback(enhancedPrompt, 1024, 1024)

      console.log("[v0] Successfully transformed image to chibi")
      return NextResponse.json({ imageUrl, fallback: false, promptUsed: enhancedPrompt })
    } catch (error) {
      console.error("[v0] Pollinations transformation error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to transform image"

      return NextResponse.json({
        error: errorMessage,
        imageUrl: `/placeholder.svg?height=1024&width=1024&query=${encodeURIComponent(promptDescription)}`,
        fallback: true,
      })
    }
  } catch (error) {
    console.error("[v0] Transform to chibi error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to transform image"
    return NextResponse.json(
      {
        error: errorMessage,
        imageUrl: `/placeholder.svg?height=1024&width=1024&query=cute anime chibi character`,
        fallback: true,
      },
      { status: 500 },
    )
  }
}
