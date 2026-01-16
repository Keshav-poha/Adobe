# API Setup Guide for Pixel Pluck

## Groq API Key Setup

This add-on uses Groq's AI models for brand analysis and design auditing. You'll need a Groq API key to use these features.

### Getting Your Groq API Key

1. **Visit Groq Console**:
   - Go to [https://console.groq.com](https://console.groq.com)

2. **Sign Up / Sign In**:
   - Create a free account or sign in if you already have one
   - Groq offers free tier access to their models

3. **Create API Key**:
   - Navigate to API Keys section
   - Click "Create API Key"
   - Give it a name (e.g., "Pixel Pluck Add-on")
   - Copy the generated key immediately (you won't be able to see it again)

4. **Add to .env File**:
   - Open `c:\Projects\Adobe\my-addon\.env`
   - Replace the existing key with your new key:
   ```env
   VITE_GROQ_API_KEY=gsk_YOUR_ACTUAL_KEY_HERE
   ```

5. **Rebuild the Add-on**:
   ```bash
   npm run build
   ```

### Models Used

This add-on uses two Groq models:

1. **llama-3.3-70b-versatile**
   - Used for: Brand extraction and Firefly prompt generation
   - Purpose: Text analysis and generation
   - Context window: 128k tokens

2. **llama-3.2-90b-vision-preview**
   - Used for: Design auditing
   - Purpose: Visual analysis of designs
   - Supports: Image + text input

### Rate Limits (Free Tier)

Groq free tier typically includes:
- ~30 requests per minute
- ~14,400 requests per day
- Sufficient for development and testing

For production use, consider upgrading to a paid plan.

### Security Best Practices

1. **Never commit `.env` to version control**
   - The `.env` file is already in `.gitignore`
   - Never share your API key publicly

2. **Use different keys for dev/prod**
   - Create separate keys for different environments
   - Rotate keys regularly

3. **Monitor usage**
   - Check your Groq console for usage statistics
   - Set up alerts for unusual activity

### Troubleshooting

#### Error: "VITE_GROQ_API_KEY is not defined"
- Check that `.env` file exists in project root
- Ensure the key name is exactly `VITE_GROQ_API_KEY`
- Rebuild after changing `.env`: `npm run build`

#### Error: "401 Unauthorized"
- Your API key is invalid or expired
- Get a new key from Groq console
- Update `.env` and rebuild

#### Error: "429 Too Many Requests"
- You've exceeded rate limits
- Wait a few minutes before trying again
- Consider upgrading your Groq plan

### Alternative: Using Your Own Proxy

For production or to avoid client-side API key exposure, consider:

1. **Create a backend proxy**:
   ```javascript
   // Example Express.js endpoint
   app.post('/api/analyze', async (req, res) => {
     const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
     const result = await groqClient.chat.completions.create(req.body);
     res.json(result);
   });
   ```

2. **Update GroqClient.ts** to call your proxy instead of Groq directly

3. **Deploy proxy** to a service like Vercel, Netlify, or Railway

### CORS Proxy for Website Fetching

The add-on uses `allorigins.win` as a CORS proxy to fetch website content. This is a free service but has limitations:

- Rate limits apply
- May be slow for large websites
- Not recommended for production

**For production**, consider:
- Implementing your own CORS proxy
- Using a service like CORS Anywhere
- Server-side fetching through your own API

---

**Questions?** Open an issue on GitHub or refer to [Groq Documentation](https://console.groq.com/docs).
