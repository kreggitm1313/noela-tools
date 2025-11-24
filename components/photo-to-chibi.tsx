"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Download, Sparkles, Loader2, Share2, ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function PhotoToChibi() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          let width = img.width
          let height = img.height

          // Resize if image is too large (max 1024px on longest side)
          const maxSize = 1024
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Failed to get canvas context"))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          // Convert to base64 with compression (quality 0.8 for JPEG)
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8)
          resolve(compressedBase64)
        }
        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 10MB",
          variant: "destructive",
        })
        return
      }

      try {
        const compressedImage = await compressImage(file)
        setSelectedImage(compressedImage)
        setProcessedImage(null)

        const compressedSizeKB = (compressedImage.length * 3) / 4 / 1024
        console.log("[v0] Compressed image size:", compressedSizeKB.toFixed(2), "KB")
      } catch (error) {
        console.error("[v0] Image compression error:", error)
        toast({
          title: "Error",
          description: "Failed to process image. Please try a different file.",
          variant: "destructive",
        })
      }
    }
  }

  const transformToChibi = async () => {
    if (!selectedImage) return

    setIsProcessing(true)
    try {
      console.log("[v0] Calling transform-to-chibi API")

      toast({
        title: "Analyzing Photo...",
        description: "AI is studying your photo's details...",
      })

      const response = await fetch("/api/transform-to-chibi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: selectedImage }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("[v0] API error:", data.error)
        throw new Error(data.error || "Failed to transform image")
      }

      console.log("[v0] Transform successful")
      setProcessedImage(data.imageUrl)

      toast({
        title: "Success!",
        description: "Your photo has been transformed into cute anime chibi art!",
      })
    } catch (error) {
      console.error("[v0] Transform error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to transform image. Please try again."

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadImage = () => {
    if (!processedImage) return

    const link = document.createElement("a")
    link.href = processedImage
    link.download = `noela-chibi-${Date.now()}.png`
    link.click()
  }

  const shareToFarcaster = () => {
    const text = encodeURIComponent("Just created this cute chibi art with Noela Frame! ✨")
    const url = encodeURIComponent(window.location.origin)
    const farcasterShareUrl = `https://warpcast.com/~/compose?text=${text}&embeds[]=${url}`
    window.open(farcasterShareUrl, "_blank")
  }

  return (
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"></div>

      <CardHeader className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white relative z-10">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <ImageIcon className="w-6 h-6" />
          </div>
          <span className="flex items-center gap-2">
            Photo to Chibi Transformer
            <Sparkles className="w-5 h-5 animate-pulse" />
          </span>
        </CardTitle>
        <CardDescription className="text-blue-100">
          Upload a photo and transform it into cute anime chibi art with AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 relative z-10">
        <div className="space-y-6">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all"
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            {selectedImage ? (
              <div className="space-y-4">
                <img
                  src={selectedImage || "/placeholder.svg"}
                  alt="Selected"
                  className="max-h-64 mx-auto rounded-lg shadow-md"
                />
                <p className="text-sm text-muted-foreground">Click to change photo</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-blue-900">Upload your photo</p>
                  <p className="text-sm text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Transform Button */}
          {selectedImage && !processedImage && (
            <Button
              onClick={transformToChibi}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Transforming...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Transform to Chibi
                </>
              )}
            </Button>
          )}

          {/* Processing Warning Message */}
          {isProcessing && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium text-center">
                ⏳ Tunggu sebentar ya, foto sedang diproses... Jangan klik transform ulang dulu!
              </p>
            </div>
          )}

          {/* Result */}
          {processedImage && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden shadow-xl border-2 border-blue-200">
                <img src={processedImage || "/placeholder.svg"} alt="Chibi result" className="w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={downloadImage} className="bg-blue-600 hover:bg-blue-700" size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={shareToFarcaster}
                  variant="outline"
                  size="lg"
                  className="border-blue-200 bg-transparent"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
              <Button
                onClick={() => {
                  setSelectedImage(null)
                  setProcessedImage(null)
                }}
                variant="ghost"
                className="w-full"
              >
                Start Over
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
