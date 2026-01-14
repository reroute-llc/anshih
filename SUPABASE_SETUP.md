# Supabase Setup Guide

Quick setup guide for migrating Anshih to Supabase.

## Prerequisites

- Supabase account (free tier available)
- GitHub repository for deployment

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: `anshih`
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)

### 2. Run Database Migration

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy and paste contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Verify table was created: Go to **Table Editor** → should see `media_items` table

### 3. Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Click **New bucket**
3. Name: `media`
4. **Public bucket**: ✅ Enable (for public access)
5. Click **Create bucket**

### 4. Set Storage Policies

1. Go to **Storage** → **Policies**
2. Click **New Policy** on the `media` bucket
3. Create these policies:

**Public Read:**
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');
```

**Public Upload:**
```sql
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'media');
```

**Public Update:**
```sql
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'media');
```

**Public Delete:**
```sql
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'media');
```

### 5. Enable Realtime

1. Go to **Database** → **Publications**
2. Find `supabase_realtime` publication
3. Verify `media_items` table is included (should be from migration)
4. If not, add it:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE media_items;
   ```

### 6. Deploy Edge Function (for URL uploads)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Find project ref in Settings → General)

4. Deploy the function:
   ```bash
   supabase functions deploy upload-url
   ```

### 7. Get API Keys

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...`
   - **service_role key**: (for Edge Functions, keep secret!)

### 8. Set Environment Variables

**For Local Development:**
Create `client/.env.local`:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**For GitHub Pages:**
1. Go to repository → **Settings** → **Secrets and variables** → **Actions**
2. Add secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 9. Test Locally

```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:3000` and test:
- Upload a file
- Rename an item
- Reorder items
- Delete an item

### 10. Deploy

1. Push to GitHub
2. GitHub Pages will auto-deploy
3. Set environment variables in GitHub Secrets
4. Your app is live!

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` file exists
- Verify variable names are correct
- Restart dev server after adding env vars

### "Storage bucket not found"
- Verify bucket name is `media`
- Check bucket is public
- Verify storage policies are set

### "Realtime not working"
- Check `media_items` table is in `supabase_realtime` publication
- Verify RLS policies allow public access
- Check browser console for errors

### "Edge Function not found"
- Deploy the function: `supabase functions deploy upload-url`
- Check function logs in Supabase Dashboard

## Next Steps

- Customize storage bucket name if needed
- Add authentication if you want to restrict access
- Set up custom domain in Supabase
- Monitor usage in Supabase Dashboard

Your app is now running entirely on Supabase! 🎉
