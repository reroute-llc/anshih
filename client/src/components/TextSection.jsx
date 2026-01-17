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
import TextItem from './TextItem'
import './TextSection.css'

function SortableTextItem({ id, index, item, onRename, overId, dropSide }) {
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
    const target = e.target
    if (target.closest('.text-name') || 
        target.closest('.text-name-input') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea')) {
      e.stopPropagation()
      e.preventDefault()
      return false
    }
    return true
  }

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
      <TextItem
        item={item}
        onRename={onRename}
      />
    </div>
  )
}

function DeleteZone({ isActive, activeId, items, onDelete }) {
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

function TextSection({ items, title, onRename, onReorder, onDelete }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [overId, setOverId] = useState(null)
  const [dropSide, setDropSide] = useState(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const mouseMoveHandlerRef = useRef(null)

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                 ('ontouchstart' in window) || 
                 (navigator.maxTouchPoints > 0)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: isMobile ? 250 : 0,
        tolerance: isMobile ? 8 : 5,
        distance: isMobile ? 0 : 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
    
    if (event.activatorEvent) {
      setMousePosition({ 
        x: event.activatorEvent.clientX, 
        y: event.activatorEvent.clientY 
      })
    }
    
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

  const handleDragCancel = () => {
    if (mouseMoveHandlerRef.current) {
      document.removeEventListener('mousemove', mouseMoveHandlerRef.current)
      document.removeEventListener('touchmove', mouseMoveHandlerRef.current)
      mouseMoveHandlerRef.current = null
    }

    setActiveId(null)
    setOverId(null)
    setDropSide(null)
    setMousePosition({ x: 0, y: 0 })
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
      
      const overElement = document.querySelector(`[data-id="${over.id}"]`)
      if (overElement) {
        const rect = overElement.getBoundingClientRect()
        const itemCenterX = rect.left + rect.width / 2
        
        let pointerX = mousePosition.x
        
        if ((!pointerX || pointerX === 0) && event.activatorEvent) {
          if (event.activatorEvent.touches && event.activatorEvent.touches.length > 0) {
            pointerX = event.activatorEvent.touches[0].clientX
          } else if (event.activatorEvent.clientX) {
            pointerX = event.activatorEvent.clientX
          }
        }
        
        if (!pointerX || pointerX === 0) {
          pointerX = itemCenterX
        }
        
        const threshold = rect.width * 0.25
        let side
        
        if (pointerX < itemCenterX - threshold) {
          side = 'left'
        } else if (pointerX > itemCenterX + threshold) {
          side = 'right'
        } else {
          const oldIndex = items.findIndex(item => item.id === active.id)
          const newIndex = items.findIndex(item => item.id === over.id)
          side = oldIndex < newIndex ? 'right' : 'left'
        }
        
        setDropSide(side)
      } else {
        setDropSide('right')
      }
    } else {
      setOverId(null)
      setDropSide(null)
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event

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

    if (over.id === 'delete-zone') {
      const item = items.find(item => item.id === active.id)
      if (item && onDelete) {
        await onDelete('text', item.id)
      }
      return
    }

    if (active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over.id)
      
      if (oldIndex === -1 || newIndex === -1) {
        return
      }
      
      let targetIndex
      
      if (dropSide === 'left') {
        targetIndex = newIndex
      } else if (dropSide === 'right') {
        targetIndex = newIndex + 1
      } else {
        targetIndex = oldIndex < newIndex ? newIndex + 1 : newIndex
      }

      targetIndex = Math.max(0, Math.min(targetIndex, items.length))
      
      if (onReorder && targetIndex !== oldIndex) {
        await onReorder('text', oldIndex, targetIndex)
      }
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-section empty">
        <div className="section-header">
          <div className="section-label">
            <span className="section-label-icon">📝</span>
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
    <div className="text-section">
      <div className="section-header">
        <div className="section-label">
          <span className="section-label-icon">📝</span>
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
          onDragCancel={handleDragCancel}
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
          />
          <SortableContext
            items={items.map(item => item.id)}
            strategy={rectSortingStrategy}
          >
            <div className="text-grid">
              {items.map((item, index) => (
                <SortableTextItem
                  key={item.id}
                  id={item.id}
                  index={index}
                  item={item}
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
                <TextItem
                  item={activeItem}
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

export default TextSection
