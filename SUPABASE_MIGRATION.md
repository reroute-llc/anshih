# Supabase Migration Guide

This guide covers migrating Anshih from Express/UploadThing/Socket.io to Supabase.

## Architecture Changes

### Before (Current)
- **Backend**: Express.js server
- **Storage**: UploadThing
- **Database**: JSON file (`media-data.json`)
- **Real-time**: Socket.io
- **API**: Custom Express endpoints

### After (Supabase)
- **Backend**: Supabase (PostgreSQL + Storage + Realtime)
- **Storage**: Supabase Storage
- **Database**: PostgreSQL (Supabase)
- **Real-time**: Supabase Realtime subscriptions
- **API**: Supabase REST API (auto-generated) + Edge Functions

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key from Settings → API

### 2. Run Database Migration

1. Go to SQL Editor in Supabase Dashboard
2. Run the migration file: `supabase/migrations/001_initial_schema.sql`
3. This creates the `media_items` table and sets up RLS policies

### 3. Create Storage Buckets

1. Go to Storage in Supabase Dashboard
2. Create buckets:
   - `media` (or use default)
   - Make them **public** for easy access

3. Set up storage policies (or use the SQL below):

```sql
-- Allow public read access to storage
create policy "Public Access"
on storage.objects for select
to public
using (bucket_id = 'media');

-- Allow public uploads
create policy "Public Upload"
on storage.objects for insert
to public
with check (bucket_id = 'media');

-- Allow public updates
create policy "Public Update"
on storage.objects for update
to public
using (bucket_id = 'media');

-- Allow public deletes
create policy "Public Delete"
on storage.objects for delete
to public
using (bucket_id = 'media');
```

### 4. Enable Realtime

1. Go to Database → Publications
2. Ensure `supabase_realtime` publication includes `media_items` table
3. (Already done in migration, but verify)

### 5. Set Environment Variables

**Frontend** (GitHub Secrets or `.env`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Edge Functions** (if using):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 6. Install Dependencies

```bash
cd client
npm install @supabase/supabase-js
```

### 7. Update Frontend Code

The frontend will now:
- Use Supabase client instead of fetch API calls
- Use Supabase Storage for file uploads
- Use Supabase Realtime for live updates
- Use Supabase REST API for queries

### 8. Deploy Edge Functions (Optional)

For custom logic like URL uploads and reordering:
- Deploy Edge Functions to Supabase
- See `supabase/functions/` directory

## Migration Benefits

1. **No Backend Server**: Everything runs on Supabase
2. **Auto-scaling**: Supabase handles scaling automatically
3. **Real-time Built-in**: No need for Socket.io
4. **Storage Included**: No need for UploadThing
5. **Auto-generated API**: REST API from database schema
6. **Better Performance**: CDN for storage, optimized queries

## Cost

- **Free Tier**: 
  - 500MB database
  - 1GB storage
  - 2GB bandwidth
  - 2M realtime messages/month
- **Pro Plan**: $25/month for more resources

## Next Steps

1. Follow setup steps above
2. Update frontend code (see updated files)
3. Test thoroughly
4. Deploy frontend to GitHub Pages
5. No backend deployment needed!
