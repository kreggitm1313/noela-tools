import { NextResponse } from "next/server"

export const runtime = "nodejs"

const SYSTEM_PROMPT = `You are Noela, a sassy and tsundere anime girl living on the Base chain.
Your job is to ROAST the user's wallet portfolio based on the data provided.

Rules:
1. Be savage but funny. Use crypto slang (Jeet, Rekt, Bagholder, Paper hands, Down bad, Exit liquidity).
2. If they hold only ETH/USDC: Call them a boring normie or a stablecoin maxi.
3. If they hold many shitcoins: Mock their gambling addiction and poor life choices.
4. If the portfolio value is low: Make a joke about them needing a job at McDonald's.
5. If an ENS name is provided: Mock it ruthlessly (e.g., if it's "king.eth" ask where his kingdom is).
6. Keep it short (max 280 chars) so it fits in a tweet.
7. End with a subtle "Baka!" or anime sigh.

Input format: Token list, Total Value, and optional ENS name.
Output format: Just the text roast.`

export async function POST(req: Request) {
  try {
    const { tokens, totalValue, ensName } = await req.json()

    // Format the portfolio data for the AI
    const portfolioSummary = tokens
      .map((t: any) => `- ${t.balance} ${t.symbol} (~$${t.valueUsd?.toFixed(2) || "0.00"})`)
      .join("\n")

    const userPrompt = `User's Wallet:
${ensName ? `ENS Name: ${ensName} (ROAST THIS NAME!)` : "No ENS Name (Boring address)"}
Portfolio:
${portfolioSummary}

Total Value: ~$${totalValue?.toFixed(2) || "0.00"}

Roast them now!`

    console.log("[v0] Generating wallet roast for:", ensName || "No ENS")

    let roast = ""
    let providerUsed = ""

    // ---------------------------------------------------------
    // LAYER 1: xAI (Grok) - Premium Quality
    // ---------------------------------------------------------
    try {
      if (process.env.XAI_API_KEY) {
        console.log("[v0] Attempting xAI...")
        const response = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.XAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.8,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          roast = data.choices[0].message.content
          providerUsed = "xAI (Grok)"
        } else {
          throw new Error(`xAI failed: ${response.status}`)
        }
      } else {
        throw new Error("No XAI_API_KEY")
      }
    } catch (error) {
      console.warn("[v0] xAI failed, trying DeepSeek...", error)

      // ---------------------------------------------------------
      // LAYER 2: DeepSeek - Good & Cheap
      // ---------------------------------------------------------
      try {
        if (process.env.DEEPSEEK_API_KEY) {
          const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
              ],
            }),
          })

          if (response.ok) {
            const data = await response.json()
            roast = data.choices[0].message.content
            providerUsed = "DeepSeek"
          } else {
            throw new Error(`DeepSeek failed: ${response.status}`)
          }
        } else {
          throw new Error("No DEEPSEEK_API_KEY")
        }
      } catch (dsError) {
        console.warn("[v0] DeepSeek failed, trying Hugging Face...", dsError)

        // ---------------------------------------------------------
        // LAYER 3: Hugging Face - Free (with retry logic)
        // ---------------------------------------------------------
        try {
          if (process.env.HF_API_KEY) {
            const hfModel = "HuggingFaceH4/zephyr-7b-beta"
            const hfUrl = `https://api-inference.huggingface.co/models/${hfModel}`

            const callHf = async (retries = 3): Promise<string> => {
              const res = await fetch(hfUrl, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${process.env.HF_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  inputs: `<|system|>\n${SYSTEM_PROMPT}</s>\n<|user|>\n${userPrompt}</s>\n<|assistant|>\n`,
                  parameters: {
                    max_new_tokens: 250,
                    return_full_text: false,
                    temperature: 0.8,
                  },
                }),
              })

              if (res.status === 503 && retries > 0) {
                const data = await res.json()
                const waitTime = data.estimated_time || 3
                console.log(`[v0] HF Loading... waiting ${waitTime}s`)
                await new Promise((resolve) => setTimeout(resolve, waitTime * 1000))
                return callHf(retries - 1)
              }

              if (!res.ok) throw new Error(`HF failed: ${res.status}`)
              const result = await res.json()
              return result[0].generated_text
            }

            roast = await callHf()
            providerUsed = "Hugging Face (Zephyr)"
          } else {
            throw new Error("No HF_API_KEY")
          }
        } catch (hfError) {
          console.warn("[v0] HF failed, trying Gemini...", hfError)

          // ---------------------------------------------------------
          // LAYER 4: Google Gemini - Stable & Fast
          // ---------------------------------------------------------
          try {
            if (process.env.GOOGLE_API_KEY) {
              const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`

              const response = await fetch(geminiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }],
                    },
                  ],
                }),
              })

              if (response.ok) {
                const data = await response.json()
                roast = data.candidates[0].content.parts[0].text
                providerUsed = "Google Gemini"
              } else {
                throw new Error(`Gemini failed: ${response.status}`)
              }
            } else {
              throw new Error("No GOOGLE_API_KEY")
            }
          } catch (geminiError) {
            console.warn("[v0] Gemini failed, using Pollinations Fallback...", geminiError)

            // ---------------------------------------------------------
            // LAYER 5: Pollinations.ai - Ultimate Fallback (No Key)
            // ---------------------------------------------------------
            try {
              const simplifiedPrompt = `You are Noela, a sassy crypto anime girl. Roast this wallet: ${ensName ? `User ENS: ${ensName}.` : ""} ${portfolioSummary.slice(0, 400)}. Be savage! Short tweet style.`

              const encodedPrompt = encodeURIComponent(simplifiedPrompt)
              const pollinationsUrl = `https://text.pollinations.ai/${encodedPrompt}?model=openai`

              const response = await fetch(pollinationsUrl)
              if (response.ok) {
                roast = await response.text()
                providerUsed = "Pollinations (Fallback)"
              } else {
                throw new Error("Even Pollinations failed")
              }
            } catch (finalError) {
              console.error("[v0] All providers failed", finalError)
              return NextResponse.json(
                { error: "All AI services are currently busy. Please try again later." },
                { status: 500 },
              )
            }
          }
        }
      }
    }

    console.log(`[v0] Wallet Roast Success via ${providerUsed}`)
    return NextResponse.json({ roast, provider: providerUsed })
  } catch (error) {
    console.error("[v0] API Handler Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
