# AWS Amplify Quick Setup Checklist

Follow these steps to deploy Anshih to AWS Amplify:

## ✅ Step-by-Step Setup

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Amplify deployment"
git push origin main
```

### 2. Create AWS Account
- Go to [aws.amazon.com](https://aws.amazon.com)
- Sign up (if you don't have an account)
- Free tier available for 12 months

### 3. Deploy Frontend to Amplify

#### 3a. Create Amplify App
- Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
- Click **"New app"** → **"Host web app"**
- Select **"GitHub"** and authorize AWS to access your repos
- Choose your `anshih` repository
- Select branch: **`main`**

#### 3b. Configure Build
- Amplify will auto-detect `amplify.yml`
- Verify settings:
  - **App name**: `anshih`
  - **Branch**: `main`
  - Build settings should be auto-detected

#### 3c. Set Environment Variables
- Go to **App settings** → **Environment variables**
- Click **"Manage variables"**
- Add:
  ```
  VITE_API_URL=https://your-backend-url.com
  ```
  - **Note**: You'll update this after deploying backend

#### 3d. Deploy
- Click **"Save and deploy"**
- Watch the build process
- Wait for deployment to complete
- Get your Amplify URL: `https://main.xxxxx.amplifyapp.com`

### 4. Deploy Backend

Choose one option:

#### Option A: Elastic Beanstalk (Easiest)

1. **Go to Elastic Beanstalk Console**
   - [AWS Elastic Beanstalk](https://console.aws.amazon.com/elasticbeanstalk)

2. **Create Application**
   - Click **"Create application"**
   - Name: `anshih-backend`
   - Platform: **Node.js**
   - Platform branch: **Node.js 20**
   - Platform version: Latest

3. **Configure Environment**
   - Environment name: `anshih-backend-env`
   - Domain: Auto-generated or custom
   - Description: Optional

4. **Upload Code**
   - Source code origin: **Sample application** (for now)
   - Or connect to GitHub and select your repo

5. **Configure More Options**
   - Go to **Configuration** → **Software**
   - Add environment properties:
     ```
     NODE_ENV=production
     PORT=3001
     CLIENT_URL=https://main.xxxxx.amplifyapp.com
     UPLOADTHING_TOKEN=your_token
     UPLOADTHING_SECRET=your_secret
     ```

6. **Deploy**
   - Click **"Create environment"**
   - Wait for deployment (5-10 minutes)
   - Get your backend URL

7. **Update Amplify Environment Variable**
   - Go back to Amplify
   - Update `VITE_API_URL` to your EB URL
   - Redeploy Amplify app

#### Option B: Lambda + API Gateway (Serverless)

See detailed guide in [AMPLIFY_DEPLOYMENT.md](./AMPLIFY_DEPLOYMENT.md)

#### Option C: EC2 (Full Control)

See detailed guide in [AMPLIFY_DEPLOYMENT.md](./AMPLIFY_DEPLOYMENT.md)

### 5. Update Environment Variables

**In Amplify:**
- Update `VITE_API_URL` to your backend URL

**In Backend:**
- Update `CLIENT_URL` to your Amplify URL

### 6. Test Your App
- Visit your Amplify URL
- Try uploading a file
- Check that everything works

## 🎉 Done!

Your app is now live on AWS Amplify and will auto-deploy on every push to `main`.

## 🔧 Troubleshooting

**Build fails?**
- Check Amplify build logs
- Verify `amplify.yml` is correct
- Check all dependencies are in `package.json`

**CORS errors?**
- Ensure backend `CLIENT_URL` matches Amplify domain
- Check server CORS configuration

**Backend not connecting?**
- Verify backend is accessible
- Check environment variables
- Verify `VITE_API_URL` is set correctly

See [AMPLIFY_DEPLOYMENT.md](./AMPLIFY_DEPLOYMENT.md) for detailed guide.
