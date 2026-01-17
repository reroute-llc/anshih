import MediaSection from './MediaSection'
import TextSection from './TextSection'
import './MediaHub.css'

function MediaHub({ media, textItems, onMediaClick, onRename, onReorder, onDelete, searchQuery, activeFilters = [] }) {
  // Check if item matches any active filter
  const matchesFilter = (item) => {
    if (activeFilters.length === 0) return true
    
    const itemName = item.name.toLowerCase()
    const itemContent = item.content ? item.content.toLowerCase() : ''
    
    return activeFilters.some(filter => {
      const filterLower = filter.toLowerCase()
      return itemName.includes(filterLower) || itemContent.includes(filterLower)
    })
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

    // Apply active filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(matchesFilter)
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

    // Apply active filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(matchesFilter)
    }

    return filtered
  }

  return (
    <div className="media-hub">
      <TextSection 
        items={filterTextItems(textItems)}
        title="TEXT"
        onRename={onRename}
        onReorder={onReorder}
        onDelete={onDelete}
      />
      <MediaSection 
        type="gifs" 
        items={filterItems(media.gifs)}
        title="GIFS"
        onMediaClick={onMediaClick}
        onRename={onRename}
        onReorder={onReorder}
        onDelete={onDelete}
      />
      <MediaSection 
        type="images" 
        items={filterItems(media.images)}
        title="IMAGES"
        onMediaClick={onMediaClick}
        onRename={onRename}
        onReorder={onReorder}
        onDelete={onDelete}
      />
      <MediaSection 
        type="soundbites" 
        items={filterItems(media.soundbites)}
        title="SOUNDBITES"
        onMediaClick={onMediaClick}
        onRename={onRename}
        onReorder={onReorder}
        onDelete={onDelete}
      />
    </div>
  )
}

export default MediaHub
