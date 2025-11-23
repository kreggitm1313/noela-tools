/**
 * Pollinations.ai - Free AI image generation with no API key required
 * Uses their public API for text-to-image generation
 */

interface PollinationsOptions {
  prompt: string
  width?: number
  height?: number
  seed?: number
  model?: "flux" | "flux-realism" | "flux-anime" | "flux-3d" | "turbo"
  nologo?: boolean
  enhance?: boolean
}

export async function generateImageWithPollinations(options: PollinationsOptions): Promise<string> {
  const {
    prompt,
    width = 1024,
    height = 1024,
    seed = Math.floor(Math.random() * 1000000),
    model = "flux-anime",
    nologo = true,
    enhance = true,
  } = options

  try {
    // Pollinations.ai free API - no authentication needed
    const encodedPrompt = encodeURIComponent(prompt)
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=${nologo}&enhance=${enhance}`

    console.log("[v0] Generating image with Pollinations.ai:", { prompt, width, height, model })

    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NoelaFrame/1.0)",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Pollinations API failed: ${response.status} ${response.statusText}`)
    }

    // Get the image as blob
    const blob = await response.blob()

    if (!blob || blob.size === 0) {
      throw new Error("Received empty image from Pollinations")
    }

    // Convert to base64
    const arrayBuffer = await blob.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const mimeType = blob.type || "image/jpeg"

    console.log("[v0] Successfully generated image with Pollinations.ai")

    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error("[v0] Pollinations generation error:", error)
    throw error
  }
}

// Helper function with automatic retry
export async function generateWithFallback(prompt: string, width = 1024, height = 1024): Promise<string> {
  const models: Array<"flux-anime" | "flux" | "turbo"> = ["flux-anime", "flux", "turbo"]

  for (const model of models) {
    try {
      console.log(`[v0] Trying Pollinations with model: ${model}`)
      return await generateImageWithPollinations({
        prompt,
        width,
        height,
        model,
      })
    } catch (error) {
      console.error(`[v0] Model ${model} failed, trying next...`)
      continue
    }
  }

  // If all models fail, return placeholder
  console.warn("[v0] All Pollinations models failed, using placeholder")
  return `/placeholder.svg?height=${height}&width=${width}&query=${encodeURIComponent(prompt)}`
}

export async function generateImageURLOnly(options: PollinationsOptions): Promise<string> {
  const {
    prompt,
    width = 1024,
    height = 1024,
    seed = Math.floor(Math.random() * 1000000),
    model = "flux-anime",
    nologo = true,
    enhance = true,
  } = options

  // Return direct Pollinations URL - they handle hosting
  const encodedPrompt = encodeURIComponent(prompt)
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=${nologo}&enhance=${enhance}&_t=${Date.now()}`

  console.log("[v0] Generated direct Pollinations URL (instant, no generation wait)")
  return url
}

export async function generateWithFallbackInstant(prompt: string, width = 1024, height = 1024): Promise<string> {
  // Use direct URL method - Pollinations generates on-the-fly when accessed
  // This is INSTANT and has no limits since we're not downloading
  const models: Array<"flux-anime" | "flux" | "turbo"> = ["flux-anime", "flux", "turbo"]

  // We default to flux-anime, but if it fails loading on client side,
  // we can't easily switch models from the server once we return the URL.
  // However, we can try to verify if the primary model service is responsive if needed.
  // For now, let's stick to the most reliable model which is usually the default.

  try {
    console.log(`[v0] Using instant Pollinations URL generation (no wait time)`)
    return generateImageURLOnly({
      prompt,
      width,
      height,
      model: "flux-anime", // Flux-anime is usually best for chibi
    })
  } catch (error) {
    console.error(`[v0] URL generation failed, using placeholder`)
    return `/placeholder.svg?height=${height}&width=${width}&query=${encodeURIComponent(prompt)}`
  }
}
