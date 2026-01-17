import { useState, useEffect, useMemo } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
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
  const [textItems, setTextItems] = useState([])
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
      if (type === 'text') {
        const { error } = await supabase
          .from('text_items')
          .update({ name: newName })
          .eq('id', id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('media_items')
          .update({ name: newName })
          .eq('id', id)
          .eq('type', type)

        if (error) throw error
      }
      // Items will be updated via Realtime subscription
    } catch (error) {
      console.error('Rename error:', error)
      throw error
    }
  }

  const handleReorder = async (type, sourceIndex, targetIndex) => {
    try {
      let items, tableName
      
      if (type === 'text') {
        items = textItems
        tableName = 'text_items'
      } else {
        items = media[type]
        tableName = 'media_items'
      }
      
      // Clamp indices to valid range
      const clampedSource = Math.max(0, Math.min(sourceIndex, items.length - 1))
      const clampedTarget = Math.max(0, Math.min(targetIndex, items.length))
      
      // If indices are the same, no reorder needed
      if (clampedSource === clampedTarget) {
        return
      }
      
      // Optimistically update local state immediately for responsive UI
      if (type === 'text') {
        setTextItems(prevItems => {
          const newArray = arrayMove([...prevItems], clampedSource, clampedTarget)
          return newArray
        })
      } else {
        setMedia(prevMedia => {
          const updated = { ...prevMedia }
          const typeArray = [...updated[type]]
          const newArray = arrayMove(typeArray, clampedSource, clampedTarget)
          updated[type] = newArray
          return updated
        })
      }
      
      // Now update display_order values in the database
      const reorderedItems = arrayMove([...items], clampedSource, clampedTarget)
      
      // Batch update all items with their new display_order
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        display_order: index
      }))
      
      // Update all items in parallel
      const updatePromises = updates.map(update => 
        supabase
          .from(tableName)
          .update({ display_order: update.display_order })
          .eq('id', update.id)
      )
      
      const results = await Promise.all(updatePromises)
      
      // Check for errors
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        console.error('Some reorder updates failed:', errors)
        // Revert optimistic update by refetching
        if (type === 'text') {
          const { data, error } = await supabase
            .from('text_items')
            .select('*')
            .order('display_order', { ascending: true })
          
          if (!error && data) {
            const transformed = transformTextData(data)
            setTextItems(transformed)
          }
        } else {
          const { data, error } = await supabase
            .from('media_items')
            .select('*')
            .order('display_order', { ascending: true })
          
          if (!error && data) {
            const transformed = transformMediaData(data)
            setMedia(transformed)
          }
        }
        throw new Error('Failed to update some items')
      }
      
      // Items will also be updated via Realtime subscription as a backup
    } catch (error) {
      console.error('Reorder error:', error)
      // Revert optimistic update by refetching
      if (type === 'text') {
        const { data, error: fetchError } = await supabase
          .from('text_items')
          .select('*')
          .order('display_order', { ascending: true })
        
        if (!fetchError && data) {
          const transformed = transformTextData(data)
          setTextItems(transformed)
        }
      } else {
        const { data, error: fetchError } = await supabase
          .from('media_items')
          .select('*')
          .order('display_order', { ascending: true })
        
        if (!fetchError && data) {
          const transformed = transformMediaData(data)
          setMedia(transformed)
        }
      }
      throw error
    }
  }

  const handleDelete = async (type, id) => {
    try {
      if (type === 'text') {
        // Delete text item from database
        const { error } = await supabase
          .from('text_items')
          .delete()
          .eq('id', id)

        if (error) throw error
      } else {
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
      }
      // Items will be updated via Realtime subscription
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

  // Transform text items data
  const transformTextData = (items) => {
    return items.map(item => ({
      id: item.id,
      name: item.name,
      content: item.content,
      display_order: item.display_order ?? 0,
      created_at: item.created_at,
      updated_at: item.updated_at
    })).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  }

  useEffect(() => {
    // Fetch initial media and text items
    const fetchData = async () => {
      try {
        // Fetch media items
        const { data: mediaData, error: mediaError } = await supabase
          .from('media_items')
          .select('*')
          .order('display_order', { ascending: true })

        if (mediaError) throw mediaError

        const transformed = transformMediaData(mediaData || [])
        setMedia(transformed)

        // Fetch text items
        const { data: textData, error: textError } = await supabase
          .from('text_items')
          .select('*')
          .order('display_order', { ascending: true })

        if (textError) throw textError

        const transformedText = transformTextData(textData || [])
        setTextItems(transformedText)

        setLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setLoading(false)
      }
    }

    fetchData()

    // Listen for real-time updates for media items
    const mediaChannel = supabase
      .channel('media-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media_items'
        },
        async (payload) => {
          console.log('Realtime update received:', payload.eventType, payload)
          
          // For UPDATE events, check if display_order changed (reorder)
          // If display_order changed, we need to re-sort the array
          if (payload.eventType === 'UPDATE' && payload.new) {
            const oldDisplayOrder = payload.old?.display_order
            const newDisplayOrder = payload.new.display_order
            
            // If display_order changed, refetch to get correct order
            // (Multiple items may have been updated)
            if (oldDisplayOrder !== newDisplayOrder) {
              const { data, error } = await supabase
                .from('media_items')
                .select('*')
                .order('display_order', { ascending: true })

              if (!error && data) {
                const transformed = transformMediaData(data)
                setMedia(transformed)
                console.log('Media reordered via realtime')
              } else if (error) {
                console.error('Error refetching after reorder:', error)
              }
            } else {
              // Only name or other non-order fields changed, update in place
              setMedia(prevMedia => {
                const updated = { ...prevMedia }
                const itemType = payload.new.type
                const itemId = payload.new.id
                
                // Find and update the item in the correct type array
                const typeArray = updated[itemType] || []
                const itemIndex = typeArray.findIndex(item => item.id === itemId)
                
                if (itemIndex !== -1) {
                  // Update the existing item
                  const updatedItem = {
                    ...typeArray[itemIndex],
                    name: payload.new.name,
                    display_order: payload.new.display_order,
                    updated_at: payload.new.updated_at
                  }
                  
                  // Reconstruct the array with the updated item
                  const newArray = [...typeArray]
                  newArray[itemIndex] = updatedItem
                  updated[itemType] = newArray
                  
                  return updated
                }
                
                // If item not found, fall back to refetch
                return prevMedia
              })
            }
          } else {
            // For INSERT/DELETE, refetch to maintain correct order
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
        }
      )
      .subscribe((status, err) => {
        console.log('Media realtime subscription status:', status)
        if (err) {
          console.error('Media realtime subscription error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to media realtime updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Media realtime channel error - check Supabase Realtime settings')
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Media realtime subscription timed out')
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Media realtime channel closed')
        }
      })

    // Listen for real-time updates for text items
    const textChannel = supabase
      .channel('text-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'text_items'
        },
        async (payload) => {
          console.log('Text realtime update received:', payload.eventType, payload)
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            const oldDisplayOrder = payload.old?.display_order
            const newDisplayOrder = payload.new.display_order
            
            // If display_order changed, refetch to get correct order
            if (oldDisplayOrder !== newDisplayOrder) {
              const { data, error } = await supabase
                .from('text_items')
                .select('*')
                .order('display_order', { ascending: true })

              if (!error && data) {
                const transformed = transformTextData(data)
                setTextItems(transformed)
                console.log('Text items reordered via realtime')
              } else if (error) {
                console.error('Error refetching text after reorder:', error)
              }
            } else {
              // Only name or content changed, update in place
              setTextItems(prevItems => {
                const itemIndex = prevItems.findIndex(item => item.id === payload.new.id)
                
                if (itemIndex !== -1) {
                  const updatedItem = {
                    ...prevItems[itemIndex],
                    name: payload.new.name,
                    content: payload.new.content,
                    display_order: payload.new.display_order,
                    updated_at: payload.new.updated_at
                  }
                  
                  const newArray = [...prevItems]
                  newArray[itemIndex] = updatedItem
                  return newArray
                }
                
                return prevItems
              })
            }
          } else {
            // For INSERT/DELETE, refetch to maintain correct order
            const { data, error } = await supabase
              .from('text_items')
              .select('*')
              .order('display_order', { ascending: true })

            if (!error && data) {
              const transformed = transformTextData(data)
              setTextItems(transformed)
              console.log('Text items updated via realtime')
            } else if (error) {
              console.error('Error refetching text after realtime update:', error)
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Text realtime subscription status:', status)
        if (err) {
          console.error('Text realtime subscription error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to text realtime updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Text realtime channel error - check Supabase Realtime settings')
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Text realtime subscription timed out')
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Text realtime channel closed')
        }
      })

    return () => {
      console.log('Cleaning up realtime subscriptions')
      supabase.removeChannel(mediaChannel)
      supabase.removeChannel(textChannel)
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
        textItems={textItems}
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
