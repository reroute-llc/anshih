import { useState, useEffect } from 'react'
import './MediaItem.css'

function MediaItem({ type, item, onMediaClick, onRename }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const clickStartPos = { x: 0, y: 0 }
  const isDragging = { current: false }

  useEffect(() => {
    setEditName(item.name)
  }, [item.name])

  const handlePlayClick = () => {
    if (type === 'soundbites') {
      if (audio) {
        if (isPlaying) {
          audio.pause()
          audio.currentTime = 0
          setIsPlaying(false)
        } else {
          audio.play()
          setIsPlaying(true)
          audio.onended = () => setIsPlaying(false)
        }
      } else {
        const audioUrl = item.url || `/api/media/${type}/${item.filename}`
        const newAudio = new Audio(audioUrl)
        newAudio.play()
        setIsPlaying(true)
        setAudio(newAudio)
        newAudio.onended = () => {
          setIsPlaying(false)
          setAudio(null)
        }
      }
    }
  }

  const handleCopyClick = async () => {
    if (type === 'gifs' || type === 'images') {
      const button = document.querySelector(`[data-copy-id="${item.id}"]`)
      const mediaUrl = item.url || `/api/media/${type}/${item.filename}`
      const supportsClipboardItem = typeof ClipboardItem !== 'undefined'
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                       ('ontouchstart' in window) || 
                       (navigator.maxTouchPoints > 0)
      
      const showFeedback = (message) => {
        if (button) {
          const originalText = button.textContent
          button.textContent = message
          button.style.background = 'var(--orange)'
          button.style.color = 'var(--light-bg)'
          setTimeout(() => {
            button.textContent = originalText
            button.style.background = ''
            button.style.color = ''
          }, 2000)
        }
      }
      
      // For GIFs on mobile, copy URL (expected behavior)
      if (type === 'gifs' && isMobile) {
        const url = item.url || `${window.location.origin}/api/media/${type}/${item.filename}`
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url)
          showFeedback('URL COPIED!')
        } else {
          const textArea = document.createElement('textarea')
          textArea.value = url
          textArea.style.position = 'fixed'
          textArea.style.opacity = '0'
          textArea.style.pointerEvents = 'none'
          document.body.appendChild(textArea)
          textArea.select()
          try {
            document.execCommand('copy')
            showFeedback('URL COPIED!')
          } catch (e) {
            console.error('Failed to copy URL:', e)
          }
          document.body.removeChild(textArea)
        }
        return
      }
      
      // For images on mobile, prioritize Share API to copy the actual image
      if (type === 'images' && isMobile && navigator.share) {
        try {
          const response = await fetch(mediaUrl, {
            mode: 'cors',
            credentials: 'omit',
            cache: 'no-cache'
          })
          
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`)
          }
          
          const blob = await response.blob()
          const file = new File([blob], item.name, { type: blob.type || 'image/png' })
          
          // Try sharing the file (allows user to save/copy via share sheet)
          // Note: Many mobile browsers don't support sharing files, so this may fail
          await navigator.share({ files: [file] })
          showFeedback('SHARED!')
          return
        } catch (shareError) {
          console.warn('Share API failed (may not support files), trying ClipboardItem:', shareError)
          // Fall through to ClipboardItem attempt
        }
      }
      
      // Try ClipboardItem (works on desktop and some mobile browsers)
      try {
        // Method 1: Direct fetch and ClipboardItem
        try {
          const response = await fetch(mediaUrl, {
            mode: 'cors',
            credentials: 'omit',
            cache: 'no-cache'
          })
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const blob = await response.blob()
          
          if (!blob || blob.size === 0) {
            throw new Error('Empty blob received')
          }
          
          const blobType = blob.type || (type === 'gifs' ? 'image/gif' : 'image/png')
          
          if (navigator.clipboard && navigator.clipboard.write && supportsClipboardItem) {
            const clipboardItem = new ClipboardItem({ [blobType]: blob })
            await navigator.clipboard.write([clipboardItem])
            showFeedback('COPIED!')
            return // Success!
          } else {
            throw new Error('ClipboardItem not supported')
          }
        } catch (fetchError) {
          console.warn('Direct fetch failed, trying canvas method:', fetchError)
          
          // Method 2: Use canvas to convert image to blob
          const img = new Image()
          img.crossOrigin = 'anonymous'
          
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = mediaUrl
          })
          
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          
          const blobType = type === 'gifs' ? 'image/gif' : 'image/png'
          const blob = await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to convert canvas to blob'))
              }
            }, blobType)
          })
          
          if (navigator.clipboard && navigator.clipboard.write && supportsClipboardItem) {
            const clipboardItem = new ClipboardItem({ [blobType]: blob })
            await navigator.clipboard.write([clipboardItem])
            showFeedback('COPIED!')
            return
          } else {
            throw new Error('ClipboardItem not supported')
          }
        }
      } catch (error) {
        console.warn('ClipboardItem failed:', error)
        
        // For images on mobile, try Share API again if ClipboardItem failed
        if (type === 'images' && isMobile && navigator.share) {
          try {
            const response = await fetch(mediaUrl, {
              mode: 'cors',
              credentials: 'omit',
              cache: 'no-cache'
            })
            
            if (!response.ok) {
              throw new Error(`Failed to fetch: ${response.statusText}`)
            }
            
            const blob = await response.blob()
            const file = new File([blob], item.name, { type: blob.type || 'image/png' })
            
            await navigator.share({ files: [file] })
            showFeedback('SHARED!')
            return
          } catch (shareError) {
            console.warn('Share API also failed:', shareError)
          }
        }
        
        // Last resort: copy URL (use same logic as Copy URL button)
        const url = mediaUrl.startsWith('http') ? mediaUrl : `${window.location.origin}${mediaUrl}`
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url)
            showFeedback('URL COPIED!')
          } else {
            const textArea = document.createElement('textarea')
            textArea.value = url
            textArea.style.position = 'fixed'
            textArea.style.opacity = '0'
            textArea.style.pointerEvents = 'none'
            document.body.appendChild(textArea)
            textArea.select()
            try {
              document.execCommand('copy')
              showFeedback('URL COPIED!')
            } catch (e) {
              console.error('Failed to copy URL:', e)
              showFeedback('COPY FAILED!')
            }
            document.body.removeChild(textArea)
          }
        } catch (error) {
          console.error('Copy URL failed:', error)
          showFeedback('COPY FAILED!')
        }
      }
    }
  }

  const handleDownload = async () => {
    const mediaUrl = item.url || `/api/media/${type}/${item.filename}`
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0)
    
    // On mobile, use Share API to allow saving the file
    if (isMobile && navigator.share) {
      try {
        const response = await fetch(mediaUrl, {
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-cache'
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`)
        }
        
        const blob = await response.blob()
        const file = new File([blob], item.name, { 
          type: blob.type || (type === 'gifs' ? 'image/gif' : type === 'images' ? 'image/png' : 'audio/mpeg')
        })
        
        // Share the file - user can save it via the share sheet
        await navigator.share({ files: [file] })
        return
      } catch (error) {
        console.warn('Share API failed, falling back to direct download:', error)
        // Fall through to desktop method
      }
    }
    
    // Desktop: use direct download link
    const link = document.createElement('a')
    link.href = mediaUrl
    link.download = item.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleMediaMouseDown = (e) => {
    // Store initial position to detect drag vs click
    clickStartPos.x = e.clientX
    clickStartPos.y = e.clientY
    isDragging.current = false
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - clickStartPos.x)
      const deltaY = Math.abs(moveEvent.clientY - clickStartPos.y)
      if (deltaX > 5 || deltaY > 5) {
        isDragging.current = true
      }
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      setTimeout(() => {
        isDragging.current = false
      }, 100)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMediaClick = (e) => {
    // Don't open viewer if clicking on buttons or name
    if (e.target.closest('button') || e.target.closest('.media-name')) {
      return
    }
    // Don't open viewer if this was a drag operation
    if (isDragging.current) {
      e.preventDefault()
      return
    }
    if (onMediaClick) {
      onMediaClick()
    }
  }

  const handleNameClick = (e) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditName(item.name)
  }

  const handleNameBlur = async () => {
    if (editName.trim() && editName.trim() !== item.name && onRename) {
      try {
        await onRename(type, item.id, editName.trim())
      } catch (error) {
        console.error('Rename error:', error)
        setEditName(item.name) // Revert on error
      }
    } else {
      setEditName(item.name) // Revert if empty or unchanged
    }
    setIsEditing(false)
  }

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    } else if (e.key === 'Escape') {
      setEditName(item.name)
      setIsEditing(false)
    }
  }

  return (
    <div className="media-item">
      <div 
        className="media-preview drag-handle" 
        onMouseDown={handleMediaMouseDown}
        onClick={handleMediaClick}
        style={{ cursor: onMediaClick ? 'pointer' : 'default' }}
      >
        {type === 'soundbites' && (
          <div className="soundbite-preview">
            <div className={`sound-wave ${isPlaying ? 'playing' : ''}`}>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
            </div>
            <div className="sound-icon">🔊</div>
          </div>
        )}
        {type === 'gifs' && (
          <img 
            src={item.url || `/api/media/${type}/${item.filename}`} 
            alt={item.name}
            className="media-image"
            loading="lazy"
            draggable={false}
          />
        )}
        {type === 'images' && (
          <img 
            src={item.url || `/api/media/${type}/${item.filename}`} 
            alt={item.name}
            className="media-image"
            loading="lazy"
            draggable={false}
          />
        )}
      </div>
      <div className="media-info">
        {isEditing ? (
          <input
            type="text"
            className="media-name-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            autoFocus
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        ) : (
          <div 
            className="media-name" 
            onClick={handleNameClick} 
            title="Click to rename"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          >
            {item.name}
          </div>
        )}
        <div className="media-actions">
          {type === 'soundbites' ? (
            <>
              <button 
                className="media-action-btn"
                onClick={handlePlayClick}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              >
                {isPlaying ? 'STOP' : 'PLAY'}
              </button>
              <button 
                className="media-action-btn media-download-btn"
                onClick={handleDownload}
                title="Download"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              >
                <i className="hn hn-download"></i>
              </button>
            </>
          ) : (
            <>
              <button 
                className="media-action-btn"
                onClick={handleCopyClick}
                data-copy-id={item.id}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              >
                COPY
              </button>
              <button 
                className="media-action-btn media-download-btn"
                onClick={handleDownload}
                title="Download"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              >
                <i className="hn hn-download"></i>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default MediaItem
