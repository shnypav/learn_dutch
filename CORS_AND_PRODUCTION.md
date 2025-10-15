# CORS Issue & Production Deployment Guide

## 🔴 The Problem

The Perplexity API **cannot be called directly from browser JavaScript** due to CORS (Cross-Origin Resource Sharing) restrictions.

### Why This Happens

1. **Security**: API keys in browser code can be stolen by anyone
2. **CORS Policy**: Perplexity's servers reject browser requests (no `Access-Control-Allow-Origin` header)
3. **Best Practice**: API keys should only exist server-side

```
❌ Browser → Perplexity API (BLOCKED by CORS)
✅ Browser → Your Backend → Perplexity API (WORKS)
```

## ✅ Development Solution (Implemented)

I've added a **Vite proxy** to your `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api/perplexity': {
      target: 'https://api.perplexity.ai',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/perplexity/, '')
    }
  }
}
```

### How It Works

```
Browser (localhost:5173)
    ↓ calls /api/perplexity/search
Vite Dev Server (proxies to)
    ↓
Perplexity API ✅ SUCCESS
```

**This ONLY works in development (`npm run dev`)**

## 🚀 Production Solutions

For production deployment, you need a real backend. Here are your options:

### **Option 1: Serverless Functions (Recommended)**

#### Using Netlify Functions

1. **Create function:**

```bash
mkdir -p netlify/functions
```

```javascript
// netlify/functions/perplexity-proxy.js
export async function handler(event, context) {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key not configured" }),
    };
  }

  const { endpoint, body } = JSON.parse(event.body);

  try {
    const response = await fetch(`https://api.perplexity.ai${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
```

2. **Create `netlify.toml`:**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"
```

3. **Update `aiHintService.ts`:**

```typescript
private readonly searchUrl = import.meta.env.DEV
  ? '/api/perplexity/search'
  : '/.netlify/functions/perplexity-proxy';
```

#### Using Vercel Functions

Similar approach with Vercel:

```javascript
// api/perplexity-proxy.js
export default async function handler(req, res) {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const { endpoint, body } = req.body;

  try {
    const response = await fetch(`https://api.perplexity.ai${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### **Option 2: Simple Backend Server**

Create a minimal Express server:

```bash
npm install express cors dotenv
```

```javascript
// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/perplexity/*", async (req, res) => {
  const endpoint = req.params[0];
  const apiKey = process.env.PERPLEXITY_API_KEY;

  try {
    const response = await fetch(`https://api.perplexity.ai/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist"));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### **Option 3: Client-Side Only (Limited)**

**Warning**: This exposes your API key and is NOT recommended.

If you absolutely must (for demos/testing only):

```typescript
// Remove API key from localStorage
// Instead, hardcode it (anyone can see it in network tab)
private apiKey = 'your-key-here'; // ⚠️ INSECURE - DO NOT USE IN PRODUCTION
```

Then use a CORS proxy service (also not recommended for production):

- https://cors-anywhere.herokuapp.com/
- https://corsproxy.io/

## 📋 Recommended Production Setup

### For This App (Dutch Learning)

**Best Choice: Netlify with Serverless Functions**

1. ✅ Free tier available
2. ✅ Automatic HTTPS
3. ✅ Easy environment variable management
4. ✅ Built-in CDN
5. ✅ Zero backend maintenance

### Deployment Steps

1. **Push to GitHub**
2. **Connect to Netlify**
3. **Add environment variable**: `PERPLEXITY_API_KEY`
4. **Deploy** - Done! ✨

## 🔧 Updated Architecture

### Development (Current)

```
Browser → Vite Proxy → Perplexity API
```

### Production (Recommended)

```
Browser → Netlify Function → Perplexity API
        (with API key hidden)
```

## 📝 Next Steps

1. ✅ **Development works now** - Restart dev server to test
2. ⏭️ Choose a production backend solution
3. ⏭️ Implement the proxy/function code
4. ⏭️ Deploy and test

## 🔒 Security Best Practices

1. **Never commit API keys** to Git
2. **Use environment variables** for secrets
3. **Rate limit** your proxy endpoint
4. **Validate requests** on the backend
5. **Monitor usage** to detect abuse

## Resources

- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vite Proxy Config](https://vitejs.dev/config/server-options.html#server-proxy)



