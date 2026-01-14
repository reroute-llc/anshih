import MediaSection from './MediaSection'
import './MediaHub.css'

function MediaHub({ media, onMediaClick, onRename, onReorder, onDelete, searchQuery }) {
  const filterItems = (items) => {
    if (!searchQuery || searchQuery.trim() === '') {
      return items
    }
    const query = searchQuery.toLowerCase().trim()
    return items.filter(item => 
      item.name.toLowerCase().includes(query)
    )
  }

  return (
    <div className="media-hub">
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
