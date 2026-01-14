# Render Quick Setup Checklist

Follow these steps to deploy Anshih to Render:

## ✅ Step-by-Step Setup

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Create Render Account
- Go to [render.com](https://render.com)
- Sign up with GitHub (recommended)

### 3. Create New Web Service
- Click **"New +"** → **"Web Service"**
- Select **"Build and deploy from a Git repository"**
- Connect GitHub if needed
- Choose your `anshih` repository

### 4. Configure Service
Fill in these settings:

- **Name**: `anshih` (or your choice)
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: `/` (leave empty for root)
- **Runtime**: `Node`
- **Build Command**: `npm run install:all && npm run build`
- **Start Command**: `npm start`
- **Instance Type**: Free (or Starter for always-on)

### 5. Set Environment Variables
Click "Add Environment Variable" for each:

```
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-service-name.onrender.com
UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlX2I2NzlhNTlkMjlmZGIwMzg2MmI4N2ZiZTk4N2Y2YTVjMDUyYjEzNTJlN2FjZTY0OTA0ZjkwNDYyNDRjYzBiYTciLCJhcHBJZCI6ImZrbDMyNWNhZXAiLCJyZWdpb25zIjpbInNlYTEiXX0=
UPLOADTHING_SECRET=sk_live_b679a59d29fdb03862b87fbe987f6a5c052b1352e7ace64904f9046244cc0ba7
```

**⚠️ Important**: 
- Render will generate a domain like `your-service-name.onrender.com`
- **After first deploy**, update `CLIENT_URL` with your actual Render domain
- Then redeploy

### 6. Deploy
- Click **"Create Web Service"**
- Render will start building
- Watch the build logs
- Wait for deployment to complete

### 7. Get Your URL
- After deploy, Render shows your URL
- Format: `https://your-service-name.onrender.com`
- **Update `CLIENT_URL`** environment variable with this URL
- Go to Environment → Edit `CLIENT_URL`
- Save and redeploy

### 8. Test Your App
- Visit your Render URL
- Try uploading a file
- Check that everything works

## 🎉 Done!

Your app is now live on Render and will auto-deploy on every push to `main`.

## ⚠️ Free Tier Notes

- Services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- 750 hours/month total across all services
- Consider Starter plan ($7/month) for always-on service

## 🔧 Troubleshooting

**Build fails?**
- Check Render logs
- Verify all dependencies are in `package.json`
- Check Node.js version (should be 20+)

**App doesn't start?**
- Check environment variables are set
- Verify `CLIENT_URL` matches your Render domain
- Check logs for errors

**CORS errors?**
- Ensure `CLIENT_URL` is set correctly
- Must match your Render domain exactly

**Service sleeping?**
- Free tier services sleep after inactivity
- First request wakes it up (takes ~30 seconds)
- Upgrade to Starter plan for always-on

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed guide.
