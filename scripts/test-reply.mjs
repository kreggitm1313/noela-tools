// Simple script to verify the 5-layer AI fallback logic
// Run with: node scripts/test-reply.mjs

const prompt = "What is the future of crypto?"
const tone = "Hype & Bullish (CT Style)"

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

async function runTest() {
  console.log("----------------------------------------")
  console.log("🧪 Testing AI Reply Generator Logic")
  console.log("----------------------------------------")
  console.log("Prompt:", prompt)
  console.log("Tone:", tone)
  console.log("----------------------------------------")

  let reply = ""
  let provider = ""

  // 1. xAI (Grok)
  if (process.env.XAI_API_KEY) {
    try {
      console.log("[Test] Attempting xAI...")
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
        console.log("✅ xAI Success!")
      } else {
        console.warn("❌ xAI Failed:", xaiResponse.status, await xaiResponse.text())
      }
    } catch (error) {
      console.error("❌ xAI Error:", error.message)
    }
  } else {
    console.log("⚠️ No XAI_API_KEY found")
  }

  // 2. DeepSeek
  if (!reply && process.env.DEEPSEEK_API_KEY) {
    try {
      console.log("[Test] Attempting DeepSeek fallback...")
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
        console.log("✅ DeepSeek Success!")
      } else {
        console.warn("❌ DeepSeek Failed:", deepseekResponse.status, await deepseekResponse.text())
      }
    } catch (error) {
      console.error("❌ DeepSeek Error:", error.message)
    }
  } else if (!reply) {
    console.log("⚠️ No DEEPSEEK_API_KEY found")
  }

  // 3. Hugging Face
  if (!reply && process.env.HF_API_KEY) {
    try {
      console.log("[Test] Attempting Hugging Face fallback...")
      const MODEL_ID = "HuggingFaceH4/zephyr-7b-beta"
      const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`
      
      // Simplified retry for test
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
          console.log("✅ Hugging Face Success!")
        }
      } else {
        console.warn("❌ Hugging Face Failed:", hfResponse.status)
      }
    } catch (error) {
      console.error("❌ Hugging Face Error:", error.message)
    }
  } else if (!reply) {
    console.log("⚠️ No HF_API_KEY found")
  }

  // 4. Gemini
  if (!reply && process.env.GOOGLE_API_KEY) {
    try {
      console.log("[Test] Attempting Google Gemini fallback...")
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }],
          }),
        },
      )

      if (geminiResponse.ok) {
        const data = await geminiResponse.json()
        reply = data.candidates[0]?.content?.parts[0]?.text || ""
        provider = "Google Gemini"
        console.log("✅ Gemini Success!")
      } else {
        console.warn("❌ Gemini Failed:", geminiResponse.status)
      }
    } catch (error) {
      console.error("❌ Gemini Error:", error.message)
    }
  } else if (!reply) {
    console.log("⚠️ No GOOGLE_API_KEY found")
  }

  // 5. Pollinations
  if (!reply) {
    try {
      console.log("[Test] Attempting Pollinations AI (Final Fallback)...")
      const combinedPrompt = `${systemPrompt}\n\n${userMessage}`
      const pollURL = `https://text.pollinations.ai/${encodeURIComponent(combinedPrompt)}?model=openai`

      const pollResponse = await fetch(pollURL)

      if (pollResponse.ok) {
        reply = await pollResponse.text()
        provider = "Pollinations"
        console.log("✅ Pollinations Success!")
      } else {
        console.warn("❌ Pollinations Failed:", pollResponse.status)
      }
    } catch (error) {
      console.error("❌ Pollinations Error:", error.message)
    }
  }

  console.log("----------------------------------------")
  if (reply) {
    reply = reply.replace(/^["']|["']$/g, "").trim()
    console.log("🎉 FINAL RESULT GENERATED BY:", provider)
    console.log("📝 REPLY:", reply)
    console.log("----------------------------------------")
  } else {
    console.error("🛑 ALL PROVIDERS FAILED.")
  }
}

runTest()
