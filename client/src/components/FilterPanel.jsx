import { useState } from 'react'
import './FilterPanel.css'

const COLLECTION_FILTERS = [
  { id: 'text', label: 'Text' },
  { id: 'gifs', label: 'GIFs' },
  { id: 'images', label: 'Images' },
  { id: 'soundbites', label: 'Soundbites' },
]

const PRESET_FILTERS = [
  { id: 'collections', label: 'Collections' },
  { id: 'dexter', label: 'Dexter' },
  { id: 'tsundere', label: 'Tsundere' },
  { id: 'ai-baby', label: 'AI Baby' },
  { id: 'anshul', label: 'Anshul' },
]

function FilterPanel({ isOpen, onClose, activeFilters, onFiltersChange }) {
  const [customFilter, setCustomFilter] = useState('')

  const handlePresetToggle = (filterId) => {
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(f => f !== filterId)
      : [...activeFilters, filterId]
    onFiltersChange(newFilters)
  }

  const handleAddCustomFilter = () => {
    if (customFilter.trim() && !activeFilters.includes(customFilter.trim().toLowerCase())) {
      onFiltersChange([...activeFilters, customFilter.trim().toLowerCase()])
      setCustomFilter('')
    }
  }

  const handleRemoveFilter = (filterToRemove) => {
    onFiltersChange(activeFilters.filter(f => f !== filterToRemove))
  }

  const handleClearAll = () => {
    onFiltersChange([])
    setCustomFilter('')
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
                  onClick={() => handlePresetToggle(collection.id)}
                >
                  {collection.label}
                  {activeFilters.includes(collection.id) && (
                    <span className="filter-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-section-title">PRESET FILTERS</h3>
            <div className="preset-filters">
              {PRESET_FILTERS.map(preset => (
                <button
                  key={preset.id}
                  className={`preset-filter-btn ${activeFilters.includes(preset.id) ? 'active' : ''}`}
                  onClick={() => handlePresetToggle(preset.id)}
                >
                  {preset.label}
                  {activeFilters.includes(preset.id) && (
                    <span className="filter-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-section-title">CUSTOM FILTER</h3>
            <div className="custom-filter-input">
              <input
                type="text"
                className="custom-filter-text"
                placeholder="Enter filter term..."
                value={customFilter}
                onChange={(e) => setCustomFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomFilter()
                  }
                }}
              />
              <button
                className="add-filter-btn"
                onClick={handleAddCustomFilter}
                disabled={!customFilter.trim()}
              >
                ADD
              </button>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="filter-section">
              <h3 className="filter-section-title">ACTIVE FILTERS</h3>
              <div className="active-filters">
                {activeFilters.map(filter => {
                  const collection = COLLECTION_FILTERS.find(c => c.id === filter)
                  const preset = PRESET_FILTERS.find(p => p.id === filter)
                  const label = collection ? collection.label : (preset ? preset.label : filter)
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
