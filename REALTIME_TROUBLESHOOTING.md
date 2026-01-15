# Real-time Updates Troubleshooting

## Check if Realtime is Working

1. **Open Browser Console** (F12 → Console tab)
2. **Look for these messages:**
   - ✅ `"Successfully subscribed to realtime updates"` = Working!
   - ❌ `"Realtime channel error"` = Problem with Realtime setup
   - ❌ `"Realtime subscription timed out"` = Connection issue

## Verify Supabase Realtime is Enabled

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/bnnhrktquhhtijojahup
2. Navigate to **Database** → **Replication**
3. Check that `media_items` table is listed under "Replicated Tables"
4. If it's NOT listed:
   - Click **"Add table"** or **"Enable replication"**
   - Select `media_items` table
   - Save

## Alternative: Check via SQL

Run this in Supabase SQL Editor:

```sql
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'media_items';
```

If this returns no rows, Realtime is not enabled. Run:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.media_items;
```

## Test Real-time Updates

1. Open the site in two browser windows/tabs
2. Upload a file in one window
3. The other window should update automatically (no refresh needed)
4. Check the console for "Realtime update received" messages

## Common Issues

### Issue: "CHANNEL_ERROR" in console
**Solution:** Realtime might not be enabled for the table. Follow steps above.

### Issue: "TIMED_OUT" in console
**Solution:** Check your internet connection. Realtime uses WebSockets.

### Issue: Updates work locally but not in production
**Solution:** 
- Check that environment variables are set correctly in GitHub Secrets
- Verify the Supabase URL and keys are correct
- Check browser console for errors

### Issue: No console messages at all
**Solution:**
- Make sure you're looking at the Console tab (not Network or Elements)
- Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check if JavaScript errors are blocking the subscription

## Still Not Working?

If real-time updates still don't work after checking the above:

1. Check the browser console for specific error messages
2. Verify the Supabase project is active (not paused)
3. Try in an incognito window to rule out extension interference
4. Check Supabase Dashboard → Logs for any Realtime errors
