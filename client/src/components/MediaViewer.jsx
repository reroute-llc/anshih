import { useEffect, useState } from 'react'
import './MediaViewer.css'

function MediaViewer({ media, currentIndex, onClose, onNext, onPrevious }) {
  const currentItem = media[currentIndex]
  const hasNext = currentIndex < media.length - 1
  const hasPrevious = currentIndex > 0
  const [copyFeedback, setCopyFeedback] = useState(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && hasPrevious) {
        onPrevious()
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [hasNext, hasPrevious, onClose, onNext, onPrevious])

  if (!currentItem) return null

  const mediaUrl = currentItem.url || `/api/media/${currentItem.type}/${currentItem.filename}`

  const handleCopy = async () => {
    if (currentItem.type === 'gifs' || currentItem.type === 'images') {
      // Detect mobile device - check multiple methods
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                       ('ontouchstart' in window) || 
                       (navigator.maxTouchPoints > 0)
      
      // On mobile, ONLY use Share API (ClipboardItem doesn't work reliably on mobile)
      if (isMobile) {
        if (navigator.share) {
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
            const file = new File([blob], currentItem.name, { type: blob.type || (currentItem.type === 'gifs' ? 'image/gif' : 'image/png') })
            
            // Try sharing the file
            try {
              await navigator.share({ files: [file] })
              setCopyFeedback('SHARED!')
              setTimeout(() => setCopyFeedback(null), 2000)
              return
            } catch (shareError) {
              console.warn('Share API failed, falling back to URL copy:', shareError)
            }
          } catch (shareError) {
            console.warn('Share API error, falling back to URL copy:', shareError)
          }
        }
        
        // Mobile fallback: copy URL
        handleCopyUrl()
        return // Don't try ClipboardItem on mobile
      }
      
      // Desktop: try ClipboardItem
      try {
        // Try method 1: Direct fetch and clipboard
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
          
          // Ensure we have a valid blob type
          const blobType = blob.type || (currentItem.type === 'gifs' ? 'image/gif' : 'image/png')
          
          const supportsClipboardItem = typeof ClipboardItem !== 'undefined'
          if (navigator.clipboard && navigator.clipboard.write && supportsClipboardItem) {
            const clipboardItem = new ClipboardItem({ [blobType]: blob })
            await navigator.clipboard.write([clipboardItem])
            setCopyFeedback('COPIED!')
            setTimeout(() => setCopyFeedback(null), 2000)
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
          
          // Create canvas and draw image
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          
          // Convert canvas to blob (await the promise)
          const blobType = currentItem.type === 'gifs' ? 'image/gif' : 'image/png'
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
            setCopyFeedback('COPIED!')
            setTimeout(() => setCopyFeedback(null), 2000)
            return
          } else {
            throw new Error('ClipboardItem not supported')
          }
        }
      } catch (error) {
        console.error('All copy methods failed:', error)
        // Fallback to copy URL
        handleCopyUrl()
      }
    } else {
      // For soundbites, copy URL
      handleCopyUrl()
    }
  }

  const handleCopyUrl = async () => {
    // Use the full URL directly (item.url is already a full URL from Supabase)
    const url = mediaUrl.startsWith('http') ? mediaUrl : `${window.location.origin}${mediaUrl}`
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
        setCopyFeedback('URL COPIED!')
        setTimeout(() => setCopyFeedback(null), 2000)
      } else {
        // Fallback: copy URL using execCommand (older browsers)
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        textArea.style.pointerEvents = 'none'
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          setCopyFeedback('URL COPIED!')
          setTimeout(() => setCopyFeedback(null), 2000)
        } catch (e) {
          console.error('Failed to copy URL:', e)
        }
        document.body.removeChild(textArea)
      }
    } catch (error) {
      console.error('Copy URL failed:', error)
      // Never show alert - just log the error
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = mediaUrl
    link.download = currentItem.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="media-viewer-overlay" onClick={onClose}>
      <div className="media-viewer-content" onClick={(e) => e.stopPropagation()}>
        <button className="media-viewer-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        
        {hasPrevious && (
          <button 
            className="media-viewer-nav media-viewer-prev" 
            onClick={onPrevious}
            aria-label="Previous"
          >
            <i className="hn hn-chevron-left"></i>
          </button>
        )}
        
        {hasNext && (
          <button 
            className="media-viewer-nav media-viewer-next" 
            onClick={onNext}
            aria-label="Next"
          >
            <i className="hn hn-chevron-right"></i>
          </button>
        )}

        <div className="media-viewer-media">
          {currentItem.type === 'soundbites' ? (
            <div className="media-viewer-audio">
              <audio controls autoPlay src={mediaUrl} className="media-viewer-audio-player">
                Your browser does not support the audio element.
              </audio>
              <div className="media-viewer-info">
                <div className="media-viewer-title">{currentItem.name}</div>
                <div className="media-viewer-counter">
                  {currentIndex + 1} / {media.length}
                </div>
              </div>
            </div>
          ) : (
            <>
              <img 
                src={mediaUrl} 
                alt={currentItem.name}
                className="media-viewer-image"
              />
              <div className="media-viewer-info">
                <div className="media-viewer-title">{currentItem.name}</div>
                <div className="media-viewer-counter">
                  {currentIndex + 1} / {media.length}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="media-viewer-actions">
          <button 
            className="media-viewer-action-btn"
            onClick={handleCopy}
            title="Copy media to clipboard"
          >
            {copyFeedback === 'COPIED!' ? 'COPIED!' : 'COPY'}
          </button>
          <button 
            className="media-viewer-action-btn"
            onClick={handleCopyUrl}
            title="Copy URL to clipboard"
          >
            {copyFeedback === 'URL COPIED!' ? 'COPIED!' : 'COPY URL'}
          </button>
          <button 
            className="media-viewer-action-btn"
            onClick={handleDownload}
            title="Download"
          >
            <i className="hn hn-download"></i>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MediaViewer
