import { useState, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import MediaItem from './MediaItem'
import './MediaSection.css'

function SortableItem({ id, index, type, item, onMediaClick, onRename, overId, dropSide }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isOver = overId === item.id

  // Create a custom handler that prevents drag on interactive elements
  const handlePointerDown = (e) => {
    // Don't start drag if clicking on interactive elements
    const target = e.target
    if (target.closest('.media-name') || 
        target.closest('.media-name-input') ||
        target.closest('button') ||
        target.closest('input')) {
      e.stopPropagation()
      e.preventDefault()
      return false
    }
    // Allow drag to proceed
    return true
  }

  // Create merged listeners that respect interactive elements
  const dragListeners = listeners ? {
    ...listeners,
    onPointerDown: (e) => {
      if (handlePointerDown(e) && listeners.onPointerDown) {
        listeners.onPointerDown(e)
      }
    },
    onTouchStart: (e) => {
      if (handlePointerDown(e) && listeners.onTouchStart) {
        listeners.onTouchStart(e)
      }
    },
  } : {}

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-id={item.id}
      className={`drag-item ${isDragging ? 'dragging' : ''} ${isOver ? 'drag-over' : ''} ${isOver && dropSide ? `drop-${dropSide}` : ''}`}
      {...attributes}
      {...dragListeners}
    >
      <MediaItem
        type={type}
        item={item}
        onMediaClick={() => onMediaClick && onMediaClick(type, index)}
        onRename={onRename}
      />
    </div>
  )
}

function DeleteZone({ isActive, activeId, items, onDelete, type }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'delete-zone',
  })

  if (!isActive) return null

  return (
    <div
      ref={setNodeRef}
      className={`delete-dropzone ${isOver ? 'drag-over' : ''}`}
    >
      <div className="delete-dropzone-icon">🗑️</div>
      <div className="delete-dropzone-text">DROP HERE TO DELETE</div>
    </div>
  )
}

function MediaSection({ type, items, title, onMediaClick, onRename, onReorder, onDelete }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [overId, setOverId] = useState(null)
  const [dropSide, setDropSide] = useState(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const mouseMoveHandlerRef = useRef(null)

  // Detect if we're on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                   ('ontouchstart' in window) || 
                   (navigator.maxTouchPoints > 0)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // On mobile: require a longer press to start drag (allows scrolling)
        // On desktop: require a small movement to start drag (prevents accidental drags)
        delay: isMobile ? 250 : 0,
        tolerance: isMobile ? 8 : 5,
        distance: isMobile ? 0 : 8, // On desktop, require 8px movement
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const icons = {
    soundbites: '🔊',
    gifs: '🎬',
    images: '🖼️'
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
    
    // Initialize mouse position from the event
    if (event.activatorEvent) {
      setMousePosition({ 
        x: event.activatorEvent.clientX, 
        y: event.activatorEvent.clientY 
      })
    }
    
    // Track pointer position during drag (works for both mouse and touch)
    const handlePointerMove = (e) => {
      const x = e.touches ? e.touches[0]?.clientX : e.clientX
      const y = e.touches ? e.touches[0]?.clientY : e.clientY
      if (x !== undefined && y !== undefined) {
        setMousePosition({ x, y })
      }
    }
    
    mouseMoveHandlerRef.current = handlePointerMove
    document.addEventListener('mousemove', handlePointerMove, { passive: true })
    document.addEventListener('touchmove', handlePointerMove, { passive: true })
  }

  const handleDragOver = (event) => {
    const { active, over } = event
    
    if (!over) {
      setOverId(null)
      setDropSide(null)
      return
    }

    if (over.id === 'delete-zone') {
      setOverId('delete-zone')
      setDropSide(null)
      return
    }

    if (active.id !== over.id) {
      setOverId(over.id)
      
      // Determine which side of the item the cursor is over
      const overElement = document.querySelector(`[data-id="${over.id}"]`)
      if (overElement) {
        const rect = overElement.getBoundingClientRect()
        const itemCenterX = rect.left + rect.width / 2
        
        // Get current pointer position - try multiple sources
        let pointerX = mousePosition.x
        
        // Try to get from touch events (mobile)
        if ((!pointerX || pointerX === 0) && event.activatorEvent) {
          if (event.activatorEvent.touches && event.activatorEvent.touches.length > 0) {
            pointerX = event.activatorEvent.touches[0].clientX
          } else if (event.activatorEvent.clientX) {
            pointerX = event.activatorEvent.clientX
          }
        }
        
        // Fallback: use center if we can't get pointer position
        if (!pointerX || pointerX === 0) {
          pointerX = itemCenterX
        }
        
        // Determine side based on pointer position relative to center
        // Use a 25% threshold for more reliable detection
        const threshold = rect.width * 0.25
        let side
        
        if (pointerX < itemCenterX - threshold) {
          side = 'left'
        } else if (pointerX > itemCenterX + threshold) {
          side = 'right'
        } else {
          // In the middle zone, use drag direction
          // If dragging right (oldIndex < newIndex), default to right
          // If dragging left (oldIndex > newIndex), default to left
          const oldIndex = items.findIndex(item => item.id === active.id)
          const newIndex = items.findIndex(item => item.id === over.id)
          side = oldIndex < newIndex ? 'right' : 'left'
        }
        
        setDropSide(side)
      } else {
        // Fallback: default to right
        setDropSide('right')
      }
    } else {
      setOverId(null)
      setDropSide(null)
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event

    // Clean up pointer tracking
    if (mouseMoveHandlerRef.current) {
      document.removeEventListener('mousemove', mouseMoveHandlerRef.current)
      document.removeEventListener('touchmove', mouseMoveHandlerRef.current)
      mouseMoveHandlerRef.current = null
    }

    setActiveId(null)
    setOverId(null)
    setDropSide(null)
    setMousePosition({ x: 0, y: 0 })

    if (!over) {
      return
    }

    // Handle delete zone
    if (over.id === 'delete-zone') {
      const item = items.find(item => item.id === active.id)
      if (item && onDelete) {
        await onDelete(type, item.id)
      }
      return
    }

    // Handle reordering
    if (active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over.id)
      
      if (oldIndex === -1 || newIndex === -1) {
        return
      }
      
      // Calculate target index based on drop side
      // arrayMove(array, oldIndex, newIndex) moves item from oldIndex to newIndex
      // When moving right (oldIndex < newIndex), arrayMove accounts for removal
      // When moving left (oldIndex > newIndex), arrayMove accounts for removal
      let targetIndex
      
      if (dropSide === 'left') {
        // Insert before the target item
        targetIndex = newIndex
      } else if (dropSide === 'right') {
        // Insert after the target item
        // When moving right, we need to account for the item being removed
        if (oldIndex < newIndex) {
          // Moving right: after removal, target is at newIndex, so insert at newIndex + 1
          // But arrayMove already accounts for removal, so we use newIndex + 1
          targetIndex = newIndex + 1
        } else {
          // Moving left: target stays at newIndex, so insert at newIndex + 1
          targetIndex = newIndex + 1
        }
      } else {
        // Fallback: use direction-based logic
        // When dragging right, insert after target
        // When dragging left, insert before target
        if (oldIndex < newIndex) {
          // Dragging right: insert after target
          targetIndex = newIndex + 1
        } else {
          // Dragging left: insert before target
          targetIndex = newIndex
        }
      }

      // Ensure targetIndex is within bounds
      targetIndex = Math.max(0, Math.min(targetIndex, items.length))
      
      // Debug logging
      console.log('Reorder:', { oldIndex, newIndex, dropSide, targetIndex, itemCount: items.length })

      // Only reorder if the position actually changes
      if (onReorder && targetIndex !== oldIndex) {
        await onReorder(type, oldIndex, targetIndex)
      }
    }
  }

  if (items.length === 0) {
    return (
      <div className="media-section empty">
        <div className="section-header">
          <div className="section-label">
            <span className="section-label-icon">{icons[type] || '📦'}</span>
            <h2 className="section-title">{title}</h2>
            <button 
              className={`section-toggle-btn ${isCollapsed ? 'collapsed' : ''}`}
              onClick={toggleCollapse}
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <i className="hn hn-chevron-up"></i>
            </button>
          </div>
          <div className="section-count">0 ITEMS</div>
        </div>
        {!isCollapsed && (
          <div className="empty-message">
            <div className="empty-icon">📭</div>
            <div className="empty-text">NO {title} YET</div>
            <div className="empty-hint">CLICK UPLOAD TO ADD SOME!</div>
          </div>
        )}
      </div>
    )
  }

  const activeItem = activeId ? items.find(item => item.id === activeId) : null

  return (
    <div className="media-section">
      <div className="section-header">
        <div className="section-label">
          <span className="section-label-icon">{icons[type] || '📦'}</span>
          <h2 className="section-title">{title}</h2>
          <button 
            className={`section-toggle-btn ${isCollapsed ? 'collapsed' : ''}`}
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <i className="hn hn-chevron-up"></i>
          </button>
        </div>
        <div className="section-count">{items.length} ITEMS</div>
      </div>
      {!isCollapsed && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          autoScroll={{ 
            threshold: { x: 0.2, y: 0.2 },
            enabled: true,
            interval: 50,
          }}
        >
          <DeleteZone
            isActive={activeId !== null}
            activeId={activeId}
            items={items}
            onDelete={onDelete}
            type={type}
          />
          <SortableContext
            items={items.map(item => item.id)}
            strategy={rectSortingStrategy}
          >
            <div className="media-grid">
              {items.map((item, index) => (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  index={index}
                  type={type}
                  item={item}
                  onMediaClick={onMediaClick}
                  onRename={onRename}
                  overId={overId}
                  dropSide={dropSide}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeItem ? (
              <div className="drag-item dragging" style={{ opacity: 0.8 }}>
                <MediaItem
                  type={type}
                  item={activeItem}
                  onMediaClick={null}
                  onRename={onRename}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}

export default MediaSection
