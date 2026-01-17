import MediaSection from './MediaSection'
import TextSection from './TextSection'
import './MediaHub.css'

function MediaHub({ media, textItems, onMediaClick, onRename, onReorder, onDelete, searchQuery }) {
  const filterItems = (items) => {
    if (!searchQuery || searchQuery.trim() === '') {
      return items
    }
    const query = searchQuery.toLowerCase().trim()
    return items.filter(item => 
      item.name.toLowerCase().includes(query)
    )
  }

  const filterTextItems = (items) => {
    if (!searchQuery || searchQuery.trim() === '') {
      return items
    }
    const query = searchQuery.toLowerCase().trim()
    return items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.content.toLowerCase().includes(query)
    )
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
