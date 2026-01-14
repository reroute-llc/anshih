import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, name } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Download the file from URL
    const response = await fetch(url)
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${response.statusText}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get content type and detect media type
    const contentType = response.headers.get('content-type') || ''
    let type: string | null = null
    
    if (contentType.startsWith('audio/')) {
      type = 'soundbites'
    } else if (contentType === 'image/gif') {
      type = 'gifs'
    } else if (contentType.startsWith('image/')) {
      type = 'images'
    }

    if (!type) {
      return new Response(
        JSON.stringify({ error: 'Unsupported file type. URL must point to an audio, GIF, or image file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get filename from URL or generate one
    const urlPath = new URL(url).pathname
    const urlFilename = urlPath.split('/').pop() || 'download'
    const fileExtension = urlFilename.includes('.') 
      ? urlFilename.substring(urlFilename.lastIndexOf('.'))
      : (type === 'soundbites' ? '.mp3' : type === 'gifs' ? '.gif' : '.jpg')
    
    // Download the file
    const arrayBuffer = await response.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Generate unique filename
    const uniqueFilename = `${crypto.randomUUID()}${fileExtension}`
    const filePath = `${type}/${uniqueFilename}`

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, buffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    // Insert into database
    const itemName = name && name.trim() 
      ? name.trim() 
      : (decodeURIComponent(urlFilename) || `file${fileExtension}`)

    const { error: dbError } = await supabase
      .from('media_items')
      .insert({
        name: itemName,
        type: type,
        storage_path: filePath,
        storage_bucket: 'media',
        size: buffer.length
      })

    if (dbError) {
      throw dbError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to upload from URL' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
