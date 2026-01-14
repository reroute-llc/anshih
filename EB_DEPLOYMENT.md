# AWS Elastic Beanstalk Backend Deployment

Quick guide for deploying the Anshih backend to AWS Elastic Beanstalk (to use with Amplify frontend).

## Prerequisites

- AWS account
- Frontend deployed to Amplify (get the Amplify URL)
- UploadThing credentials

## Quick Setup

### 1. Prepare Your Code

Your code is already set up. The server will:
- Run on port 8081 (EB default) or use `PORT` environment variable
- Serve static files from `client/dist/` in production
- Handle API routes

### 2. Create Elastic Beanstalk Application

1. **Go to Elastic Beanstalk Console**
   - [AWS Elastic Beanstalk](https://console.aws.amazon.com/elasticbeanstalk)

2. **Create Application**
   - Click **"Create application"**
   - **Application name**: `anshih-backend`
   - **Description**: Optional

3. **Create Environment**
   - Click **"Create environment"**
   - **Environment tier**: Web server environment
   - **Platform**: Node.js
   - **Platform branch**: Node.js 20 running on 64bit Amazon Linux 2023
   - **Platform version**: Latest

4. **Configure Application Code**
   - **Source**: Upload your code
   - Or use **"Sample application"** first, then upload code later

5. **Configure Service Access**
   - **Service role**: Create new role (or use existing)
   - **EC2 key pair**: Optional (for SSH access)

6. **Set Up Networking**
   - **VPC**: Default VPC (or your VPC)
   - **Instance subnets**: Default
   - **Load balancer**: Application Load Balancer (recommended)

7. **Configure Instance**
   - **Instance type**: t3.micro (free tier) or t3.small
   - **EC2 key pair**: Optional

8. **Configure Capacity**
   - **Environment type**: Single instance (for free tier)
   - Or **Load balanced** for production

9. **Configure Rolling Updates and Deployments**
   - **Deployment policy**: All at once (or Rolling)

10. **Configure Security**
    - **Security groups**: Default (or create custom)
    - Allow inbound HTTP (port 80) and HTTPS (port 443)

11. **Set Environment Variables**
    - Scroll to **Environment properties**
    - Add:
      ```
      NODE_ENV=production
      CLIENT_URL=https://main.xxxxx.amplifyapp.com
      UPLOADTHING_TOKEN=your_token
      UPLOADTHING_SECRET=your_secret
      ```
    - **Note**: `PORT` is automatically set by Elastic Beanstalk (usually 8081), no need to set it manually

12. **Review and Launch**
    - Review all settings
    - Click **"Create environment"**
    - Wait 5-10 minutes for deployment

### 3. Get Your Backend URL

After deployment:
- Your backend URL will be: `http://your-env.xxxxx.elasticbeanstalk.com`
- Or use the Load Balancer URL if using load balancer

### 4. Update Amplify Environment Variable

1. Go to Amplify Console
2. App settings → Environment variables
3. Update `VITE_API_URL` to your EB URL
4. Redeploy Amplify app

### 5. Configure HTTPS (Optional but Recommended)

1. **Request SSL Certificate**
   - Go to AWS Certificate Manager
   - Request public certificate
   - Add your domain

2. **Configure Load Balancer**
   - Go to EC2 → Load Balancers
   - Select your EB load balancer
   - Add HTTPS listener with your certificate

3. **Update Environment Variables**
   - Update `CLIENT_URL` and `VITE_API_URL` to use HTTPS

## Environment Variables Summary

**Elastic Beanstalk:**
```
NODE_ENV=production
CLIENT_URL=https://main.xxxxx.amplifyapp.com
UPLOADTHING_TOKEN=your_token
UPLOADTHING_SECRET=your_secret
```
**Note**: `PORT` is automatically set by EB (usually 8081)

**Amplify:**
```
VITE_API_URL=https://your-env.xxxxx.elasticbeanstalk.com
```

## Troubleshooting

### Deployment Fails

- Check EB logs: Environment → Logs → Request logs
- Verify Node.js version compatibility
- Check environment variables are set correctly

### App Doesn't Start

- Check application logs in EB console
- Verify `PORT` environment variable
- Ensure `npm start` command works locally

### CORS Errors

- Verify `CLIENT_URL` matches Amplify domain exactly
- Check server CORS configuration
- Ensure backend allows requests from Amplify domain

### Health Check Fails

- EB checks `/` endpoint by default
- Your server should respond to `/` or configure health check path
- Check EB environment health in console

## Cost

- **Free Tier**: 750 hours/month for t2.micro/t3.micro
- **After Free Tier**: ~$15-30/month for t3.small instance
- **Load Balancer**: Additional ~$16/month if using

## Next Steps

1. Deploy backend to EB
2. Update Amplify `VITE_API_URL`
3. Test the full stack
4. Set up custom domain (optional)
5. Configure HTTPS (recommended)
