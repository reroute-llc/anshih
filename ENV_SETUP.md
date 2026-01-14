# Environment Variables Setup

This document contains the Supabase credentials for the Anshih project.

## Project Information

- **Project ID**: `bnnhrktquhhtijojahup`
- **Project URL**: `https://bnnhrktquhhtijojahup.supabase.co`
- **Database Password**: `CW9Mkt1xKlIaKpeV`

## Environment Variables

### For Local Development

Create `client/.env.local`:

```env
VITE_SUPABASE_URL=https://bnnhrktquhhtijojahup.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_-zb-sNQfjzeL613x-3aDyQ_ojoO8SRr
```

### For GitHub Pages Deployment

Set these as GitHub Secrets (Repository → Settings → Secrets and variables → Actions):

- **Name**: `VITE_SUPABASE_URL`
  - **Value**: `https://bnnhrktquhhtijojahup.supabase.co`

- **Name**: `VITE_SUPABASE_ANON_KEY`
  - **Value**: `sb_publishable_-zb-sNQfjzeL613x-3aDyQ_ojoO8SRr`

### For Edge Functions

Edge Functions automatically have access to:
- `SUPABASE_URL` - Set automatically by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Set automatically by Supabase

**Note**: The service role key (`sb_secret_1vt0n9XhMpWzWR_VOYxXIA_SCi5laJ6`) is automatically available to Edge Functions and should NOT be exposed in the frontend.

## Security Notes

⚠️ **Important**:
- Never commit `.env.local` files to git
- Never expose the service role key in frontend code
- The anon/publishable key is safe to use in frontend code
- Keep the database password secure

## Verification

To verify your setup:

1. **Local**: Check that `client/.env.local` exists with correct values
2. **GitHub**: Check that secrets are set in repository settings
3. **Edge Function**: Should be automatically configured by Supabase
