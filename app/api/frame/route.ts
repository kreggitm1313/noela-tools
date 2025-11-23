import { NextResponse } from "next/server"
import { getAppUrl } from "@/lib/utils"

export const runtime = "nodejs"

export async function GET() {
  const appUrl = getAppUrl()

  // Return HTML with meta tags for the frame
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Noela Frame</title>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${appUrl}/opengraph-image" />
        <meta property="fc:frame:button:1" content="🚀 Launch App" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="${appUrl}/" />
        <meta property="fc:frame:button:2" content="🎨 Create Chibi" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content="${appUrl}/?tab=chibi" />
      </head>
      <body>
        <h1>Noela Frame</h1>
      </body>
    </html>
  `

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  })
}

export async function POST(req: Request) {
  const appUrl = getAppUrl()

  // For a POST interaction, we must return a new Frame (HTML)
  // Since we are using Link buttons primarily, this is a fallback/example
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Noela Frame</title>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${appUrl}/opengraph-image" />
        <meta property="fc:frame:button:1" content="🚀 Launch App" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="${appUrl}/" />
      </head>
      <body>
        <h1>Action Received</h1>
      </body>
    </html>
  `

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  })
}
