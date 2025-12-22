# Vercel Deployment Guide for Dungeonaut

## Architecture Overview

Due to Vercel's serverless architecture, we use a **split deployment**:

- **Frontend** (HTML/CSS/JS) → Vercel
- **WebSocket Server** (Node.js) → Railway or Render

---

## Step 1: Deploy WebSocket Server

### Option A: Railway (Recommended - Easiest)

1. **Sign up at [railway.app](https://railway.app)**

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authenticate and select your repository

3. **Configure Service**
   - Railway auto-detects Node.js
   - It will automatically run `npm install` and `npm start`
   - No configuration needed!

4. **Get Your WebSocket URL**
   - Click on your deployment
   - Go to "Settings" → "Domains"
   - Click "Generate Domain"
   - You'll get: `https://your-app.up.railway.app`
   - **Your WebSocket URL will be**: `wss://your-app.up.railway.app`

5. **Environment Variables** (Optional)
   - Railway automatically sets `PORT`
   - No additional env vars needed for basic setup

---

### Option B: Render (Free Tier Available)

1. **Sign up at [render.com](https://render.com)**

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure Build Settings**
   ```
   Name: dungeonaut-server
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Get Your WebSocket URL**
   - After deployment, you'll get: `https://your-app.onrender.com`
   - **Your WebSocket URL will be**: `wss://your-app.onrender.com`

5. **Note**: Free tier spins down after inactivity (cold starts ~30s)

---

## Step 2: Update Client Configuration

Open `multiplayer.js` and find line 25:

```javascript
serverUrl = 'wss://YOUR-APP-NAME.up.railway.app';
```

**Replace with your actual WebSocket server URL:**

#### If using Railway:
```javascript
serverUrl = 'wss://dungeonaut-production.up.railway.app';
```

#### If using Render:
```javascript
serverUrl = 'wss://dungeonaut-server.onrender.com';
```

**Save the file!**

---

## Step 3: Deploy Frontend to Vercel

### Using Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy from your project directory**
   ```bash
   cd c:\Users\wolfe\dungeonaut
   vercel
   ```

3. **Follow the prompts:**
   ```
   ? Set up and deploy "~/dungeonaut"? [Y/n] y
   ? Which scope do you want to deploy to? [Your Account]
   ? Link to existing project? [y/N] n
   ? What's your project's name? dungeonaut
   ? In which directory is your code located? ./
   ```

4. **Get your deployment URL**
   - Vercel will output: `https://dungeonaut.vercel.app`
   - Open it in your browser!

### Using Vercel Dashboard

1. **Go to [vercel.com/dashboard](https://vercel.com/dashboard)**

2. **Click "Add New..." → "Project"**

3. **Import your Git repository**
   - Connect GitHub/GitLab/Bitbucket
   - Select your `dungeonaut` repository

4. **Configure Project**
   - Framework Preset: Other
   - Root Directory: `./`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)

5. **Deploy!**
   - Vercel will automatically deploy
   - Your site will be live at `https://dungeonaut.vercel.app`

---

## Step 4: Testing Your Deployment

### Test Connection

1. **Open your Vercel URL** (e.g., `https://dungeonaut.vercel.app`)

2. **Check Multiplayer Status**
   - Top-right corner should show: "Connected" (green)
   - If red, check browser console (F12) for errors

3. **Test Matchmaking**
   - Click "PvP Arena"
   - Select "Online Casual"
   - You should see "Searching for opponent..."

4. **Test with Two Browsers**
   - Open your Vercel URL in Chrome
   - Open the same URL in Firefox (or incognito)
   - Both players join "Online Casual"
   - Match should be found!

### Troubleshooting

**"Disconnected" Status (Red)**
- Check that WebSocket server is running (visit Railway/Render dashboard)
- Verify `serverUrl` in `multiplayer.js` matches your deployed server
- Check browser console for specific error messages

**"Connection Error"**
- Ensure you're using `wss://` (not `ws://`) in production
- Check that Railway/Render service is active
- Verify no firewall/network blocks

**Cold Starts (Render Free Tier)**
- First connection may take 30 seconds
- Consider upgrading to paid tier for instant responses

---

## Step 5: Custom Domain (Optional)

### For Vercel Frontend

1. **Go to Vercel Dashboard → Your Project → Settings → Domains**
2. **Add your domain** (e.g., `dungeonaut.com`)
3. **Update DNS records** as instructed by Vercel

### For Railway/Render Server

1. **Go to Railway/Render Dashboard → Settings → Domains**
2. **Add custom domain** (e.g., `ws.dungeonaut.com`)
3. **Update `multiplayer.js`** with your custom domain:
   ```javascript
   serverUrl = 'wss://ws.dungeonaut.com';
   ```

---

## Security Considerations for Production

### Enable CORS Protection (server.js)

At the top of `server.js`, add origin validation:

```javascript
const ALLOWED_ORIGINS = [
    'https://dungeonaut.vercel.app',
    'https://www.dungeonaut.com', // if using custom domain
    'http://localhost:3000' // for local testing
];

wss.on('connection', (ws, req) => {
    const origin = req.headers.origin;
    if (!ALLOWED_ORIGINS.includes(origin)) {
        ws.close();
        return;
    }
    // ... rest of your connection handler
});
```

### Rate Limiting

Add to prevent spam:

```javascript
const connectionLimits = new Map();

wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    const now = Date.now();
    const limit = connectionLimits.get(ip) || { count: 0, timestamp: now };

    if (now - limit.timestamp < 60000 && limit.count > 10) {
        ws.close();
        return;
    }

    connectionLimits.set(ip, { count: limit.count + 1, timestamp: now });
    // ... rest of handler
});
```

---

## Monitoring & Analytics

### Railway Dashboard
- View real-time logs
- Monitor CPU/memory usage
- Track deployment history

### Render Dashboard
- View logs and metrics
- Set up health checks
- Configure alerts

### Client-Side Logging
Your game already logs to browser console. For production analytics, consider:
- [LogRocket](https://logrocket.com/) for session replay
- [Sentry](https://sentry.io/) for error tracking

---

## Cost Breakdown

### Free Tier (Good for testing)
- **Vercel**: Unlimited free hosting
- **Render**: Free tier with cold starts
- **Total**: $0/month

### Production Tier (Recommended)
- **Vercel**: Free (or $20/month Pro for team features)
- **Railway**: $5/month for 500 hours (enough for 24/7)
- **Render**: $7/month for always-on instance
- **Total**: ~$5-7/month

---

## Summary Checklist

- [ ] Deploy WebSocket server to Railway/Render
- [ ] Get WebSocket URL (wss://...)
- [ ] Update `multiplayer.js` line 25 with your WebSocket URL
- [ ] Commit and push changes to Git
- [ ] Deploy frontend to Vercel
- [ ] Test with two browsers
- [ ] (Optional) Add custom domain
- [ ] (Optional) Enable security features

---

## Quick Reference

**Your Deployment URLs:**
- Frontend: `https://dungeonaut.vercel.app`
- WebSocket: `wss://[YOUR-APP].up.railway.app`

**Important Files:**
- `multiplayer.js` - Update line 25 with your WebSocket URL
- `vercel.json` - Vercel configuration (already set)
- `package.json` - Server dependencies (already set)

**Support:**
- Railway: [railway.app/help](https://railway.app/help)
- Render: [render.com/docs](https://render.com/docs)
- Vercel: [vercel.com/docs](https://vercel.com/docs)

---

**Ready to deploy? Start with Step 1 above!** 🚀