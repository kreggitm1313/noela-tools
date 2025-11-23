"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Upload, Sparkles, Loader2, Wand2, Smartphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function BannerMaker() {
  const [mode, setMode] = useState<"manual" | "ai">("ai")
  const [bannerType, setBannerType] = useState<"banner" | "header" | "dexscreener">("banner")
  const [text, setText] = useState("")
  const [logo, setLogo] = useState<string | null>(null)
  const [template, setTemplate] = useState("minimal")
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiBanner, setAiBanner] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const dimensions = {
    banner: { width: 1280, height: 720 },
    header: { width: 1500, height: 500 },
    dexscreener: { width: 600, height: 200 },
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogo(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const generateAIBanner = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please describe the banner you want to generate",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    toast({
      title: "Generating Banner",
      description: "Creating your banner instantly...",
    })

    try {
      console.log("[v0] Calling generate-banner API")
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch("/api/generate-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          bannerType: bannerType,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("[v0] Failed to parse response:", parseError)
        throw new Error("Server returned invalid response. Please try again.")
      }

      if (data.error) {
        throw new Error(data.error)
      }

      setAiBanner(data.imageUrl)

      if (data.fallback) {
        toast({
          title: "Using Fallback Image",
          description: data.message || "AI generation is unavailable. Showing placeholder instead.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Banner Generated! (Unlimited)",
          description: "Your AI-powered banner is ready. Generate as many as you want!",
        })
      }
    } catch (error) {
      console.error("[v0] AI banner generation error:", error)
      const isTimeout = error instanceof Error && error.name === "AbortError"
      toast({
        title: "Generation Failed",
        description: isTimeout
          ? "Generation took too long (>10s). Please try again."
          : error instanceof Error
            ? error.message
            : "Failed to generate banner. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (mode === "manual") {
      drawBanner()
    }
  }, [bannerType, text, logo, template, mode])

  const drawBanner = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height } = dimensions[bannerType]
    canvas.width = width
    canvas.height = height

    ctx.clearRect(0, 0, width, height)

    if (template === "minimal") {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)

      const gradient = ctx.createLinearGradient(0, 0, width, 0)
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.1)")
      gradient.addColorStop(1, "rgba(147, 51, 234, 0.1)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = "#3b82f6"
      ctx.fillRect(0, 0, width, 8)
    } else if (template === "gradient") {
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, "#3b82f6")
      gradient.addColorStop(1, "#9333ea")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    } else if (template === "cute") {
      ctx.fillStyle = "#f0f9ff"
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = "rgba(191, 219, 254, 0.5)"
      ctx.beginPath()
      ctx.arc(width * 0.2, height * 0.3, 100, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "rgba(233, 213, 255, 0.5)"
      ctx.beginPath()
      ctx.arc(width * 0.8, height * 0.7, 120, 0, Math.PI * 2)
      ctx.fill()
    }

    if (logo) {
      const img = new Image()
      img.src = logo
      img.onload = () => {
        const logoSize = height * 0.4
        const logoX = 40
        const logoY = (height - logoSize) / 2
        ctx.drawImage(img, logoX, logoY, logoSize, logoSize)

        if (text) {
          drawText(ctx, width, height, logoX + logoSize + 40)
        }
      }
    } else if (text) {
      drawText(ctx, width, height, null)
    }
  }

  const drawText = (ctx: CanvasRenderingContext2D, width: number, height: number, leftOffset: number | null) => {
    const fontSize = height * 0.15
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.textBaseline = "middle"

    if (template === "gradient") {
      ctx.fillStyle = "#ffffff"
    } else {
      ctx.fillStyle = "#1e293b"
    }

    const textX = leftOffset || width / 2
    const textY = height / 2

    if (leftOffset) {
      ctx.textAlign = "left"
    } else {
      ctx.textAlign = "center"
    }

    ctx.fillText(text, textX, textY)
  }

  const downloadImageMobile = async (imageUrl: string, filename: string) => {
    try {
      toast({
        title: "Downloading...",
        description: "Preparing your download...",
      })

      let blob: Blob

      try {
        const response = await fetch(`/api/download-proxy?url=${encodeURIComponent(imageUrl)}&filename=${filename}`)
        if (!response.ok) throw new Error("Proxy download failed")
        blob = await response.blob()
      } catch (proxyError) {
        console.warn("Proxy download failed, trying direct fetch:", proxyError)
        // Fallback to direct fetch
        const response = await fetch(imageUrl, { mode: "cors" })
        if (!response.ok) throw new Error("Direct download failed")
        blob = await response.blob()
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Downloaded!",
        description: "Your banner has been saved",
      })
    } catch (error) {
      console.error("Download error:", error)
      const newWindow = window.open(imageUrl, "_blank")
      if (newWindow) {
        toast({
          title: "Download Started",
          description: "Image opened in new tab. Please save it manually if download didn't start.",
        })
      } else {
        toast({
          title: "Download Failed",
          description: "Please allow popups or try again.",
          variant: "destructive",
        })
      }
    }
  }

  const downloadBanner = () => {
    if (mode === "ai" && aiBanner) {
      downloadImageMobile(aiBanner, `noela-${bannerType}-ai-${Date.now()}.png`)
    } else if (mode === "manual") {
      const canvas = canvasRef.current
      if (!canvas) return

      canvas.toBlob((blob) => {
        if (!blob) return

        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `noela-${bannerType}-${Date.now()}.png`
        link.click()
        URL.revokeObjectURL(url)

        toast({
          title: "Downloaded!",
          description: `Your ${bannerType} has been saved`,
        })
      })
    }
  }

  const examplePrompts = [
    "galaxy-themed anime banner with stars and nebula",
    "pastel chibi style with cute characters",
    "Noela blue-white vibe futuristic aesthetic",
    "cyber punk neon lights with digital elements",
  ]

  const useExamplePrompt = () => {
    const random = examplePrompts[Math.floor(Math.random() * examplePrompts.length)]
    setAiPrompt(random)
  }

  return (
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"></div>

      <CardHeader className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white relative z-10">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="flex items-center gap-2">
            Banner & Header Maker
            <Sparkles className="w-5 h-5 animate-pulse" />
          </span>
        </CardTitle>
        <CardDescription className="text-blue-100">
          Create professional social media banners with AI or manual design
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 relative z-10">
        <div className="space-y-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "manual" | "ai")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-white/50 backdrop-blur-sm">
              <TabsTrigger value="ai" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Generate
              </TabsTrigger>
              <TabsTrigger value="manual" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Wand2 className="w-4 h-4 mr-2" />
                Manual Design
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-6 mt-0">
              <div className="space-y-2">
                <Label htmlFor="ai-type">Banner Type</Label>
                <Select value={bannerType} onValueChange={(v) => setBannerType(v as any)}>
                  <SelectTrigger id="ai-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner (1280x720)</SelectItem>
                    <SelectItem value="header">X Header (1500x500)</SelectItem>
                    <SelectItem value="dexscreener">Dexscreener (600x200)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-prompt">Describe your banner</Label>
                <div className="flex gap-2">
                  <Input
                    id="ai-prompt"
                    placeholder="e.g., galaxy-themed anime banner with stars..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={useExamplePrompt} variant="outline" size="icon">
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tip: Be specific about colors, style, and mood for best results
                </p>
              </div>

              <Button
                onClick={generateAIBanner}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Banner...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>

              {aiBanner && (
                <div className="space-y-4">
                  <div className="rounded-xl overflow-hidden shadow-xl border-2 border-blue-200">
                    <img src={aiBanner || "/placeholder.svg"} alt="AI generated banner" className="w-full" />
                  </div>
                  <Button onClick={downloadBanner} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    <Smartphone className="w-4 h-4 mr-2 md:hidden" />
                    <Download className="w-4 h-4 mr-2 hidden md:inline" />
                    Download Banner
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-6 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={bannerType} onValueChange={(v) => setBannerType(v as any)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banner">Banner (1280x720)</SelectItem>
                      <SelectItem value="header">X Header (1500x500)</SelectItem>
                      <SelectItem value="dexscreener">Dexscreener (600x200)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template">Template</Label>
                  <Select value={template} onValueChange={setTemplate}>
                    <SelectTrigger id="template">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal Clean</SelectItem>
                      <SelectItem value="gradient">Blue Gradient</SelectItem>
                      <SelectItem value="cute">Cute Pastel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text">Text</Label>
                <Input
                  id="text"
                  placeholder="Enter your banner text..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Logo (Optional)</Label>
                <Button onClick={() => logoInputRef.current?.click()} variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  {logo ? "Change Logo" : "Upload Logo"}
                </Button>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </div>

              <div className="rounded-xl overflow-hidden shadow-xl border-2 border-blue-200 bg-gray-100">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto"
                  style={{ maxHeight: "400px", objectFit: "contain" }}
                />
              </div>

              <Button onClick={downloadBanner} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                <Download className="w-4 h-4 mr-2" />
                Download{" "}
                {bannerType === "banner" ? "Banner" : bannerType === "header" ? "Header" : "Dexscreener Banner"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}
