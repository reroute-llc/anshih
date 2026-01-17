import MediaSection from './MediaSection'
import TextSection from './TextSection'
import './MediaHub.css'

function MediaHub({ media, textItems, onMediaClick, onRename, onReorder, onDelete, searchQuery, activeFilters = [] }) {
  // Collection type filters
  const COLLECTION_TYPES = ['text', 'gifs', 'images', 'soundbites']
  
  // Separate collection filters from content filters
  const collectionFilters = activeFilters.filter(f => COLLECTION_TYPES.includes(f))
  const contentFilters = activeFilters.filter(f => !COLLECTION_TYPES.includes(f))
  
  // Check if item matches any content filter (name/content matching)
  const matchesContentFilter = (item) => {
    if (contentFilters.length === 0) return true
    
    const itemName = item.name.toLowerCase()
    const itemContent = item.content ? item.content.toLowerCase() : ''
    
    return contentFilters.some(filter => {
      const filterLower = filter.toLowerCase()
      return itemName.includes(filterLower) || itemContent.includes(filterLower)
    })
  }

  const filterItems = (items, type) => {
    let filtered = items

    // Apply collection type filter first
    if (collectionFilters.length > 0) {
      const typeMap = {
        'gifs': 'gifs',
        'images': 'images',
        'soundbites': 'soundbites'
      }
      if (!collectionFilters.includes(typeMap[type])) {
        return [] // Hide this collection if not in active collection filters
      }
    }

    // Apply search query filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query)
      )
    }

    // Apply content filters
    if (contentFilters.length > 0) {
      filtered = filtered.filter(matchesContentFilter)
    }

    return filtered
  }

  const filterTextItems = (items) => {
    let filtered = items

    // Apply collection type filter first
    if (collectionFilters.length > 0) {
      if (!collectionFilters.includes('text')) {
        return [] // Hide text collection if not in active collection filters
      }
    }

    // Apply search query filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query)
      )
    }

    // Apply content filters
    if (contentFilters.length > 0) {
      filtered = filtered.filter(matchesContentFilter)
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
        items={filterItems(media.gifs, 'gifs')}
        title="GIFS"
        onMediaClick={onMediaClick}
        onRename={onRename}
        onReorder={onReorder}
        onDelete={onDelete}
      />
      <MediaSection 
        type="images" 
        items={filterItems(media.images, 'images')}
        title="IMAGES"
        onMediaClick={onMediaClick}
        onRename={onRename}
        onReorder={onReorder}
        onDelete={onDelete}
      />
      <MediaSection 
        type="soundbites" 
        items={filterItems(media.soundbites, 'soundbites')}
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
