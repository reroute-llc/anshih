# Anshih - 80's Media Hub

A vibrant 80's retro-styled media hub for Soundbites, GIFs, and Images. Built with React and Supabase.

## Features

- 🎨 **80's Retro UI** - Vibrant neon colors, pixel fonts, and retro styling
- 📱 **Responsive Design** - Works seamlessly on mobile and desktop devices
- 📲 **PWA Support** - Install as a Progressive Web App on mobile and desktop
- 🔊 **Soundbites** - Upload and play audio files
- 🎬 **GIFs** - Upload and share GIF files
- 🖼️ **Images** - Upload and share image files
- ⚡ **Real-time Updates** - Changes are instantly reflected via Supabase Realtime
- 📤 **Easy Upload** - Simple drag-and-drop file upload interface
- 🖼️ **Fullscreen Viewer** - Click media to view in fullscreen with navigation

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm or yarn
- Supabase account (free tier available)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/anshih.git
cd anshih
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
cd client
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

4. Set up Supabase:
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the migration: `supabase/migrations/001_initial_schema.sql`
   - Create a storage bucket named `media` (make it public)
   - See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions

5. Start the development server:
```bash
npm run dev
```

This will start the frontend at `http://localhost:3000`

### Project Structure

```
anshih/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── lib/         # Supabase client
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── supabase/            # Supabase configuration
│   ├── functions/       # Edge Functions
│   └── migrations/     # Database migrations
└── package.json
```

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
```

The built files will be in `client/dist/`

**Note**: For PWA to work in production, make sure:
- The site is served over HTTPS (required for service workers)
- Icons are placed in the `public/` directory before building
- Set environment variables (see `.env.example` for details)

## Deployment

### Supabase + GitHub Pages (Recommended)

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for setup guide.

**Quick setup:**
1. Create Supabase project and run database migration
2. Create storage bucket and set policies
3. Deploy Edge Function for URL uploads
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in GitHub Secrets
5. Push to GitHub - frontend auto-deploys to GitHub Pages
6. **No backend server needed!** Everything runs on Supabase

### Other Deployment Options

- **GitHub Pages Setup**: See [GITHUB_PAGES_SETUP.md](./GITHUB_PAGES_SETUP.md)

## Technologies

- **Frontend**: React, Vite
- **Backend**: Supabase (PostgreSQL, Storage, Realtime)
- **Styling**: CSS with 80's retro theme
- **Deployment**: GitHub Pages

## License

MIT
