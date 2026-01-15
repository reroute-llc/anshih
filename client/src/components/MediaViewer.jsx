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
      try {
        // Fetch with CORS mode for Supabase Storage URLs
        const response = await fetch(mediaUrl, {
          mode: 'cors',
          credentials: 'omit'
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`)
        }
        
        const blob = await response.blob()
        
        // Ensure we have a valid blob type
        const blobType = blob.type || (currentItem.type === 'gifs' ? 'image/gif' : 'image/png')
        
        if (navigator.clipboard && navigator.clipboard.write) {
          const clipboardItem = new ClipboardItem({ [blobType]: blob })
          await navigator.clipboard.write([clipboardItem])
          setCopyFeedback('COPIED!')
          setTimeout(() => setCopyFeedback(null), 2000)
        } else {
          throw new Error('Clipboard API not supported')
        }
      } catch (error) {
        console.error('Copy failed:', error)
        // Fallback to copy URL
        handleCopyUrl()
      }
    } else {
      // For soundbites, copy URL
      handleCopyUrl()
    }
  }

  const handleCopyUrl = async () => {
    const url = `${window.location.origin}${mediaUrl}`
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
        setCopyFeedback('URL COPIED!')
        setTimeout(() => setCopyFeedback(null), 2000)
      } else {
        // Fallback
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setCopyFeedback('URL COPIED!')
        setTimeout(() => setCopyFeedback(null), 2000)
      }
    } catch (error) {
      console.error('Copy URL failed:', error)
      alert(`URL: ${url}`)
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
