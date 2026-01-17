import { useState, useEffect } from 'react'
import './TextItem.css'

function TextItem({ item, onRename }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Detect mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                   ('ontouchstart' in window) || 
                   (navigator.maxTouchPoints > 0)

  useEffect(() => {
    setEditName(item.name)
  }, [item.name])

  const handleCopyClick = async () => {
    const button = document.querySelector(`[data-copy-id="${item.id}"]`)
    
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
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(item.content)
        showFeedback('COPIED!')
      } else {
        // Fallback: use textarea method
        const textArea = document.createElement('textarea')
        textArea.value = item.content
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        textArea.style.pointerEvents = 'none'
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          showFeedback('COPIED!')
        } catch (e) {
          console.error('Failed to copy text:', e)
          showFeedback('FAILED!')
        }
        document.body.removeChild(textArea)
      }
    } catch (error) {
      console.error('Copy failed:', error)
      showFeedback('FAILED!')
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
        await onRename('text', item.id, editName.trim())
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

  // Truncate text for preview
  const previewLength = 100
  const isLong = item.content.length > previewLength
  const displayText = isExpanded || !isLong ? item.content : item.content.substring(0, previewLength) + '...'

  return (
    <div className="text-item">
      <div className="text-preview">
        <div className="text-content">
          {displayText}
        </div>
        {isLong && (
          <button 
            className="text-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          >
            {isExpanded ? 'SHOW LESS' : 'SHOW MORE'}
          </button>
        )}
      </div>
      <div className="text-info">
        {isEditing ? (
          <input
            type="text"
            className="text-name-input"
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
            className="text-name" 
            onClick={handleNameClick} 
            title="Click to rename"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          >
            {item.name}
          </div>
        )}
        {!isMobile && (
          <div className="text-actions">
            <button 
              className="text-action-btn"
              onClick={handleCopyClick}
              data-copy-id={item.id}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            >
              COPY
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TextItem
