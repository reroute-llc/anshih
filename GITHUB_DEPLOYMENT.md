# GitHub Deployment Guide

This guide covers deploying Anshih using GitHub Actions and GitHub Pages.

## Quick Setup

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/anshih.git
git push -u origin main
```

### 2. Configure GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

**Required:**
- `UPLOADTHING_TOKEN`: Your UploadThing token
- `UPLOADTHING_SECRET`: Your UploadThing secret

**Optional (for GitHub Pages):**
- `CUSTOM_DOMAIN`: Your custom domain (e.g., `anshih.example.com`)

**Optional (for separate backend):**
- `VITE_API_URL`: Your backend URL (if deploying backend separately)

### 3. Enable GitHub Pages

1. Go to repository Settings → Pages
2. Source: Select "GitHub Actions"
3. The workflow will automatically deploy on push to `main`

## Deployment Options

### Option 1: GitHub Pages (Frontend Only)

**Best for**: Free static hosting, frontend only

**Setup:**
1. The `deploy.yml` workflow automatically deploys frontend to GitHub Pages
2. Backend needs to be deployed separately (see Option 2 or 3)

**Limitations:**
- Only serves static files (frontend)
- Backend must be on a different service
- Update `VITE_API_URL` to point to your backend

**URL**: `https://yourusername.github.io/anshih/`

### Option 2: Railway (Full Stack)

**Best for**: Full-stack deployment, easy setup

**Setup:**
1. Create account at [Railway.app](https://railway.app)
2. Create new project
3. Connect your GitHub repository
4. Add GitHub secret: `RAILWAY_TOKEN` (from Railway dashboard)
5. Add GitHub secret: `RAILWAY_SERVICE_ID` (from Railway service settings)
6. Enable the `deploy-railway.yml` workflow
7. Set environment variables in Railway dashboard:
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-app.railway.app`
   - `UPLOADTHING_TOKEN=...`
   - `UPLOADTHING_SECRET=...`

**Benefits:**
- Free tier available
- Automatic deployments
- Full-stack on one platform

### Option 3: Render (Full Stack)

**Best for**: Full-stack deployment, reliable hosting

**Setup:**
1. Create account at [Render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repository
4. Build command: `npm run install:all && npm run build`
5. Start command: `npm start`
6. Add GitHub secrets:
   - `RENDER_SERVICE_ID`: From Render dashboard
   - `RENDER_DEPLOY_KEY`: From Render dashboard
7. Set environment variables in Render dashboard (same as Railway)

**Benefits:**
- Free tier available
- Automatic deployments
- Full-stack on one platform

### Option 4: Manual Deployment

If you prefer manual deployment:

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Deploy backend:**
   - Upload `server/` directory to your hosting
   - Set environment variables
   - Run `npm start`

3. **Deploy frontend:**
   - Upload `client/dist/` to static hosting
   - Or use GitHub Pages manually

## Workflow Files

- **`deploy.yml`**: Main deployment workflow (GitHub Pages + artifacts)
- **`deploy-railway.yml`**: Railway-specific deployment
- **`deploy-render.yml`**: Render-specific deployment

## Environment Variables

Set these in your hosting platform (Railway/Render) or as GitHub Secrets:

```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://yourdomain.com
UPLOADTHING_TOKEN=your_token
UPLOADTHING_SECRET=your_secret
```

## Custom Domain Setup

### For GitHub Pages:

1. Add `CUSTOM_DOMAIN` secret with your domain
2. Add CNAME file in repository root (or let GitHub create it)
3. Configure DNS:
   - Type: `CNAME`
   - Name: `@` or `www`
   - Value: `yourusername.github.io`

### For Railway/Render:

1. Add custom domain in platform dashboard
2. Update `CLIENT_URL` environment variable
3. Configure DNS as instructed by platform

## Troubleshooting

### GitHub Pages not updating
- Check Actions tab for workflow errors
- Ensure workflow file is in `.github/workflows/`
- Verify `main` branch is being pushed to

### Backend connection issues
- Verify `VITE_API_URL` is set correctly
- Check CORS settings in server
- Ensure backend is accessible

### UploadThing errors
- Verify tokens are set correctly
- Check UploadThing dashboard for usage limits
- Ensure tokens have proper permissions

## Next Steps

1. Push your code to GitHub
2. Configure secrets
3. Choose deployment option
4. Set environment variables
5. Deploy!

Your app will automatically deploy on every push to `main` branch.
