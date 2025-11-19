# Troubleshooting Guide for Noela Frame

## Common Production Issues

### 1. API Key Issues

**Symptoms:**
- "Invalid API key" errors
- "API key not configured" messages

**Solutions:**
1. Verify API key is added to Vercel environment variables
2. Check API key starts with `sk-`
3. Ensure no extra spaces or quotes in the key
4. Redeploy after adding/updating environment variables

**Test your API key:**
Visit `https://your-app.vercel.app/api/test-connection` to verify OpenAI connection.

### 2. Image Upload Failures

**Symptoms:**
- "Payload too large" errors
- Upload hangs or fails

**Solutions:**
- Images are automatically compressed to under 1MB before upload
- Original image limit is 10MB
- If still failing, try a smaller image

### 3. Generation Errors

**Symptoms:**
- "Failed to generate image" errors
- Timeout errors

**Solutions:**
1. Check OpenAI account has available credits
2. Verify API key has image generation permissions
3. Try a different prompt (some prompts may violate content policy)
4. Wait a moment and try again (rate limits)

### 4. Farcaster Frame Not Working

**Symptoms:**
- Frame doesn't show in Warpcast
- Share button doesn't work

**Solutions:**
1. Ensure app is deployed and publicly accessible
2. Check meta tags are properly set in the HTML
3. Verify `.well-known/farcaster.json` is accessible
4. Share the full URL including https://

## Checking Logs

### Vercel Logs
1. Go to your project in Vercel dashboard
2. Click "Logs" tab
3. Look for `[v0]` prefixed messages for detailed debugging

### Browser Console
1. Open browser DevTools (F12)
2. Check Console tab for `[v0]` logs
3. Check Network tab for failed API requests

## API Endpoint Testing

Test individual endpoints:

\`\`\`bash
# Test API connection
curl https://your-app.vercel.app/api/test-connection

# Test chibi generation (replace with your actual data)
curl -X POST https://your-app.vercel.app/api/generate-chibi \
  -H "Content-Type: application/json" \
  -d '{"prompt":"cute chibi girl","style":"cute","aspectRatio":"1:1"}'
\`\`\`

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid API key" | Wrong or missing API key | Check environment variables |
| "Rate limit exceeded" | Too many requests | Wait and try again |
| "Content policy violation" | Prompt violates OpenAI policy | Try different prompt |
| "Payload too large" | Image too big | Use smaller image |
| "Billing limit reached" | OpenAI account out of credits | Add credits to OpenAI account |

## Getting Help

If issues persist:
1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Test API connection endpoint
4. Check browser console for errors
5. Contact support with error logs
