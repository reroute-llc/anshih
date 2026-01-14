# Deployment Guide for Anshih

This guide covers deploying Anshih to production.

## Prerequisites

- Node.js (v18 or higher)
- A hosting service (VPS, Heroku, Railway, Render, etc.)
- Domain name (optional but recommended)

## Quick Start

### 1. Build the Application

```bash
# Install all dependencies
npm run install:all

# Build the React client
npm run build
```

This creates a production build in `client/dist/`.

### 2. Set Environment Variables

Create a `.env` file in the `server/` directory (or set environment variables on your hosting platform):

```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://yourdomain.com

# UploadThing Configuration
UPLOADTHING_TOKEN=your_uploadthing_token_here
UPLOADTHING_SECRET=your_uploadthing_secret_here
```

**Important**: 
- `CLIENT_URL` should be your production domain (e.g., `https://anshih.example.com`)
- For same-domain deployment, use the same domain (e.g., `https://anshih.example.com`)
- `UPLOADTHING_TOKEN` and `UPLOADTHING_SECRET` are required for file storage
- **Never commit these secrets to version control!**

### 3. Start the Server

```bash
npm start
```

Or if you're in the server directory:
```bash
cd server
npm start
```

## Deployment Options

### Option 1: Single Server (Recommended)

Deploy everything on one server:

1. **Build the client**:
   ```bash
   npm run build
   ```

2. **Set environment variables**:
   ```env
   NODE_ENV=production
   PORT=3001
   CLIENT_URL=https://yourdomain.com
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Configure reverse proxy** (nginx example):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 2: Separate Frontend/Backend

Deploy frontend and backend separately:

**Backend** (Node.js server):
- Deploy `server/` directory
- Set `CLIENT_URL` to your frontend URL
- Start with `npm start`

**Frontend** (Static hosting):
- Build: `cd client && npm run build`
- Deploy `client/dist/` to:
  - Netlify
  - Vercel
  - Cloudflare Pages
  - Any static hosting
- Set environment variable `VITE_API_URL` to your backend URL

### Option 3: Platform-Specific

#### Railway

1. Connect your GitHub repository
2. Set environment variables:
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-app.railway.app`
3. Set build command: `npm run build`
4. Set start command: `npm start`

#### Render

1. Create a new Web Service
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add environment variables:
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-app.onrender.com`

#### Heroku

1. Create `Procfile` in root:
   ```
   web: cd server && npm start
   ```
2. Set buildpacks:
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```
3. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set CLIENT_URL=https://your-app.herokuapp.com
   ```
4. Deploy:
   ```bash
   git push heroku main
   ```

## Important Notes

### File Storage

- **Uploads**: Files are stored in **UploadThing** (cloud storage)
- **Data**: Media metadata is in `server/media-data.json`
- **Backup**: Regularly backup `server/media-data.json`!
- **UploadThing**: Files are automatically backed up and served via CDN

### HTTPS Required

- PWA features require HTTPS
- Service workers only work over HTTPS (or localhost)
- Use Let's Encrypt or your hosting provider's SSL
- **Note**: HTTPS is typically handled by your hosting platform or reverse proxy (nginx, Cloudflare, etc.), not the Node.js server itself. The server runs on HTTP internally, and the platform handles SSL termination.

### Environment Variables

**Server** (`.env` in `server/` or platform settings):
- `NODE_ENV=production`
- `PORT=3001` (or your chosen port)
- `CLIENT_URL=https://yourdomain.com`
- `UPLOADTHING_TOKEN=your_token` (required)
- `UPLOADTHING_SECRET=your_secret` (required)

**Client** (build-time, set before `npm run build`):
- `VITE_API_URL=https://yourdomain.com` (if backend is on different domain)

### Database Considerations

Currently using JSON file storage for metadata. For production at scale, consider:
- PostgreSQL or MongoDB for metadata
- Files are already stored in UploadThing (cloud storage with CDN)

## Post-Deployment Checklist

- [ ] HTTPS is enabled
- [ ] Environment variables are set
- [ ] Client build is in `client/dist/`
- [ ] Server is serving static files correctly
- [ ] Upload directories exist and are writable
- [ ] PWA icons are in place
- [ ] Test file upload
- [ ] Test drag-and-drop
- [ ] Test real-time updates
- [ ] Backup strategy is in place

## Troubleshooting

### CORS Errors
- Ensure `CLIENT_URL` matches your frontend domain exactly
- Check CORS settings in `server/server.js`

### Socket.io Connection Issues
- Verify WebSocket support on your hosting platform
- Check firewall settings
- Ensure `CLIENT_URL` is correct

### Static Files Not Loading
- Verify `client/dist/` exists after build
- Check that server is serving from correct directory
- Ensure `NODE_ENV=production` is set

### PWA Not Working
- Must be served over HTTPS
- Check `manifest.json` and service worker
- Verify icons are accessible

## Support

For issues, check:
1. Server logs
2. Browser console
3. Network tab for failed requests
4. Environment variables are set correctly
