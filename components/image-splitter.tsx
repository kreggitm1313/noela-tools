"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Upload, Grid, Columns, Loader2, Smartphone, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import JSZip from "jszip"

export function ImageSplitter() {
  const [image, setImage] = useState<string | null>(null)
  const [columns, setColumns] = useState(3)
  const [mode, setMode] = useState<"grid" | "carousel">("grid")
  const [isProcessing, setIsProcessing] = useState(false)
  const [slices, setSlices] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
        setSlices([])
      }
      reader.readAsDataURL(file)
    }
  }

  const splitImage = async () => {
    if (!image) return

    setIsProcessing(true)
    setSlices([])

    try {
      const img = new Image()
      img.src = image
      await new Promise((resolve) => {
        img.onload = resolve
      })

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      const newSlices: string[] = []
      const sliceWidth = img.width / columns
      let sliceHeight = 0

      if (mode === "grid") {
        // Square cuts
        sliceHeight = sliceWidth
      } else {
        // Carousel (Full height)
        sliceHeight = img.height
      }

      // High resolution rendering
      // We use the original image dimensions, so it's already "HD" relative to the source

      for (let i = 0; i < columns; i++) {
        canvas.width = sliceWidth
        canvas.height = sliceHeight

        // Clear canvas
        ctx.clearRect(0, 0, sliceWidth, sliceHeight)

        // Draw the slice
        // sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight
        ctx.drawImage(img, i * sliceWidth, 0, sliceWidth, sliceHeight, 0, 0, sliceWidth, sliceHeight)

        // Get data URL
        const sliceUrl = canvas.toDataURL("image/png", 1.0)
        newSlices.push(sliceUrl)
      }

      setSlices(newSlices)
      toast({
        title: "Image Split Complete!",
        description: `Successfully created ${columns} slices.`,
      })
    } catch (error) {
      console.error("Split error:", error)
      toast({
        title: "Error splitting image",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadSlice = async (url: string, index: number) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `slice-${index + 1}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error("Download error:", error)
      // Fallback
      const link = document.createElement("a")
      link.href = url
      link.download = `slice-${index + 1}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const downloadAll = async () => {
    if (slices.length === 0) return

    const zip = new JSZip()

    slices.forEach((slice, index) => {
      // Remove data:image/png;base64, prefix
      const data = slice.split(",")[1]
      zip.file(`slice-${index + 1}.png`, data, { base64: true })
    })

    const content = await zip.generateAsync({ type: "blob" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(content)
    link.download = "instagram-grid-slices.zip"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  return (
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 relative overflow-hidden">
      {/* Decorative anime-style elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>

      <CardHeader className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white relative z-10">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Grid className="w-6 h-6" />
          </div>
          <span className="flex items-center gap-2">
            Grid Anime Splitter
            <Sparkles className="w-5 h-5 animate-pulse" />
          </span>
        </CardTitle>
        <CardDescription className="text-pink-100">
          Transform your anime art into stunning Instagram carousels and grids
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 relative z-10">
        {/* Upload Section */}
        <div className="space-y-2">
          <Label className="text-purple-900 font-semibold">Upload Anime Image (Max 10MB)</Label>
          <div
            className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:bg-gradient-to-br hover:from-pink-100/50 hover:to-purple-100/50 transition-all cursor-pointer bg-white/50 backdrop-blur-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {image ? (
              <div className="relative h-48 w-full">
                <img
                  src={image || "/placeholder.svg"}
                  alt="Preview"
                  className="h-full w-full object-contain rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity rounded-lg backdrop-blur-sm">
                  <span className="text-white font-bold bg-purple-600/80 px-4 py-2 rounded-full shadow-lg">
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    Change Image
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-purple-600">
                <div className="p-4 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl shadow-lg">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <p className="font-semibold">Click to upload your anime artwork</p>
                <p className="text-sm text-purple-400">JPG, PNG, or WEBP</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-purple-900 font-semibold">Columns: {columns}</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setColumns(Math.max(2, columns - 1))}
                  disabled={columns <= 2}
                  className="border-purple-300 hover:bg-purple-100 hover:border-purple-400"
                >
                  -
                </Button>
                <Slider
                  value={[columns]}
                  onValueChange={(v) => setColumns(v[0])}
                  min={2}
                  max={6}
                  step={1}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setColumns(Math.min(6, columns + 1))}
                  disabled={columns >= 6}
                  className="border-purple-300 hover:bg-purple-100 hover:border-purple-400"
                >
                  +
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-purple-900 font-semibold">Split Mode</Label>
              <Tabs value={mode} onValueChange={(v) => setMode(v as "grid" | "carousel")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/70">
                  <TabsTrigger
                    value="grid"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                  >
                    <Grid className="w-4 h-4 mr-2" />
                    Grid (Square)
                  </TabsTrigger>
                  <TabsTrigger
                    value="carousel"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
                  >
                    <Columns className="w-4 h-4 mr-2" />
                    Carousel (Full)
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="flex items-end">
            <Button
              onClick={splitImage}
              disabled={!image || isProcessing}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white h-12 text-lg shadow-xl shadow-purple-500/50 font-bold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing Magic...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Split Image
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        {slices.length > 0 && (
          <div className="space-y-4 pt-4 border-t-2 border-purple-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                Preview Slices
              </h3>
              <Button
                onClick={downloadAll}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 hover:border-purple-400 font-semibold bg-transparent"
              >
                <Smartphone className="w-4 h-4 mr-2 md:hidden" />
                <Download className="w-4 h-4 mr-2 hidden md:inline" />
                Download All (ZIP)
              </Button>
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {slices.map((slice, index) => (
                <div key={index} className="space-y-2 group">
                  <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-purple-200 shadow-lg bg-white group-hover:border-pink-400 transition-all group-hover:shadow-xl group-hover:shadow-purple-300/50">
                    <img
                      src={slice || "/placeholder.svg"}
                      alt={`Slice ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/20 group-hover:to-purple-500/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        size="icon"
                        className="rounded-full shadow-2xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                        onClick={() => downloadSlice(slice, index)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-center text-purple-600 font-semibold">Slice {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
