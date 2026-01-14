# Anshih - 80's Media Hub

A vibrant 80's retro-styled media hub for Soundbites, GIFs, and Images. Built with React and Node.js.

## Features

- 🎨 **80's Retro UI** - Vibrant neon colors, pixel fonts, and retro styling
- 📱 **Responsive Design** - Works seamlessly on mobile and desktop devices
- 📲 **PWA Support** - Install as a Progressive Web App on mobile and desktop
- 🔊 **Soundbites** - Upload and play audio files
- 🎬 **GIFs** - Upload and share GIF files
- 🖼️ **Images** - Upload and share image files
- ⚡ **Real-time Updates** - Changes are instantly reflected via WebSocket
- 📤 **Easy Upload** - Simple drag-and-drop file upload interface
- 🖼️ **Fullscreen Viewer** - Click media to view in fullscreen with navigation

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Start the development servers:
```bash
npm run dev
```

This will start:
- Frontend server on `http://localhost:3000`
- Backend API server on `http://localhost:3001`

### Project Structure

```
anshih/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/          # Node.js backend
│   ├── server.js
│   ├── uploads/     # Uploaded media files
│   └── package.json
└── package.json
```

## API Endpoints

### GET `/api/media`
Get all media items (soundbites, gifs, images)

### POST `/api/upload`
Upload a new media file
- Body: `multipart/form-data`
- Fields:
  - `file`: The file to upload
  - `type`: Media type (`soundbites`, `gifs`, or `images`)

### DELETE `/api/media/:type/:id`
Delete a media item

## Usage

1. Open `http://localhost:3000` in your browser
2. Click the **UPLOAD** button to add new media
3. Select the media type and file
4. Your media will appear instantly in the hub
5. Click on items to:
   - **Soundbites**: Play/Stop audio
   - **GIFs/Images**: Copy URL to clipboard

## PWA Installation

The app can be installed as a Progressive Web App:

1. **On Mobile (iOS/Android)**:
   - Open the website in your browser
   - Look for "Add to Home Screen" or "Install" prompt
   - Or use browser menu → "Add to Home Screen"

2. **On Desktop (Chrome/Edge)**:
   - Look for the install icon in the address bar
   - Or use browser menu → "Install Anshih"

3. **Icons**:
   - Place `icon-192.png` and `icon-512.png` in the `client/public/` directory
   - You can use the `icon-generator.html` file to create basic icons, or design custom ones

## Building for Production

```bash
# Build the React client
npm run build

# Start the production server
npm start
```

The built files will be in `client/dist/`

**Note**: For PWA to work in production, make sure:
- The site is served over HTTPS (required for service workers)
- Icons are placed in the `public/` directory before building
- Set environment variables (see `DEPLOYMENT.md` for details)

## Deployment

### Render Deployment (Recommended - Full Stack)

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for Render deployment guide.

**Quick setup:**
1. Create Render account and connect GitHub
2. Create new Web Service from GitHub repo
3. Set environment variables in Render dashboard
4. Deploy automatically on push to `main`

### Other Deployment Options

- **Railway**: See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for Railway deployment
- **GitHub Pages**: See [GITHUB_DEPLOYMENT.md](./GITHUB_DEPLOYMENT.md) (frontend only)
- **Manual**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for manual deployment

## Technologies

- **Frontend**: React, Vite, Socket.io-client
- **Backend**: Node.js, Express, Socket.io, Multer
- **Styling**: CSS with 80's retro theme

## License

MIT
