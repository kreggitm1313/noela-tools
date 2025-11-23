interface HFModelConfig {
  name: string
  type: "text-to-image" | "image-to-image"
  free: boolean
}

const IMAGE_MODELS: HFModelConfig[] = [
  { name: "black-forest-labs/FLUX.1-schnell", type: "text-to-image", free: true },
  { name: "stabilityai/stable-diffusion-xl-base-1.0", type: "text-to-image", free: true },
  { name: "runwayml/stable-diffusion-v1-5", type: "text-to-image", free: true },
  { name: "prompthero/openjourney-v4", type: "text-to-image", free: true },
]

export async function generateImageWithHF(
  prompt: string,
  options: {
    width?: number
    height?: number
    negative_prompt?: string
  } = {},
): Promise<string> {
  const apiKey = process.env.HF_API_KEY

  if (!apiKey) {
    console.warn("[v0] HF_API_KEY missing, cannot generate image.")
    throw new Error("Service configuration missing (HF_KEY). Please try again later.")
  }

  if (!apiKey.startsWith("hf_")) {
    throw new Error('Invalid HF_API_KEY format. Hugging Face API keys should start with "hf_"')
  }

  const models = IMAGE_MODELS
  let lastError: Error | null = null

  for (const model of models) {
    try {
      console.log(`[v0] Trying Hugging Face model: ${model.name}`)

      const response = await fetch(`https://api-inference.huggingface.co/${model.name}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            negative_prompt: options.negative_prompt || "blurry, bad quality, distorted, ugly, low resolution",
            num_inference_steps: 25,
            guidance_scale: 7.5,
          },
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorBody)
        } catch {
          errorData = { error: errorBody }
        }

        console.log(`[v0] Model ${model.name} failed with status ${response.status}:`, errorData)

        if (response.status === 429) {
          console.log(`[v0] Rate limit hit, trying next model...`)
          lastError = new Error(`Rate limit exceeded for ${model.name}`)
          continue
        }

        if (response.status === 503 || errorBody.includes("loading") || errorBody.includes("currently loading")) {
          console.log(`[v0] Model ${model.name} is loading, waiting 10 seconds...`)
          await new Promise((resolve) => setTimeout(resolve, 10000))

          const retryResponse = await fetch(`https://api-inference.huggingface.co/${model.name}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                negative_prompt: options.negative_prompt || "blurry, bad quality, distorted",
                num_inference_steps: 25,
                guidance_scale: 7.5,
              },
            }),
          })

          if (retryResponse.ok) {
            const imageBuffer = await retryResponse.arrayBuffer()
            const base64 = Buffer.from(imageBuffer).toString("base64")
            console.log(`[v0] Success with model ${model.name} after retry`)
            return `data:image/png;base64,${base64}`
          } else {
            const retryError = await retryResponse.text()
            console.log(`[v0] Retry failed:`, retryError)
          }
        }

        lastError = new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`)
        continue
      }

      const imageBuffer = await response.arrayBuffer()
      const base64 = Buffer.from(imageBuffer).toString("base64")
      console.log(`[v0] Successfully generated image with ${model.name}`)
      return `data:image/png;base64,${base64}`
    } catch (error) {
      console.log(`[v0] Error with model ${model.name}:`, error)
      lastError = error as Error
      continue
    }
  }

  const errorMessage = lastError?.message || "All models failed"
  throw new Error(`Hugging Face generation failed: ${errorMessage}. Please check your HF_API_KEY and try again later.`)
}

export function getAvailableModels() {
  return IMAGE_MODELS
}
