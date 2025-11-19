# Adding Noela Frame to Farcaster

## Quick Start

Your Noela Frame Miniapp is already configured with Farcaster integration. Follow these steps to make it live:

### 1. Update Your Deployment URL

Replace `YOUR-APP` with your actual Vercel deployment URL in:
- `app/layout.tsx` (2 places in metadata)
- `.well-known/farcaster.json` (all URL fields)

Example: If your Vercel URL is `https://noela-chibi.vercel.app`, replace all instances of `https://YOUR-APP.vercel.app`

### 2. Share on Warpcast

Once deployed with correct URLs:

1. Go to [Warpcast](https://warpcast.com)
2. Create a new cast
3. Paste your deployment URL: `https://YOUR-APP.vercel.app`
4. Add text like: "Check out Noela Frame - create cute anime chibi art!"
5. Post the cast

Warpcast will automatically detect the Frame meta tags and show a preview card with a "Launch" button.

### 3. Test the Miniapp

When users click the "Launch" button on your cast:
- The Noela Frame will open in Farcaster's Miniapp viewer
- Users can transform photos, generate chibis, and create banners
- All features work within Farcaster

### 4. Optional: Submit to Farcaster Directory

For better discoverability:

1. Visit [frames.farcaster.xyz](https://frames.farcaster.xyz) or Warpcast's Frame directory
2. Submit your Frame URL
3. Add description and tags
4. Your Frame will appear in search results

## Technical Details

### Frame Meta Tags
The app includes proper Farcaster Frame v2 (Miniapp) meta tags:
- `fc:frame` - Frame version
- `fc:frame:image` - Preview image (3:2 ratio)
- `fc:frame:button` - Launch button configuration

### Manifest File
`.well-known/farcaster.json` contains:
- Frame metadata (name, icons, splash screen)
- Account association (for verified frames)
- Webhook URL for notifications

### Requirements Met
✅ Responsive mobile design
✅ Frame meta tags in HTML head
✅ Manifest file at `.well-known/farcaster.json`
✅ Splash screen and icons
✅ Webhook endpoint for interactions

## Troubleshooting

**Frame not showing preview?**
- Make sure all URLs use `https://`
- Check that your Vercel deployment is live
- Verify meta tags in browser DevTools

**Launch button not working?**
- Confirm the URL in `fc:frame:button:1:target` matches your deployment
- Check browser console for errors

**Need help?**
- Test your Frame at [frames.farcaster.xyz/validator](https://frames.farcaster.xyz/validator)
- Check Farcaster docs at [docs.farcaster.xyz](https://docs.farcaster.xyz)
- Ask in Farcaster's developer channel on Warpcast

## Share Your Frame

Once live, share with:
- Cast on Warpcast with your URL
- Share on X/Twitter: https://x.com/noela_zee
- Post in Farcaster dev channels
- Add to your Zora profile: https://zora.co/@noela_zee

---

Built with love for the Noela Universe 💙
