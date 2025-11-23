import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { prompt, tone } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Tweet content is required" }, { status: 400 })
    }

    const systemPrompt = `You are an expert social media manager specializing in Crypto Twitter (CT).
Your goal is to write a natural, engaging, and ${tone || "casual"} reply to the user's tweet.

Guidelines:
- Keep it under 280 characters.
- Use crypto slang naturally (wagmi, based, alpha) ONLY if it fits the context.
- Don't sound like a bot. Be conversational.
- If the tone is "funny", use subtle wit or sarcasm.
- If the tone is "insightful", provide value or a unique perspective.
- Do not use hashtags unless absolutely necessary.`

    const userMessage = `Here is the tweet to reply to: "${prompt}"`

    let reply = ""
    let provider = ""

    if (process.env.XAI_API_KEY) {
      try {
        console.log("[v0] Attempting xAI...")
        const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            temperature: 0.7,
          }),
        })

        if (xaiResponse.ok) {
          const data = await xaiResponse.json()
          reply = data.choices[0].message.content
          provider = "xAI (Grok)"
        } else {
          console.warn("[v0] xAI failed:", xaiResponse.status, await xaiResponse.text())
        }
      } catch (error) {
        console.error("[v0] xAI error, failing over...", error)
      }
    }

    if (!reply && process.env.DEEPSEEK_API_KEY) {
      try {
        console.log("[v0] Attempting DeepSeek fallback...")
        const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            temperature: 0.7,
          }),
        })

        if (deepseekResponse.ok) {
          const data = await deepseekResponse.json()
          reply = data.choices[0].message.content
          provider = "DeepSeek"
        } else {
          console.warn("[v0] DeepSeek failed:", deepseekResponse.status, await deepseekResponse.text())
        }
      } catch (error) {
        console.error("[v0] DeepSeek error, failing over...", error)
      }
    }

    if (!reply && process.env.HF_API_KEY) {
      try {
        console.log("[v0] Attempting Hugging Face fallback...")
        const MODEL_ID = "HuggingFaceH4/zephyr-7b-beta"
        const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`
        const MAX_RETRIES = 3

        for (let i = 0; i < MAX_RETRIES; i++) {
          try {
            const hfResponse = await fetch(API_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.HF_API_KEY}`,
              },
              body: JSON.stringify({
                inputs: `<|system|>\n${systemPrompt}</s>\n<|user|>\n${userMessage}</s>\n<|assistant|>\n`,
                parameters: { max_new_tokens: 280, return_full_text: false, temperature: 0.7 },
              }),
            })

            if (hfResponse.ok) {
              const data = await hfResponse.json()
              if (Array.isArray(data) && data[0]?.generated_text) {
                reply = data[0].generated_text
                provider = "Hugging Face"
                break
              }
            } else if (hfResponse.status === 503) {
              console.log(`[v0] HF Model loading, retrying (${i + 1}/${MAX_RETRIES})...`)
              const errorData = await hfResponse.json()
              const waitTime = errorData.estimated_time || 3
              await new Promise((resolve) => setTimeout(resolve, waitTime * 1000))
              continue
            } else {
              throw new Error("Hugging Face failed")
            }
          } catch (retryError) {
            if (i === MAX_RETRIES - 1) console.error("[v0] HF final failure")
          }
        }
      } catch (error) {
        console.error("[v0] Hugging Face error:", error)
      }
    }

    if (!reply && process.env.GOOGLE_API_KEY) {
      try {
        console.log("[v0] Attempting Google Gemini fallback...")
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${systemPrompt}\n\n${userMessage}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 280,
              },
            }),
          },
        )

        if (geminiResponse.ok) {
          const data = await geminiResponse.json()
          reply = data.candidates[0]?.content?.parts[0]?.text || ""
          provider = "Google Gemini"
        } else {
          console.warn("[v0] Gemini failed:", geminiResponse.status, await geminiResponse.text())
        }
      } catch (error) {
        console.error("[v0] Gemini error:", error)
      }
    }

    if (!reply) {
      try {
        console.log("[v0] All API keys failed. Attempting Pollinations AI (No Key Required)...")
        const combinedPrompt = `${systemPrompt}\n\n${userMessage}`
        const pollURL = `https://text.pollinations.ai/${encodeURIComponent(combinedPrompt)}?model=openai`

        const pollResponse = await fetch(pollURL)

        if (pollResponse.ok) {
          reply = await pollResponse.text()
          provider = "Pollinations"
        } else {
          console.warn("[v0] Pollinations failed:", pollResponse.status)
        }
      } catch (error) {
        console.error("[v0] Pollinations error:", error)
      }
    }

    if (reply) {
      reply = reply.replace(/^["']|["']$/g, "").trim()
      console.log(`[v0] Successfully generated reply using ${provider}`)
      return NextResponse.json({ reply, provider })
    } else {
      return NextResponse.json(
        { error: "Failed to generate reply. All AI services are currently busy. Please try again later." },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Critical error in generate-reply:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
