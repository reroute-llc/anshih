# AWS Amplify Deployment Guide

This guide covers deploying Anshih to AWS Amplify for frontend hosting with backend options.

## Architecture Options

### Option 1: Amplify Frontend + Separate Backend (Recommended)
- **Frontend**: AWS Amplify (React app)
- **Backend**: AWS Lambda + API Gateway, or EC2, or Elastic Beanstalk

### Option 2: Amplify Full-Stack
- **Frontend**: AWS Amplify
- **Backend**: Amplify Backend (Lambda functions)

This guide focuses on **Option 1** as it's more flexible and cost-effective.

## Quick Setup

### Part 1: Deploy Frontend to Amplify

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Amplify deployment"
   git push origin main
   ```

2. **Create AWS Amplify App**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
   - Click "New app" → "Host web app"
   - Select "GitHub" and authorize
   - Choose your `anshih` repository
   - Select branch: `main`

3. **Configure Build Settings**
   - Amplify will auto-detect `amplify.yml`
   - Verify these settings:
     - **App name**: `anshih`
     - **Branch**: `main`
     - **Build settings**: Should auto-detect from `amplify.yml`

4. **Set Environment Variables**
   - Go to App settings → Environment variables
   - Add:
     ```
     VITE_API_URL=https://your-backend-url.com
     ```
   - **Note**: You'll update this after deploying the backend

5. **Deploy**
   - Click "Save and deploy"
   - Amplify will build and deploy your frontend
   - Get your Amplify URL: `https://main.xxxxx.amplifyapp.com`

### Part 2: Deploy Backend

Choose one of these options:

#### Option A: AWS Lambda + API Gateway (Serverless)

1. **Create Lambda Function**
   - Go to AWS Lambda Console
   - Create function from scratch
   - Runtime: Node.js 20.x
   - Upload your `server/` directory as a deployment package

2. **Configure API Gateway**
   - Create new REST API
   - Connect to your Lambda function
   - Set up routes: `/api/*`
   - Deploy API

3. **Update Environment Variables**
   - In Lambda function → Configuration → Environment variables:
     ```
     NODE_ENV=production
     UPLOADTHING_TOKEN=your_token
     UPLOADTHING_SECRET=your_secret
     CLIENT_URL=https://main.xxxxx.amplifyapp.com
     ```

4. **Update Amplify Environment Variable**
   - Update `VITE_API_URL` to your API Gateway URL

#### Option B: AWS Elastic Beanstalk (Easier)

1. **Create Elastic Beanstalk Application**
   - Go to AWS Elastic Beanstalk Console
   - Create new application
   - Platform: Node.js
   - Upload your code or connect to GitHub

2. **Configure Environment**
   - Set environment variables in EB console
   - Deploy your application

3. **Update Amplify Environment Variable**
   - Update `VITE_API_URL` to your EB URL

#### Option C: EC2 Instance (Full Control)

1. **Launch EC2 Instance**
   - Choose Amazon Linux 2 or Ubuntu
   - Install Node.js 20+
   - Clone your repository

2. **Set Up Application**
   ```bash
   npm run install:all
   npm run build
   ```

3. **Run with PM2**
   ```bash
   npm install -g pm2
   pm2 start server/server.js --name anshih
   pm2 save
   pm2 startup
   ```

4. **Configure Security Group**
   - Allow inbound traffic on port 3001 (or your chosen port)

5. **Set Up Nginx Reverse Proxy** (Recommended)
   - Install Nginx
   - Configure reverse proxy to your Node.js app
   - Set up SSL with Let's Encrypt

6. **Update Amplify Environment Variable**
   - Update `VITE_API_URL` to your EC2 URL

## Environment Variables

### Amplify (Frontend)
```
VITE_API_URL=https://your-backend-url.com
```

### Backend (Lambda/EB/EC2)
```
NODE_ENV=production
PORT=3001
CLIENT_URL=https://main.xxxxx.amplifyapp.com
UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlX2I2NzlhNTlkMjlmZGIwMzg2MmI4N2ZiZTk4N2Y2YTVjMDUyYjEzNTJlN2FjZTY0OTA0ZjkwNDYyNDRjYzBiYTciLCJhcHBJZCI6ImZrbDMyNWNhZXAiLCJyZWdpb25zIjpbInNlYTEiXX0=
UPLOADTHING_SECRET=sk_live_b679a59d29fdb03862b87fbe987f6a5c052b1352e7ace64904f9046244cc0ba7
```

## Custom Domain Setup

### For Amplify:

1. **Add Custom Domain**
   - Go to App settings → Domain management
   - Click "Add domain"
   - Enter your domain (e.g., `anshih.example.com`)

2. **Configure DNS**
   - Amplify provides DNS records
   - Add CNAME record in your DNS provider
   - Wait for DNS propagation

3. **SSL Certificate**
   - Amplify automatically provisions SSL via AWS Certificate Manager
   - No additional configuration needed

## How It Works

1. **Frontend (Amplify)**:
   - Builds React app from `client/`
   - Serves static files via CloudFront CDN
   - Auto-deploys on push to `main`

2. **Backend (Your Choice)**:
   - Handles API routes (`/api/*`)
   - Stores files in UploadThing
   - Serves media metadata

3. **Communication**:
   - Frontend makes API calls to backend URL
   - CORS configured for Amplify domain

## Troubleshooting

### Build Fails in Amplify

**Error: "Cannot find module"**
- Check `amplify.yml` build commands
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

**Error: "Build timeout"**
- Increase build timeout in Amplify settings
- Optimize build process
- Check for unnecessary dependencies

### CORS Errors

- Ensure backend `CLIENT_URL` matches Amplify domain
- Check server CORS configuration
- Verify `VITE_API_URL` is set correctly

### Backend Connection Issues

- Verify backend is accessible
- Check security groups (EC2) or API Gateway settings
- Verify environment variables are set
- Check backend logs

### SSL Certificate Issues

- Amplify handles SSL automatically
- For custom domain, ensure DNS is configured correctly
- Wait for certificate provisioning (can take time)

## Cost

### Amplify (Frontend)
- **Free Tier**: 15 GB storage, 5 GB bandwidth/month
- **Paid**: $0.15/GB storage, $0.085/GB bandwidth

### Backend Options
- **Lambda**: Free tier (1M requests/month), then pay per request
- **Elastic Beanstalk**: Free tier (750 hours/month), then ~$15-30/month
- **EC2**: Pay for instance (varies by size)

## Monitoring

- **Amplify**: View build logs, deployment history, metrics
- **CloudWatch**: Monitor Lambda/EB/EC2 logs and metrics
- **API Gateway**: View API logs and metrics

## Next Steps

1. Deploy frontend to Amplify
2. Choose and deploy backend option
3. Connect frontend to backend
4. Set up custom domain (optional)
5. Monitor and optimize

Your app will automatically deploy on every push to `main` branch!
