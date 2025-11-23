"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { Suspense } from "react"
import { getAppUrl } from "@/lib/utils"

function PreviewContent({ title, description, imageUrl, ctaText, ctaUrl }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Card className="max-w-md w-full overflow-hidden shadow-2xl border-0">
        <div className="relative h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
              <img src={imageUrl || "/placeholder.svg"} alt="Noela" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <div className="pt-16 px-6 pb-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-gray-600">{description}</p>
          </div>

          <div className="flex gap-3">
            <Button
              asChild
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                {ctaText}
              </a>
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 pt-2">Powered by Noela Frame</div>
        </div>
      </Card>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Card className="max-w-md w-full overflow-hidden shadow-2xl border-0">
        <div className="relative h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse">
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-200 animate-pulse" />
          </div>
        </div>

        <div className="pt-16 px-6 pb-6 space-y-4">
          <div>
            <div className="h-8 bg-gray-200 rounded-lg mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse" />
          </div>

          <div className="text-center text-xs text-gray-400 pt-2">Loading preview...</div>
        </div>
      </Card>
    </div>
  )
}

export default async function EmbedPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const title = (params.title as string) || "Noela Frame"
  const description = (params.description as string) || "Create cute anime chibi art"
  const imageUrl = (params.image as string) || "/icon.png"
  const ctaText = (params.cta as string) || "Try Now"
  const ctaUrl = (params.url as string) || getAppUrl()

  return (
    <Suspense fallback={<LoadingFallback />}>
      <PreviewContent title={title} description={description} imageUrl={imageUrl} ctaText={ctaText} ctaUrl={ctaUrl} />
    </Suspense>
  )
}
