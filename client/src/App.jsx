import { useState, useEffect, useMemo } from 'react'
import { io } from 'socket.io-client'
import Header from './components/Header'
import MediaHub from './components/MediaHub'
import UploadPanel from './components/UploadPanel'
import MediaViewer from './components/MediaViewer'
import './App.css'

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001')

function App() {
  const [media, setMedia] = useState({
    soundbites: [],
    gifs: [],
    images: []
  })
  const [showUpload, setShowUpload] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    currentType: null,
    currentIndex: 0
  })
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [droppedFile, setDroppedFile] = useState(null)

  // Flatten all media into a single array for navigation
  const allMedia = useMemo(() => {
    return [
      ...media.gifs.map(item => ({ ...item, type: 'gifs' })),
      ...media.images.map(item => ({ ...item, type: 'images' })),
      ...media.soundbites.map(item => ({ ...item, type: 'soundbites' }))
    ]
  }, [media])

  const handleMediaClick = (type, index) => {
    // Find the index in the flattened array
    let flatIndex = 0
    if (type === 'gifs') {
      flatIndex = index
    } else if (type === 'images') {
      flatIndex = media.gifs.length + index
    } else if (type === 'soundbites') {
      flatIndex = media.gifs.length + media.images.length + index
    }
    
    setViewerState({
      isOpen: true,
      currentType: type,
      currentIndex: flatIndex
    })
  }

  const handleCloseViewer = () => {
    setViewerState({
      isOpen: false,
      currentType: null,
      currentIndex: 0
    })
  }

  const handleNext = () => {
    if (viewerState.currentIndex < allMedia.length - 1) {
      setViewerState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1
      }))
    }
  }

  const handlePrevious = () => {
    if (viewerState.currentIndex > 0) {
      setViewerState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex - 1
      }))
    }
  }

  const handleRename = async (type, id, newName) => {
    try {
      const response = await fetch(`/api/media/${type}/${id}/rename`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName })
      })

      if (response.ok) {
        // Media will be updated via socket
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Rename failed')
      }
    } catch (error) {
      console.error('Rename error:', error)
      throw error
    }
  }

  const handleReorder = async (type, sourceIndex, targetIndex) => {
    try {
      const response = await fetch(`/api/media/${type}/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceIndex, targetIndex })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Reorder failed')
      }
      // Media will be updated via socket
    } catch (error) {
      console.error('Reorder error:', error)
      throw error
    }
  }

  const handleDelete = async (type, id) => {
    try {
      const response = await fetch(`/api/media/${type}/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Delete failed')
      }
      // Media will be updated via socket
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }

  useEffect(() => {
    // Fetch initial media
    fetch('/api/media')
      .then(res => res.json())
      .then(data => {
        setMedia(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching media:', err)
        setLoading(false)
      })

    // Listen for real-time updates
    socket.on('media-updated', (updatedMedia) => {
      setMedia(updatedMedia)
    })

    return () => {
      socket.off('media-updated')
    }
  }, [])

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingOver(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set to false if we're leaving the app container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDraggingOver(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0] // Take the first file
      // Open upload panel if not already open
      if (!showUpload) {
        setShowUpload(true)
      }
      // Set the dropped file
      setDroppedFile(file)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-text">LOADING...</div>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`app ${isDraggingOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Header 
        onUploadClick={() => setShowUpload(!showUpload)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <MediaHub 
        media={media} 
        onMediaClick={handleMediaClick}
        onRename={handleRename}
        onReorder={handleReorder}
        onDelete={handleDelete}
        searchQuery={searchQuery}
      />
      {showUpload && (
        <UploadPanel 
          onClose={() => {
            setShowUpload(false)
            setDroppedFile(null)
          }}
          onUploadSuccess={() => {
            // Media will be updated via socket
            setShowUpload(false)
            setDroppedFile(null)
          }}
          droppedFile={droppedFile}
        />
      )}
      {viewerState.isOpen && (
        <MediaViewer
          media={allMedia}
          currentIndex={viewerState.currentIndex}
          onClose={handleCloseViewer}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      )}
    </div>
  )
}

export default App
