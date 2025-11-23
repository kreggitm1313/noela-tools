import { NextResponse } from "next/server"

export const maxDuration = 60 // Allow up to 60 seconds for execution

// Helper function for delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function POST(req: Request) {
  try {
    const { address } = await req.json()

    if (!address) {
      return NextResponse.json({ error: "Token address is required" }, { status: 400 })
    }

    // 1. Fetch Security Data from GoPlus (Base Chain ID: 8453)
    // Using GoPlus public API if key is not available, but preferring key
    // GoPlus API for token security: https://api.gopluslabs.io/api/v1/token_security/{chain_id}?contract_addresses={addresses}

    let securityData = null

    try {
      console.log(`[RugCheck] Scanning token: ${address}`)
      const goPlusUrl = `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${address}`
      const goPlusResponse = await fetch(goPlusUrl)

      if (goPlusResponse.ok) {
        const data = await goPlusResponse.json()
        if (data.result && data.result[address.toLowerCase()]) {
          securityData = data.result[address.toLowerCase()]
        }
      }
    } catch (error) {
      console.error("[RugCheck] GoPlus API failed:", error)
      // We will proceed with AI generation even if GoPlus fails, mocking the data or asking AI to analyze based on address (limited)
      // But ideally we want the data. For now, if data fails, we throw to let user know scanning failed
    }

    if (!securityData) {
      // Fallback mock data for testing if API fails completely or token not found
      // In production we might want to return error, but for "Waifu" experience we can simulate
      console.log("[RugCheck] Security data not found, using fallback or error")
      return NextResponse.json(
        { error: "Could not fetch token security data. Is this a valid Base token address?" },
        { status: 404 },
      )
    }

    // Prepare prompt for AI
    const systemPrompt = `You are Noela, the protector of the Base chain.
Interpret the provided Token Security Data for the user.

Rules:
1. If the token is SAFE (Liquidity Locked, No Honeypot, Buy/Sell Tax < 5%): Be happy, smile, and say "Safe to aped, Senpai! 🟢"
2. If the token is RISKY/SCAM (Honeypot, High Tax > 10%, Liquidity Unlocked/Null, Proxy Contract): Be angry, panic, and scream "YAMETEEE! IT'S A TRAP! 🔴".
3. Explain WHY it is safe or dangerous in 1 simple sentence. Do not use complex technical jargon, explain it like I'm 5.

Input format: Security audit JSON data.
Output format: Short advice + Emoji status.`

    const userPrompt = JSON.stringify({
      token_name: securityData.token_name,
      is_honeypot: securityData.is_honeypot,
      buy_tax: securityData.buy_tax,
      sell_tax: securityData.sell_tax,
      is_open_source: securityData.is_open_source,
      lp_holder_count: securityData.lp_holder_count,
      is_proxy: securityData.is_proxy,
      owner_address: securityData.owner_address,
      creator_address: securityData.creator_address,
      lp_total_supply: securityData.lp_total_supply,
    })

    let aiResponse = ""

    // --- AI GENERATION CHAIN (xAI -> DeepSeek -> Hugging Face -> Gemini -> Pollinations) ---

    // 1. Try xAI (Grok)
    try {
      if (process.env.XAI_API_KEY) {
        console.log("[RugCheck] Trying xAI...")
        const response = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        })

        if (response.ok) {
          const data = await response.json()
          aiResponse = data.choices[0].message.content
          console.log("[RugCheck] xAI Success")
        } else {
          throw new Error("xAI failed")
        }
      } else {
        throw new Error("No XAI Key")
      }
    } catch (error) {
      console.log("[RugCheck] xAI failed, trying DeepSeek...")

      // 2. Try DeepSeek
      try {
        if (process.env.DEEPSEEK_API_KEY) {
          const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
            }),
          })

          if (response.ok) {
            const data = await response.json()
            aiResponse = data.choices[0].message.content
            console.log("[RugCheck] DeepSeek Success")
          } else {
            throw new Error("DeepSeek failed")
          }
        } else {
          throw new Error("No DeepSeek Key")
        }
      } catch (error) {
        console.log("[RugCheck] DeepSeek failed, trying Hugging Face...")

        // 3. Try Hugging Face (Zephyr-7b-beta)
        try {
          if (process.env.HF_API_KEY) {
            const hfModel = "HuggingFaceH4/zephyr-7b-beta"
            const hfPrompt = `<|system|>\n${systemPrompt}</s>\n<|user|>\n${userPrompt}</s>\n<|assistant|>\n`

            // Retry logic for HF "Model Loading"
            let attempts = 0
            while (attempts < 3) {
              const response = await fetch(`https://api-inference.huggingface.co/models/${hfModel}`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${process.env.HF_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ inputs: hfPrompt }),
              })

              const result = await response.json()

              if (result.error && result.error.includes("loading")) {
                console.log(`[RugCheck] HF Loading... attempt ${attempts + 1}`)
                await delay(3000) // Wait 3s
                attempts++
              } else if (Array.isArray(result)) {
                aiResponse = result[0].generated_text.split("<|assistant|>\n")[1] || result[0].generated_text
                console.log("[RugCheck] Hugging Face Success")
                break
              } else {
                throw new Error("HF API Error")
              }
            }
            if (!aiResponse) throw new Error("HF Timeout")
          } else {
            throw new Error("No HF Key")
          }
        } catch (error) {
          console.log("[RugCheck] Hugging Face failed, trying Gemini...")

          // 4. Try Google Gemini
          try {
            if (process.env.GOOGLE_API_KEY) {
              const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [
                      {
                        parts: [{ text: systemPrompt + "\n\nInput: " + userPrompt }],
                      },
                    ],
                  }),
                },
              )

              if (response.ok) {
                const data = await response.json()
                if (data.candidates && data.candidates[0].content) {
                  aiResponse = data.candidates[0].content.parts[0].text
                  console.log("[RugCheck] Gemini Success")
                } else {
                  throw new Error("Invalid Gemini response")
                }
              } else {
                throw new Error("Gemini API failed")
              }
            } else {
              throw new Error("No Gemini Key")
            }
          } catch (error) {
            console.log("[RugCheck] Gemini failed, trying Pollinations...")

            // 5. Final Fallback: Pollinations
            try {
              const response = await fetch("https://text.pollinations.ai/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                  ],
                  model: "openai", // Pollinations uses openai-compatible endpoint
                  seed: Math.floor(Math.random() * 1000),
                }),
              })

              if (response.ok) {
                aiResponse = await response.text()
                console.log("[RugCheck] Pollinations Success")
              } else {
                throw new Error("Pollinations failed")
              }
            } catch (error) {
              console.error("[RugCheck] All AI services failed")
              return NextResponse.json({ error: "Noela is taking a nap. All AI services are busy." }, { status: 503 })
            }
          }
        }
      }
    }

    return NextResponse.json({
      analysis: aiResponse,
      data: securityData,
    })
  } catch (error) {
    console.error("[RugCheck] Internal Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
