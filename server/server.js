import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync, writeFile } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { promisify } from 'util'
import { UTApi } from 'uploadthing/server'

const writeFileAsync = promisify(writeFile)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000'
const UPLOAD_DIR = join(__dirname, 'uploads')
const DATA_FILE = join(__dirname, 'media-data.json')
const CLIENT_BUILD_DIR = join(__dirname, '..', 'client', 'dist')

// Initialize UploadThing
const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
  secret: process.env.UPLOADTHING_SECRET
})

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: NODE_ENV === 'production' ? CLIENT_URL : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// Ensure upload directories exist
const uploadDirs = {
  soundbites: join(UPLOAD_DIR, 'soundbites'),
  gifs: join(UPLOAD_DIR, 'gifs'),
  images: join(UPLOAD_DIR, 'images')
}

Object.values(uploadDirs).forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
})

// Initialize media data file if it doesn't exist
if (!existsSync(DATA_FILE)) {
  writeFileSync(DATA_FILE, JSON.stringify({
    soundbites: [],
    gifs: [],
    images: []
  }, null, 2))
}

// Load media data
function loadMediaData() {
  try {
    if (!existsSync(DATA_FILE)) {
      const defaultData = { soundbites: [], gifs: [], images: [] }
      saveMediaData(defaultData)
      return defaultData
    }
    const data = readFileSync(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(data)
    // Ensure all required keys exist
    if (!parsed.soundbites) parsed.soundbites = []
    if (!parsed.gifs) parsed.gifs = []
    if (!parsed.images) parsed.images = []
    return parsed
  } catch (error) {
    console.error('Error loading media data:', error)
    const defaultData = { soundbites: [], gifs: [], images: [] }
    saveMediaData(defaultData)
    return defaultData
  }
}

// Save media data
function saveMediaData(data) {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('Error saving media data:', error)
    return false
  }
}

// Auto-detect media type from MIME type
function detectMediaType(mimetype) {
  if (mimetype.startsWith('audio/')) {
    return 'soundbites'
  } else if (mimetype === 'image/gif') {
    return 'gifs'
  } else if (mimetype.startsWith('image/')) {
    return 'images'
  }
  return null
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = detectMediaType(file.mimetype) || 'images'
    cb(null, uploadDirs[type] || uploadDirs.images)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const type = detectMediaType(file.mimetype)
    
    if (!type) {
      cb(new Error('Unsupported file type. Only audio, GIF, or image files are allowed'))
    } else {
      cb(null, true)
    }
  }
})

// Middleware
app.use(cors({
  origin: NODE_ENV === 'production' ? CLIENT_URL : "http://localhost:3000",
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Note: Files are now served from UploadThing, not local storage
// Keeping this for backward compatibility with any existing local files
if (NODE_ENV === 'development') {
  app.use('/api/media/soundbites', express.static(uploadDirs.soundbites))
  app.use('/api/media/gifs', express.static(uploadDirs.gifs))
  app.use('/api/media/images', express.static(uploadDirs.images))
}

// Serve static files from React app in production
if (NODE_ENV === 'production' && existsSync(CLIENT_BUILD_DIR)) {
  app.use(express.static(CLIENT_BUILD_DIR))
}

// API Routes
app.get('/api/media', (req, res) => {
  const mediaData = loadMediaData()
  res.json(mediaData)
})

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }

  const type = detectMediaType(req.file.mimetype)
  if (!type) {
    return res.status(400).json({ error: 'Unsupported file type. Only audio, GIF, or image files are allowed' })
  }

  try {
    // Upload to UploadThing
    // Create a File object (available in Node.js 18+)
    const file = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype
    })

    const uploadResult = await utapi.uploadFiles(file, {
      metadata: {
        type: type,
        originalName: req.file.originalname
      }
    })

    if (!uploadResult || !uploadResult.data || !uploadResult.data.url) {
      throw new Error('Upload to UploadThing failed')
    }

    const customName = req.body.name && req.body.name.trim() ? req.body.name.trim() : req.file.originalname
    const mediaData = loadMediaData()

    const newItem = {
      id: uuidv4(),
      name: customName,
      url: uploadResult.data.url,
      key: uploadResult.data.key,
      uploadedAt: new Date().toISOString(),
      size: req.file.size
    }

    mediaData[type].push(newItem)

    if (saveMediaData(mediaData)) {
      // Broadcast update to all connected clients
      io.emit('media-updated', mediaData)
      res.json({ success: true, item: newItem })
    } else {
      res.status(500).json({ error: 'Failed to save media data' })
    }
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: error.message || 'Upload failed' })
  }
})

// Upload from URL endpoint
app.post('/api/upload-url', async (req, res) => {
  try {
    const { url, name } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    // Download the file from URL
    const response = await fetch(url)
    
    if (!response.ok) {
      return res.status(400).json({ error: `Failed to fetch URL: ${response.statusText}` })
    }

    // Get content type and auto-detect media type
    const contentType = response.headers.get('content-type') || ''
    const type = detectMediaType(contentType)

    if (!type) {
      return res.status(400).json({ error: 'Unsupported file type. URL must point to an audio, GIF, or image file' })
    }

    // Get filename from URL or generate one
    const urlPath = new URL(url).pathname
    const urlFilename = urlPath.split('/').pop() || 'download'
    const fileExtension = urlFilename.includes('.') 
      ? urlFilename.substring(urlFilename.lastIndexOf('.'))
      : (type === 'soundbites' ? '.mp3' : type === 'gifs' ? '.gif' : '.jpg')
    
    // Download the file
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to UploadThing
    const file = new File([buffer], urlFilename || `download${fileExtension}`, {
      type: contentType
    })

    const uploadResult = await utapi.uploadFiles(file, {
      metadata: {
        type: type,
        sourceUrl: url
      }
    })

    if (!uploadResult || !uploadResult.data || !uploadResult.data.url) {
      throw new Error('Upload to UploadThing failed')
    }

    // Use custom name if provided, otherwise use filename from URL
    const originalName = name && name.trim() 
      ? name.trim() 
      : (decodeURIComponent(urlFilename) || `file${fileExtension}`)

    const mediaData = loadMediaData()

    const newItem = {
      id: uuidv4(),
      name: originalName,
      url: uploadResult.data.url,
      key: uploadResult.data.key,
      uploadedAt: new Date().toISOString(),
      size: buffer.length
    }

    mediaData[type].push(newItem)

    if (saveMediaData(mediaData)) {
      // Broadcast update to all connected clients
      io.emit('media-updated', mediaData)
      res.json({ success: true, item: newItem })
    } else {
      res.status(500).json({ error: 'Failed to save media data' })
    }
  } catch (error) {
    console.error('URL upload error:', error)
    res.status(500).json({ error: error.message || 'Failed to upload from URL' })
  }
})

// Reorder media endpoint
app.patch('/api/media/:type/reorder', (req, res) => {
  const { type } = req.params
  const { sourceIndex, targetIndex } = req.body

  if (typeof sourceIndex !== 'number' || typeof targetIndex !== 'number') {
    return res.status(400).json({ error: 'sourceIndex and targetIndex are required' })
  }

  const mediaData = loadMediaData()

  if (!mediaData[type]) {
    return res.status(400).json({ error: 'Invalid media type' })
  }

  if (sourceIndex < 0 || sourceIndex >= mediaData[type].length ||
      targetIndex < 0 || targetIndex > mediaData[type].length) {
    return res.status(400).json({ error: 'Invalid index' })
  }

  // Reorder items
  const [movedItem] = mediaData[type].splice(sourceIndex, 1)
  // Adjust target index if source was before target
  const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex
  mediaData[type].splice(adjustedTargetIndex, 0, movedItem)

  if (saveMediaData(mediaData)) {
    // Broadcast update to all connected clients
    io.emit('media-updated', mediaData)
    res.json({ success: true })
  } else {
    res.status(500).json({ error: 'Failed to save media data' })
  }
})

// Rename media endpoint
app.patch('/api/media/:type/:id/rename', (req, res) => {
  const { type, id } = req.params
  const { name } = req.body

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' })
  }

  const mediaData = loadMediaData()

  if (!mediaData[type]) {
    return res.status(400).json({ error: 'Invalid media type' })
  }

  const itemIndex = mediaData[type].findIndex(item => item.id === id)
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Media not found' })
  }

  mediaData[type][itemIndex].name = name.trim()

  if (saveMediaData(mediaData)) {
    // Broadcast update to all connected clients
    io.emit('media-updated', mediaData)
    res.json({ success: true, item: mediaData[type][itemIndex] })
  } else {
    res.status(500).json({ error: 'Failed to save media data' })
  }
})

// Delete media endpoint
app.delete('/api/media/:type/:id', (req, res) => {
  const { type, id } = req.params
  const mediaData = loadMediaData()

  if (!mediaData[type]) {
    return res.status(400).json({ error: 'Invalid media type' })
  }

  const itemIndex = mediaData[type].findIndex(item => item.id === id)
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Media not found' })
  }

  const item = mediaData[type][itemIndex]
  mediaData[type].splice(itemIndex, 1)

  if (saveMediaData(mediaData)) {
    // Broadcast update to all connected clients
    io.emit('media-updated', mediaData)
    res.json({ success: true })
  } else {
    res.status(500).json({ error: 'Failed to save media data' })
  }
})

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Serve React app for all non-API routes (SPA fallback)
// This must be last, after all API routes
if (NODE_ENV === 'production' && existsSync(CLIENT_BUILD_DIR)) {
  app.get('*', (req, res) => {
    // Don't serve React app for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' })
    }
    res.sendFile(join(CLIENT_BUILD_DIR, 'index.html'))
  })
}

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Anshih server running on http://localhost:${PORT}`)
  console.log(`📁 Upload directory: ${UPLOAD_DIR}`)
  console.log(`🌍 Environment: ${NODE_ENV}`)
  if (NODE_ENV === 'production') {
    console.log(`📦 Serving client from: ${CLIENT_BUILD_DIR}`)
  }
})
