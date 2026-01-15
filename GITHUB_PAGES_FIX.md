# GitHub Pages Fix Guide

## Issue
GitHub Pages is showing the README instead of the built React app.

## Solution

### 1. Configure GitHub Pages Source

1. Go to: https://github.com/reroute-llc/anshih/settings/pages
2. Under **Source**, select **"GitHub Actions"** (not "Deploy from a branch")
3. Click **Save**

### 2. Set GitHub Secrets (Required!)

The build will fail without these secrets. Go to:
https://github.com/reroute-llc/anshih/settings/secrets/actions

Add these secrets:

**Secret 1:**
- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://bnnhrktquhhtijojahup.supabase.co`

**Secret 2:**
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `sb_publishable_-zb-sNQfjzeL613x-3aDyQ_ojoO8SRr`

### 3. Trigger Workflow

After setting secrets, either:
- Wait for the next push (already pushed, so it should run automatically)
- Or go to **Actions** tab → **Deploy Frontend to GitHub Pages** → **Run workflow**

### 4. Verify Deployment

1. Go to **Actions** tab
2. Check the latest workflow run
3. If it succeeds, wait 1-2 minutes for GitHub Pages to update
4. Visit: https://reroute-llc.github.io/anshih/

## What Was Fixed

The workflow was missing the artifact download step in the deploy job. This has been fixed in the latest commit.

## If It Still Doesn't Work

1. Check the **Actions** tab for any errors
2. Verify secrets are set correctly
3. Make sure GitHub Pages source is set to "GitHub Actions"
4. Wait a few minutes for GitHub Pages to propagate changes
