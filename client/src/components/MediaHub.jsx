import MediaSection from './MediaSection'
import TextSection from './TextSection'
import './MediaHub.css'

function MediaHub({ media, textItems, onMediaClick, onRename, onReorder, onDelete, searchQuery, activeFilters = [] }) {
  // Collection type filters
  const COLLECTION_TYPES = ['text', 'gifs', 'images', 'soundbites']
  
  // Only collection filters are allowed now
  const collectionFilters = activeFilters.filter(f => COLLECTION_TYPES.includes(f))
  
  // Check if a collection should be shown
  const shouldShowCollection = (type) => {
    // If no filters active, show all collections
    if (collectionFilters.length === 0) return true
    // If filters active, only show filtered collections
    return collectionFilters.includes(type)
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

  return (
    <div className="media-hub">
      {shouldShowCollection('text') && (
        <TextSection 
          items={filterTextItems(textItems)}
          title="TEXT"
          onRename={onRename}
          onReorder={onReorder}
          onDelete={onDelete}
        />
      )}
      {shouldShowCollection('gifs') && (
        <MediaSection 
          type="gifs" 
          items={filterItems(media.gifs)}
          title="GIFS"
          onMediaClick={onMediaClick}
          onRename={onRename}
          onReorder={onReorder}
          onDelete={onDelete}
        />
      )}
      {shouldShowCollection('images') && (
        <MediaSection 
          type="images" 
          items={filterItems(media.images)}
          title="IMAGES"
          onMediaClick={onMediaClick}
          onRename={onRename}
          onReorder={onReorder}
          onDelete={onDelete}
        />
      )}
      {shouldShowCollection('soundbites') && (
        <MediaSection 
          type="soundbites" 
          items={filterItems(media.soundbites)}
          title="SOUNDBITES"
          onMediaClick={onMediaClick}
          onRename={onRename}
          onReorder={onReorder}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}

export default MediaHub
