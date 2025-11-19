# Noela Frame - Deployment Guide

## Quick Deploy to Vercel

### Method 1: One-Click Deploy from v0
1. Click the **"Publish"** button in the top right corner of v0
2. Your app will automatically deploy to Vercel
3. Once deployed, add your environment variable (see below)

### Method 2: Deploy via GitHub
1. Click the **GitHub icon** in the top right to push code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Click **Deploy**

### Method 3: Download and Deploy
1. Download the ZIP file from v0
2. Extract and upload to a new GitHub repository
3. Connect the repository to Vercel
4. Click **Deploy**

---

## Required Environment Variables

After deployment, add these environment variables in Vercel:

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings → Environment Variables**
3. Add:

\`\`\`
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxx
\`\`\`

**Important:** Make sure to add the variable for all environments (Production, Preview, Development)

---

## How to Get Your OpenAI API Key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Copy the key (you won't be able to see it again!)
4. Paste it into Vercel environment variables

---

## Testing Your Farcaster Miniapp

### On Warpcast:
1. Share your Vercel URL in a cast: `https://your-app.vercel.app`
2. The frame should automatically render with the Noela Frame preview
3. Click "Start Creating" to launch the miniapp

### On Other Farcaster Clients:
- Just paste your URL, the frame meta tags will be detected automatically

---

## Troubleshooting

### Frame Not Showing Up?
- Check that your deployment is successful and live
- Verify the URL is publicly accessible
- Test the meta tags using [Farcaster Frame Validator](https://warpcast.com/~/developers/frames)

### API Key Not Working?
- Make sure you added it to all environments
- Redeploy after adding environment variables
- Check your OpenAI account has credits available

### Images Not Generating?
- Check Vercel Function Logs for errors
- Verify OPENAI_API_KEY is set correctly
- Ensure your OpenAI account has API access enabled

---

## Cost Estimates

### OpenAI DALL-E 3 Pricing (as of 2024):
- **Standard quality (1024x1024)**: $0.040 per image
- **Standard quality (1792x1024)**: $0.080 per image

**Example:** 100 image generations = $4-8 USD

---

## Next Steps After Deployment

1. ✅ Test all three features (Photo-to-Chibi, Generate Chibi, Banner Maker)
2. ✅ Share on Farcaster to test frame integration
3. ✅ Customize colors/branding if needed
4. ✅ Monitor OpenAI API usage in your dashboard
5. ✅ Add your custom domain (optional)

---

## Support

Need help? Check:
- [Vercel Documentation](https://vercel.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Farcaster Frames Documentation](https://docs.farcaster.xyz/developers/frames/v2/spec)

Built with ❤️ for the Noela Universe
