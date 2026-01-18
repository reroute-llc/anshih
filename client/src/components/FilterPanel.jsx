import './FilterPanel.css'

const COLLECTION_FILTERS = [
  { id: 'text', label: 'Text' },
  { id: 'gifs', label: 'GIFs' },
  { id: 'images', label: 'Images' },
  { id: 'soundbites', label: 'Soundbites' },
]

function FilterPanel({ isOpen, onClose, activeFilters, onFiltersChange }) {
  const handleCollectionToggle = (filterId) => {
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(f => f !== filterId)
      : [...activeFilters, filterId]
    onFiltersChange(newFilters)
  }

  const handleRemoveFilter = (filterToRemove) => {
    onFiltersChange(activeFilters.filter(f => f !== filterToRemove))
  }

  const handleClearAll = () => {
    onFiltersChange([])
  }

  if (!isOpen) return null

  return (
    <div className="filter-overlay" onClick={onClose}>
      <div className="filter-panel" onClick={(e) => e.stopPropagation()}>
        <div className="filter-panel-header">
          <h2 className="filter-panel-title">FILTERS</h2>
          <button className="filter-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="filter-panel-content">
          <div className="filter-section">
            <h3 className="filter-section-title">COLLECTIONS</h3>
            <div className="preset-filters">
              {COLLECTION_FILTERS.map(collection => (
                <button
                  key={collection.id}
                  className={`preset-filter-btn ${activeFilters.includes(collection.id) ? 'active' : ''}`}
                  onClick={() => handleCollectionToggle(collection.id)}
                >
                  {collection.label}
                  {activeFilters.includes(collection.id) && (
                    <span className="filter-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="filter-section">
              <h3 className="filter-section-title">ACTIVE FILTERS</h3>
              <div className="active-filters">
                {activeFilters.map(filter => {
                  const collection = COLLECTION_FILTERS.find(c => c.id === filter)
                  const label = collection ? collection.label : filter
                  return (
                    <div key={filter} className="active-filter-tag">
                      <span className="active-filter-label">
                        {label}
                      </span>
                      <button
                        className="remove-filter-btn"
                        onClick={() => handleRemoveFilter(filter)}
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
                <button className="clear-all-btn" onClick={handleClearAll}>
                  CLEAR ALL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FilterPanel
