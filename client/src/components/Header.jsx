import './Header.css'

function Header({ onUploadClick, onFilterClick, searchQuery, onSearchChange, activeFiltersCount }) {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">ANSHIH</h1>
        <div className="header-subtitle">Evergreen Media Hub</div>
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <button className="upload-btn" onClick={onUploadClick}>
            UPLOAD
          </button>
        </div>
      </div>
      <button 
        className={`filter-icon-btn ${activeFiltersCount > 0 ? 'active' : ''}`}
        onClick={onFilterClick}
        title="Filter items"
        aria-label="Filter items"
      >
        <span className="filter-icon"></span>
        {activeFiltersCount > 0 && (
          <span className="filter-badge">{activeFiltersCount}</span>
        )}
      </button>
      <div className="scanline"></div>
    </header>
  )
}

export default Header
