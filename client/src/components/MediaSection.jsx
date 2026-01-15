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

  // Prevent drag when clicking on interactive elements
  const handlePointerDown = (e) => {
    // Don't start drag if clicking on interactive elements
    if (e.target.closest('.media-name') || 
        e.target.closest('.media-name-input') ||
        e.target.closest('button') ||
        e.target.closest('input')) {
      e.stopPropagation()
      return
    }
    // Allow drag to proceed
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-id={item.id}
      className={`drag-item ${isDragging ? 'dragging' : ''} ${isOver ? 'drag-over' : ''} ${isOver && dropSide ? `drop-${dropSide}` : ''}`}
      {...attributes}
      onPointerDown={handlePointerDown}
      onMouseDown={listeners?.onMouseDown}
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
        delay: 250, // 250ms delay for touch devices (mobile) - requires long press
        tolerance: 5, // Allow 5px movement during delay
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
    
    // Track mouse position during drag
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    mouseMoveHandlerRef.current = handleMouseMove
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
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
        
        // Try multiple methods to get mouse position
        let mouseX = mousePosition.x
        
        // If mouse position not available, try to get from event
        if (!mouseX || mouseX === 0) {
          if (event.activatorEvent?.clientX) {
            mouseX = event.activatorEvent.clientX
          } else if (event.delta?.x !== undefined) {
            // Estimate from delta
            mouseX = itemCenterX + event.delta.x
          } else {
            mouseX = itemCenterX
          }
        }
        
        // Use a smaller threshold for more reliable detection
        const threshold = rect.width * 0.2 // 20% threshold
        let side
        
        if (mouseX < (itemCenterX - threshold)) {
          side = 'left'
        } else if (mouseX > (itemCenterX + threshold)) {
          side = 'right'
        } else {
          // In the middle zone, use drag direction or default to right
          const dragDirection = event.delta?.x || 0
          side = dragDirection < -10 ? 'left' : 'right'
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

    // Clean up mouse tracking
    if (mouseMoveHandlerRef.current) {
      document.removeEventListener('mousemove', mouseMoveHandlerRef.current)
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
      
      // Calculate target index based on drop side
      // If dropping on the right, insert after the target item
      // If dropping on the left, insert before the target item
      let targetIndex
      
      if (dropSide === 'right') {
        // Insert after the target
        targetIndex = newIndex + 1
        // Adjust if dragging from before the target (items shift)
        if (oldIndex < newIndex) {
          targetIndex = newIndex + 1
        }
      } else if (dropSide === 'left') {
        // Insert before the target
        targetIndex = newIndex
        // Adjust if dragging from after the target
        if (oldIndex > newIndex) {
          targetIndex = newIndex
        }
      } else {
        // Fallback: use @dnd-kit's natural behavior (insert after)
        targetIndex = oldIndex < newIndex ? newIndex : newIndex + 1
      }

      // Ensure targetIndex is within bounds
      targetIndex = Math.max(0, Math.min(targetIndex, items.length))

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
          autoScroll={{ threshold: { x: 0.2, y: 0.2 } }}
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
