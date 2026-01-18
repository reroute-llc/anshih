import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import MediaSection from './MediaSection'
import TextSection from './TextSection'
import './MediaHub.css'

function SortableCollection({ id, type, children, onCollapseAll }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Create custom drag handle that prevents drag on interactive elements
  const handlePointerDown = (e) => {
    // Don't start drag if clicking on interactive elements
    const target = e.target
    if (target.closest('.section-toggle-btn') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('.media-name') ||
        target.closest('.text-name') ||
        target.closest('.text-content')) {
      e.stopPropagation()
      return false
    }
    return true
  }

  // Merge listeners with custom handler
  const dragListeners = listeners ? {
    ...listeners,
    onPointerDown: (e) => {
      if (handlePointerDown(e) && listeners.onPointerDown) {
        listeners.onPointerDown(e)
      }
    },
  } : {}

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-collection ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...dragListeners}
    >
      {children}
    </div>
  )
}

function MediaHub({ media, textItems, onMediaClick, onRename, onReorder, onDelete, searchQuery, activeFilters = [], collectionOrder, onCollectionReorder }) {
  // Collection type filters
  const COLLECTION_TYPES = ['text', 'gifs', 'images', 'soundbites']
  
  // Only collection filters are allowed now
  const collectionFilters = activeFilters.filter(f => COLLECTION_TYPES.includes(f))
  
  // Detect mobile device
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
  
  const [activeId, setActiveId] = useState(null)
  const [collapsedCollections, setCollapsedCollections] = useState(new Set())
  
  // Check if a collection should be shown
  const shouldShowCollection = (type) => {
    // If no filters active, show all collections
    if (collectionFilters.length === 0) return true
    // If filters active, only show filtered collections
    return collectionFilters.includes(type)
  }
  
  // Get ordered collections based on collectionOrder
  const getOrderedCollections = () => {
    return collectionOrder.filter(type => shouldShowCollection(type))
  }
  
  const handleDragStart = (event) => {
    setActiveId(event.active.id)
    // Collapse all collections when dragging starts
    const allTypes = ['text', 'gifs', 'images', 'soundbites']
    setCollapsedCollections(new Set(allTypes))
  }
  
  const handleCollectionToggle = (type) => {
    setCollapsedCollections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }
  
  const handleDragEnd = (event) => {
    const { active, over } = event
    
    setActiveId(null)
    
    if (!over || active.id === over.id) {
      return
    }
    
    const oldIndex = collectionOrder.indexOf(active.id)
    const newIndex = collectionOrder.indexOf(over.id)
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(collectionOrder, oldIndex, newIndex)
      onCollectionReorder(newOrder)
    }
  }
  
  const handleDragCancel = () => {
    setActiveId(null)
  }
  
  // Render collection component based on type
  const renderCollection = (type) => {
    const isCollapsed = collapsedCollections.has(type)
    switch (type) {
      case 'text':
        return (
          <TextSection 
            key="text"
            items={filterTextItems(textItems)}
            title="TEXT"
            onRename={onRename}
            onReorder={onReorder}
            onDelete={onDelete}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => handleCollectionToggle(type)}
          />
        )
      case 'gifs':
        return (
          <MediaSection 
            key="gifs"
            type="gifs" 
            items={filterItems(media.gifs)}
            title="GIFS"
            onMediaClick={onMediaClick}
            onRename={onRename}
            onReorder={onReorder}
            onDelete={onDelete}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => handleCollectionToggle(type)}
          />
        )
      case 'images':
        return (
          <MediaSection 
            key="images"
            type="images" 
            items={filterItems(media.images)}
            title="IMAGES"
            onMediaClick={onMediaClick}
            onRename={onRename}
            onReorder={onReorder}
            onDelete={onDelete}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => handleCollectionToggle(type)}
          />
        )
      case 'soundbites':
        return (
          <MediaSection 
            key="soundbites"
            type="soundbites" 
            items={filterItems(media.soundbites)}
            title="SOUNDBITES"
            onMediaClick={onMediaClick}
            onRename={onRename}
            onReorder={onReorder}
            onDelete={onDelete}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => handleCollectionToggle(type)}
          />
        )
      default:
        return null
    }
  }

  const filterItems = (items) => {
    let filtered = items

    // Apply search query filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  const filterTextItems = (items) => {
    let filtered = items

    // Apply search query filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  const orderedCollections = getOrderedCollections()
  const activeCollection = activeId ? orderedCollections.find(c => c === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="media-hub">
        <SortableContext
          items={orderedCollections}
          strategy={verticalListSortingStrategy}
        >
          {orderedCollections.map(type => (
            <SortableCollection 
              key={type} 
              id={type} 
              type={type}
              onCollapseAll={() => {
                const allTypes = ['text', 'gifs', 'images', 'soundbites']
                setCollapsedCollections(new Set(allTypes))
              }}
            >
              {renderCollection(type)}
            </SortableCollection>
          ))}
        </SortableContext>
      </div>
      <DragOverlay>
        {activeCollection ? (
          <div className="sortable-collection dragging" style={{ opacity: 0.8 }}>
            {renderCollection(activeCollection)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default MediaHub
