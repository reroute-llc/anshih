# Railway Quick Setup Checklist

Follow these steps to deploy Anshih to Railway:

## ✅ Step-by-Step Setup

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2. Create Railway Account
- Go to [railway.app](https://railway.app)
- Sign up with GitHub (recommended)

### 3. Create New Project
- Click **"New Project"**
- Select **"Deploy from GitHub repo"**
- Choose your `anshih` repository
- Railway will auto-detect Node.js

### 4. Configure Service
- Railway creates a service automatically
- Go to the service → **Settings**

### 5. Set Environment Variables
Go to **Variables** tab and add:

```
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-app-name.up.railway.app
UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlX2I2NzlhNTlkMjlmZGIwMzg2MmI4N2ZiZTk4N2Y2YTVjMDUyYjEzNTJlN2FjZTY0OTA0ZjkwNDYyNDRjYzBiYTciLCJhcHBJZCI6ImZrbDMyNWNhZXAiLCJyZWdpb25zIjpbInNlYTEiXX0=
UPLOADTHING_SECRET=sk_live_b679a59d29fdb03862b87fbe987f6a5c052b1352e7ace64904f9046244cc0ba7
```

**⚠️ Important**: 
- Railway will generate a domain like `your-app-name.up.railway.app`
- **After first deploy**, update `CLIENT_URL` with your actual Railway domain
- Then redeploy

### 6. Verify Build Settings
In service **Settings** → **Build**:
- **Root Directory**: `/` (root)
- **Build Command**: `npm run install:all && npm run build` (auto-detected)
- **Start Command**: `npm start` (auto-detected)

### 7. Deploy
- Railway will auto-deploy on push to `main`
- Or click **"Deploy"** button to deploy now
- Watch the logs for build progress

### 8. Get Your URL
- After deploy, Railway shows your URL
- Format: `https://your-app-name.up.railway.app`
- **Update `CLIENT_URL`** with this URL
- Redeploy to apply changes

### 9. Test Your App
- Visit your Railway URL
- Try uploading a file
- Check that everything works

## 🎉 Done!

Your app is now live on Railway and will auto-deploy on every push to `main`.

## 🔧 Troubleshooting

**Build fails?**
- Check Railway logs
- Verify all dependencies are in `package.json`

**App doesn't start?**
- Check environment variables are set
- Verify `CLIENT_URL` matches your Railway domain

**CORS errors?**
- Ensure `CLIENT_URL` is set correctly
- Must match your Railway domain exactly

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed guide.
