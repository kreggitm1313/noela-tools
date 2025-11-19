# Noela Frame - Farcaster Miniapp

A Farcaster Miniapp for creating cute anime chibi art, transforming photos, and designing social media banners.

## Features

### 1. Photo-to-Chibi Transformer
- Upload real photos (selfie, portrait, or full body)
- Convert into cute, glossy Anime Chibi versions
- Download as PNG
- Share directly to Farcaster

### 2. AI Anime Chibi Generator
- Generate cute anime chibi characters from text prompts
- Multiple style options (Cute & Pastel, Glossy & Vibrant, Soft & Dreamy, Futuristic & Neon)
- Various aspect ratios (1:1, 16:9, 9:16)
- Random prompt suggestions
- Download and share capabilities

### 3. Banner & Header Maker
- Create professional banners (1280x720) and X/Twitter headers (1500x500)
- Multiple templates (Minimal Clean, Blue Gradient, Cute Pastel)
- Add custom text and logos
- Dexscreener-style layout options
- Export as PNG

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4
- **Typography**: Geist font family
- **Deployment**: Vercel
- **Integration**: Farcaster Frames v2 (Mini Apps)

## Noela Universe Design

- **Colors**: Blue-white signature aesthetic
- **Style**: Cute, futuristic, playful
- **Elements**: Soft rounded corners, gradient backgrounds, glossy effects
- **Mobile-first**: Responsive design optimized for all devices

## Farcaster Integration

This app is a fully-functional Farcaster Mini App with:
- Proper Frame meta tags and manifest
- Share to Farcaster functionality
- Webhook endpoint for notifications
- Open Graph images optimized for social sharing

## Setup for Production

### AI Integration

To enable AI-powered image generation, add your API keys:

1. **OpenAI DALL-E** (recommended):
   \`\`\`bash
   OPENAI_API_KEY=your_key_here
   \`\`\`

2. Update the API routes:
   - `app/api/transform-to-chibi/route.ts`
   - `app/api/generate-chibi/route.ts`

### Deployment

1. Deploy to Vercel
2. Update URLs in:
   - `app/layout.tsx` (Farcaster manifest)
   - `.well-known/farcaster.json`
3. Configure environment variables
4. Test the Miniapp in Warpcast

## Local Development

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## Links

- **Zora**: https://zora.co/@noela_zee
- **Farcaster**: https://warpcast.com/noee.eth
- **X/Twitter**: https://x.com/noela_zee
- **Email**: noeeelaa1@gmail.com

## License

Built with love for the Noela Universe ✨
