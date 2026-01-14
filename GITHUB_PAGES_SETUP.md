# GitHub Pages + Backend Quick Setup

Follow these steps to deploy Anshih with frontend on GitHub Pages and backend elsewhere.

## ✅ Step-by-Step Setup

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for GitHub Pages deployment"
git push origin main
```

### 2. Enable GitHub Pages
- Go to your repository → **Settings** → **Pages**
- **Source**: Select **"GitHub Actions"**
- Save

### 3. Set GitHub Secrets for Supabase
- Go to repository → **Settings** → **Secrets and variables** → **Actions**
- Click **"New repository secret"** and add:
  - **Name**: `VITE_SUPABASE_URL`
  - **Value**: Your Supabase project URL (from Supabase Dashboard → Settings → API)
- Click **"New repository secret"** again and add:
  - **Name**: `VITE_SUPABASE_ANON_KEY`
  - **Value**: Your Supabase anon/public key (from Supabase Dashboard → Settings → API)

### 4. Set Up Supabase

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for it to be ready (~2 minutes)

2. **Run Database Migration**
   - Go to **SQL Editor** in Supabase Dashboard
   - Copy and paste contents of `supabase/migrations/001_initial_schema.sql`
   - Click **Run**

3. **Create Storage Bucket**
   - Go to **Storage** in Supabase Dashboard
   - Create bucket named `media`
   - Make it **public**

4. **Set Storage Policies**
   - Go to **Storage** → **Policies**
   - Add policies for public read, upload, update, delete on `media` bucket
   - (See `SUPABASE_SETUP.md` for details)

5. **Deploy Edge Function** (for URL uploads)
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref your-project-ref
   supabase functions deploy upload-url
   ```

6. **Get API Keys**
   - Go to **Settings** → **API** in Supabase Dashboard
   - Copy **Project URL** and **anon/public key**
   - Update GitHub Secrets with these values

### 5. Get Your URL

- **Frontend**: `https://yourusername.github.io/anshih/`

### 6. Test Your App
- Visit your GitHub Pages URL
- Try uploading a file
- Check that everything works

## 🎉 Done!

Your app is now live:
- Frontend on GitHub Pages (free, auto-deploys on push)
- Backend on Render/Railway (your choice)

## 🔧 Troubleshooting

**GitHub Pages not updating?**
- Check Actions tab for workflow errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` secrets are set
- Push a new commit to trigger rebuild

**Supabase connection errors?**
- Verify environment variables are set correctly
- Check Supabase project is active
- Verify anon key is correct

**Storage errors?**
- Check storage bucket exists and is public
- Verify storage policies are set correctly
- Check file size limits

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed Supabase setup guide.
