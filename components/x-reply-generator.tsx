"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Sparkles, Copy, Loader2, Twitter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function XReplyGenerator() {
  const [tweetInput, setTweetInput] = useState("")
  const [tone, setTone] = useState("casual")
  const [generatedReply, setGeneratedReply] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!tweetInput.trim()) {
      toast({
        title: "Input required",
        description: "Please paste a tweet to generate a reply for.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGeneratedReply("")

    try {
      const response = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: tweetInput, tone }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Failed to generate reply")

      setGeneratedReply(data.reply)
      toast({
        title: "Reply Generated!",
        description: "Your AI reply is ready.",
      })
    } catch (error) {
      console.error("Generation error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    if (!generatedReply) return
    navigator.clipboard.writeText(generatedReply)
    toast({
      title: "Copied!",
      description: "Reply copied to clipboard.",
    })
  }

  return (
    <Card className="border-blue-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <Twitter className="w-6 h-6 text-blue-500 fill-current" />
          <CardTitle className="text-blue-900">X Reply Generator</CardTitle>
        </div>
        <CardDescription>Generate engaging, AI-powered replies for Crypto Twitter using Grok.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="tweet">Paste Tweet TEXT (Not Link)</Label>
          <Textarea
            id="tweet"
            placeholder="Copy and paste the actual text of the tweet here. Do NOT paste the link (URL)..."
            className="min-h-[100px] bg-white"
            value={tweetInput}
            onChange={(e) => setTweetInput(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tone">Reply Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="casual">Casual & Friendly</SelectItem>
              <SelectItem value="funny">Funny & Witty</SelectItem>
              <SelectItem value="insightful">Insightful & Smart</SelectItem>
              <SelectItem value="shill">Hype & Bullish (CT Style)</SelectItem>
              <SelectItem value="disagree">Polite Disagreement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Reply...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Reply
            </>
          )}
        </Button>

        {generatedReply && (
          <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3 animation-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Generated Reply
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 px-2 text-blue-600 hover:bg-blue-100"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
              {generatedReply}
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={copyToClipboard}
                className="w-full bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
              >
                Copy Text
              </Button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(generatedReply)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full bg-black hover:bg-gray-800 text-white">
                  <Twitter className="w-4 h-4 mr-2 fill-white" />
                  Post on X
                </Button>
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
