# Railway Deployment Guide

This guide covers deploying Anshih to Railway for full-stack hosting.

## Quick Setup (Recommended)

### Method 1: Railway GitHub Integration (Easiest)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `anshih` repository
   - Railway will automatically detect it's a Node.js project

3. **Configure Service**
   - Railway will create a service automatically
   - Go to the service settings

4. **Set Environment Variables**
   - Go to Variables tab
   - Add these variables:
     ```
     NODE_ENV=production
     PORT=3001
     CLIENT_URL=https://your-app-name.up.railway.app
     UPLOADTHING_TOKEN=your_uploadthing_token
     UPLOADTHING_SECRET=your_uploadthing_secret
     ```
   - **Important**: Update `CLIENT_URL` after Railway generates your domain

5. **Configure Build Settings**
   - Railway should auto-detect, but verify:
     - **Root Directory**: `/` (root)
     - **Build Command**: `npm run install:all && npm run build`
     - **Start Command**: `npm start`

6. **Deploy**
   - Railway will automatically deploy on every push to `main`
   - Or click "Deploy" to trigger manually

7. **Get Your URL**
   - Railway will provide a URL like: `https://your-app-name.up.railway.app`
   - Update `CLIENT_URL` environment variable with this URL
   - Redeploy if needed

### Method 2: GitHub Actions Workflow

1. **Set up Railway Service**
   - Follow steps 1-3 from Method 1
   - Get your Railway token and service ID

2. **Configure GitHub Secrets**
   - Go to your GitHub repo → Settings → Secrets → Actions
   - Add:
     - `RAILWAY_TOKEN`: Get from Railway → Settings → Tokens
     - `RAILWAY_SERVICE_ID`: Get from Railway service settings

3. **Enable Workflow**
   - The workflow in `.github/workflows/deploy-railway.yml` will run automatically
   - Or manually trigger from Actions tab

## Environment Variables

Set these in Railway dashboard (Variables tab):

```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-app-name.up.railway.app
UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlX2I2NzlhNTlkMjlmZGIwMzg2MmI4N2ZiZTk4N2Y2YTVjMDUyYjEzNTJlN2FjZTY0OTA0ZjkwNDYyNDRjYzBiYTciLCJhcHBJZCI6ImZrbDMyNWNhZXAiLCJyZWdpb25zIjpbInNlYTEiXX0=
UPLOADTHING_SECRET=sk_live_b679a59d29fdb03862b87fbe987f6a5c052b1352e7ace64904f9046244cc0ba7
```

**Important Notes:**
- `CLIENT_URL` should match your Railway domain
- Update `CLIENT_URL` after Railway generates your domain
- Never commit secrets to Git!

## Custom Domain Setup

1. **In Railway Dashboard:**
   - Go to your service → Settings → Networking
   - Click "Custom Domain"
   - Add your domain (e.g., `anshih.example.com`)

2. **Update Environment Variables:**
   - Update `CLIENT_URL` to your custom domain
   - Redeploy

3. **Configure DNS:**
   - Railway will provide DNS records
   - Add CNAME record pointing to Railway's domain
   - Wait for DNS propagation (can take up to 24 hours)

## How It Works

1. **Build Process:**
   - Railway runs `npm run install:all` to install all dependencies
   - Then runs `npm run build` to build the React app
   - Client build is in `client/dist/`

2. **Start Process:**
   - Railway runs `npm start` which starts the server
   - Server serves both:
     - Static files from `client/dist/` (React app)
     - API routes from `/api/*`

3. **File Storage:**
   - All files are stored in UploadThing (cloud)
   - No local file storage needed
   - Media metadata in `server/media-data.json` (persisted)

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Check that all dependencies are in `package.json`
- Ensure `install:all` script runs correctly

**Error: "Build command failed"**
- Check Railway logs for specific error
- Verify Node.js version (should be 20+)

### App Doesn't Start

**Error: "Port already in use"**
- Railway sets `PORT` automatically, don't override it
- Server should use `process.env.PORT || 3001`

**Error: "Cannot connect to database"**
- We use JSON file storage, no database needed
- Ensure `server/media-data.json` is writable

### Environment Variables Not Working

- Verify variables are set in Railway dashboard
- Check variable names match exactly (case-sensitive)
- Redeploy after changing variables

### Files Not Uploading

- Verify `UPLOADTHING_TOKEN` and `UPLOADTHING_SECRET` are set
- Check UploadThing dashboard for errors
- Verify tokens have proper permissions

### CORS Errors

- Ensure `CLIENT_URL` matches your Railway domain exactly
- Check server CORS configuration
- Verify Socket.io origin settings

## Monitoring

- **Logs**: View in Railway dashboard → Deployments → Logs
- **Metrics**: Railway provides CPU, memory, and network metrics
- **Health Checks**: Railway monitors `/api/media` endpoint

## Scaling

Railway automatically scales based on traffic. For higher traffic:

1. **Upgrade Plan**: Railway Pro for better performance
2. **Optimize**: Ensure efficient code and caching
3. **CDN**: UploadThing already provides CDN for files

## Cost

- **Free Tier**: $5 credit/month
- **Hobby Plan**: $5/month (if you exceed free tier)
- **Pro Plan**: $20/month (for production apps)

## Next Steps

1. Deploy to Railway using Method 1 (easiest)
2. Set environment variables
3. Test your deployment
4. Set up custom domain (optional)
5. Monitor and scale as needed

Your app will automatically deploy on every push to `main` branch!
