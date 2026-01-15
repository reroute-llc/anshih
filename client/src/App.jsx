import { useState, useEffect, useMemo } from 'react'
import { supabase } from './lib/supabase'
import Header from './components/Header'
import MediaHub from './components/MediaHub'
import UploadPanel from './components/UploadPanel'
import MediaViewer from './components/MediaViewer'
import './App.css'

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
      const { error } = await supabase
        .from('media_items')
        .update({ name: newName })
        .eq('id', id)
        .eq('type', type)

      if (error) throw error
      // Media will be updated via Realtime subscription
    } catch (error) {
      console.error('Rename error:', error)
      throw error
    }
  }

  const handleReorder = async (type, sourceIndex, targetIndex) => {
    try {
      const items = media[type]
      const sourceItem = items[sourceIndex]
      const targetItem = items[targetIndex]
      
      // Swap display_order values
      const sourceOrder = sourceItem.display_order ?? sourceIndex
      const targetOrder = targetItem.display_order ?? targetIndex

      // Update both items
      const { error: error1 } = await supabase
        .from('media_items')
        .update({ display_order: targetOrder })
        .eq('id', sourceItem.id)

      if (error1) throw error1

      const { error: error2 } = await supabase
        .from('media_items')
        .update({ display_order: sourceOrder })
        .eq('id', targetItem.id)

      if (error2) throw error2
      // Media will be updated via Realtime subscription
    } catch (error) {
      console.error('Reorder error:', error)
      throw error
    }
  }

  const handleDelete = async (type, id) => {
    try {
      // First get the item to delete the file from storage
      const { data: item } = await supabase
        .from('media_items')
        .select('storage_path, storage_bucket')
        .eq('id', id)
        .single()

      if (item) {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from(item.storage_bucket || 'media')
          .remove([item.storage_path])

        if (storageError) {
          console.warn('Storage delete error:', storageError)
          // Continue with database delete even if storage delete fails
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('media_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      // Media will be updated via Realtime subscription
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }

  // Transform Supabase data to our format
  const transformMediaData = (items) => {
    const result = {
      soundbites: [],
      gifs: [],
      images: []
    }

    items.forEach(item => {
      const transformed = {
        id: item.id,
        name: item.name,
        url: supabase.storage.from(item.storage_bucket || 'media').getPublicUrl(item.storage_path).data.publicUrl,
        type: item.type,
        uploadedAt: item.uploaded_at,
        size: item.size,
        display_order: item.display_order
      }

      if (item.type === 'soundbites') {
        result.soundbites.push(transformed)
      } else if (item.type === 'gifs') {
        result.gifs.push(transformed)
      } else if (item.type === 'images') {
        result.images.push(transformed)
      }
    })

    // Sort by display_order
    Object.keys(result).forEach(type => {
      result[type].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    })

    return result
  }

  useEffect(() => {
    // Fetch initial media
    const fetchMedia = async () => {
      try {
        const { data, error } = await supabase
          .from('media_items')
          .select('*')
          .order('display_order', { ascending: true })

        if (error) throw error

        const transformed = transformMediaData(data || [])
        setMedia(transformed)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching media:', err)
        setLoading(false)
      }
    }

    fetchMedia()

    // Listen for real-time updates
    // Use a unique channel name to avoid conflicts
    const channelName = `media-changes-${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media_items',
          filter: '*' // Listen to all changes
        },
        async (payload) => {
          console.log('Realtime update received:', payload.eventType, payload)
          // Refetch media on any change
          const { data, error } = await supabase
            .from('media_items')
            .select('*')
            .order('display_order', { ascending: true })

          if (!error && data) {
            const transformed = transformMediaData(data)
            setMedia(transformed)
            console.log('Media updated via realtime')
          } else if (error) {
            console.error('Error refetching after realtime update:', error)
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Realtime subscription status:', status)
        if (err) {
          console.error('Realtime subscription error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime channel error - check Supabase Realtime settings')
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Realtime subscription timed out')
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Realtime channel closed')
        }
      })

    return () => {
      console.log('Cleaning up realtime subscription')
      supabase.removeChannel(channel)
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
