// Utility for handling OpenAI API calls with automatic fallback to cheaper models

interface ModelConfig {
  name: string
  cost: 'high' | 'medium' | 'low'
  capabilities: string[]
}

const VISION_MODELS: ModelConfig[] = [
  { name: 'gpt-4o', cost: 'high', capabilities: ['vision', 'fast'] },
  { name: 'gpt-4o-mini', cost: 'low', capabilities: ['vision', 'fast', 'cheap'] },
]

const IMAGE_MODELS: ModelConfig[] = [
  { name: 'dall-e-3', cost: 'high', capabilities: ['hd', 'quality'] },
  { name: 'dall-e-2', cost: 'low', capabilities: ['standard', 'cheap'] },
]

export async function callOpenAIWithFallback(
  endpoint: string,
  primaryPayload: any,
  fallbackPayloads: any[]
): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set. Please add your OpenAI API key to your Vercel project settings.')
  }

  // Validate that it's actually an OpenAI key (starts with 'sk-')
  if (!apiKey.startsWith('sk-')) {
    throw new Error(`Invalid OPENAI_API_KEY format. The key should start with 'sk-' but starts with '${apiKey.substring(0, 3)}...'. You may have set HF_API_KEY instead of OPENAI_API_KEY.`)
  }

  const allPayloads = [primaryPayload, ...fallbackPayloads]

  for (let i = 0; i < allPayloads.length; i++) {
    const payload = allPayloads[i]
    const isPrimary = i === 0
    
    console.log(`[v0] Attempting ${isPrimary ? 'primary' : `fallback ${i}`} model:`, payload.model)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        console.log(`[v0] Success with model:`, payload.model)
        return response
      }

      const errorText = await response.text()
      let shouldFallback = false

      try {
        const errorData = JSON.parse(errorText)
        const errorCode = errorData.error?.code

        // Fallback on quota/rate limit errors
        if (
          errorCode === 'insufficient_quota' ||
          errorCode === 'rate_limit_exceeded' ||
          errorCode === 'billing_hard_limit_reached' ||
          response.status === 429
        ) {
          shouldFallback = true
          console.log(`[v0] Quota/rate limit hit, trying fallback...`)
        }
      } catch (e) {
        // Could not parse error, don't fallback
      }

      if (!shouldFallback || i === allPayloads.length - 1) {
        // Don't fallback or no more fallbacks available
        return response
      }

      // Continue to next fallback
      console.log(`[v0] Falling back to cheaper model...`)

    } catch (error) {
      if (i === allPayloads.length - 1) {
        throw error
      }
      console.log(`[v0] Error with model ${payload.model}, trying fallback...`)
    }
  }

  throw new Error('All models failed')
}

export function getVisionModels() {
  return VISION_MODELS
}

export function getImageModels() {
  return IMAGE_MODELS
}
