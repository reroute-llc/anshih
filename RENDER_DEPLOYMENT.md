# Render Deployment Guide

This guide covers deploying Anshih to Render for full-stack hosting.

## Quick Setup (Recommended)

### Method 1: Render Dashboard (Easiest)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Select "Build and deploy from a Git repository"
   - Connect your GitHub account if not already connected
   - Choose your `anshih` repository

3. **Configure Service**
   - **Name**: `anshih` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or `master`)
   - **Root Directory**: `/` (root)
   - **Runtime**: `Node`
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or choose paid for better performance)

4. **Set Environment Variables**
   - Scroll to "Environment Variables" section
   - Click "Add Environment Variable" for each:
     ```
     NODE_ENV=production
     PORT=3001
     CLIENT_URL=https://your-service-name.onrender.com
     UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlX2I2NzlhNTlkMjlmZGIwMzg2MmI4N2ZiZTk4N2Y2YTVjMDUyYjEzNTJlN2FjZTY0OTA0ZjkwNDYyNDRjYzBiYTciLCJhcHBJZCI6ImZrbDMyNWNhZXAiLCJyZWdpb25zIjpbInNlYTEiXX0=
     UPLOADTHING_SECRET=sk_live_b679a59d29fdb03862b87fbe987f6a5c052b1352e7ace64904f9046244cc0ba7
     ```
   - **Important**: Update `CLIENT_URL` after Render generates your domain

5. **Deploy**
   - Click "Create Web Service"
   - Render will start building and deploying
   - Watch the build logs

6. **Get Your URL**
   - After deploy, Render provides a URL like: `https://your-service-name.onrender.com`
   - **Update `CLIENT_URL`** environment variable with this URL
   - Go to Environment Variables → Edit `CLIENT_URL`
   - Save and redeploy

### Method 2: Using render.yaml (Infrastructure as Code)

1. **Push to GitHub**
   - The `render.yaml` file is already configured
   - Push your code to GitHub

2. **Create Blueprint**
   - Go to Render dashboard
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will detect `render.yaml`
   - Review and apply the configuration

3. **Set Environment Variables**
   - In the created service, go to Environment
   - Add the variables (same as Method 1)
   - Update `CLIENT_URL` after first deploy

### Method 3: GitHub Actions Workflow

1. **Get Render Credentials**
   - Go to Render dashboard → Account Settings → API Keys
   - Create a new API key
   - Get your Service ID from the service settings

2. **Configure GitHub Secrets**
   - Go to your GitHub repo → Settings → Secrets → Actions
   - Add:
     - `RENDER_SERVICE_ID`: Your Render service ID
     - `RENDER_DEPLOY_KEY`: Your Render API key

3. **Enable Workflow**
   - The workflow in `.github/workflows/deploy-render.yml` will run automatically
   - Or manually trigger from Actions tab

## Environment Variables

Set these in Render dashboard (Environment tab):

```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-service-name.onrender.com
UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlX2I2NzlhNTlkMjlmZGIwMzg2MmI4N2ZiZTk4N2Y2YTVjMDUyYjEzNTJlN2FjZTY0OTA0ZjkwNDYyNDRjYzBiYTciLCJhcHBJZCI6ImZrbDMyNWNhZXAiLCJyZWdpb25zIjpbInNlYTEiXX0=
UPLOADTHING_SECRET=sk_live_b679a59d29fdb03862b87fbe987f6a5c052b1352e7ace64904f9046244cc0ba7
```

**Important Notes:**
- `CLIENT_URL` should match your Render domain
- Update `CLIENT_URL` after Render generates your domain
- Never commit secrets to Git!

## Custom Domain Setup

1. **In Render Dashboard:**
   - Go to your service → Settings → Custom Domains
   - Click "Add Custom Domain"
   - Enter your domain (e.g., `anshih.example.com`)

2. **Update Environment Variables:**
   - Update `CLIENT_URL` to your custom domain
   - Save and redeploy

3. **Configure DNS:**
   - Render will provide DNS records
   - Add CNAME record pointing to Render's domain
   - Wait for DNS propagation (can take up to 24 hours)

## How It Works

1. **Build Process:**
   - Render runs `npm run install:all` to install all dependencies
   - Then runs `npm run build` to build the React app
   - Client build is in `client/dist/`

2. **Start Process:**
   - Render runs `npm start` which starts the server
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
- Verify Node.js version (should be 20+)

**Error: "Build command failed"**
- Check Render logs for specific error
- Verify build command is correct
- Check for memory issues (free tier has limits)

### App Doesn't Start

**Error: "Port already in use"**
- Render sets `PORT` automatically, don't override it
- Server should use `process.env.PORT || 3001`

**Error: "Cannot connect to database"**
- We use JSON file storage, no database needed
- Ensure `server/media-data.json` is writable

**Service goes to sleep (Free tier)**
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Upgrade to paid plan to avoid sleep

### Environment Variables Not Working

- Verify variables are set in Render dashboard
- Check variable names match exactly (case-sensitive)
- Redeploy after changing variables
- Check logs for variable errors

### Files Not Uploading

- Verify `UPLOADTHING_TOKEN` and `UPLOADTHING_SECRET` are set
- Check UploadThing dashboard for errors
- Verify tokens have proper permissions

### CORS Errors

- Ensure `CLIENT_URL` matches your Render domain exactly
- Check server CORS configuration
- Verify Socket.io origin settings

### Service Sleeps (Free Tier)

- Free tier services sleep after 15 minutes of inactivity
- First request wakes the service (takes ~30 seconds)
- Consider upgrading to paid plan for always-on service

## Monitoring

- **Logs**: View in Render dashboard → Logs tab
- **Metrics**: Render provides CPU, memory, and network metrics
- **Events**: View deployment and service events

## Scaling

- **Free Tier**: 
  - 750 hours/month
  - Services sleep after 15 min inactivity
  - Good for development/testing

- **Starter Plan**: $7/month
  - Always-on service
  - Better performance
  - No sleep

- **Standard Plan**: $25/month
  - Better for production
  - More resources
  - Auto-scaling

## Cost

- **Free Tier**: 750 hours/month (shared across services)
- **Starter Plan**: $7/month per service
- **Standard Plan**: $25/month per service

## Next Steps

1. Deploy to Render using Method 1 (easiest)
2. Set environment variables
3. Test your deployment
4. Set up custom domain (optional)
5. Monitor and scale as needed

Your app will automatically deploy on every push to `main` branch!
