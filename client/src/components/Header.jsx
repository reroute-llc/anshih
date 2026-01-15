import './Header.css'

function Header({ onUploadClick, searchQuery, onSearchChange }) {
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
      <div className="scanline"></div>
    </header>
  )
}

export default Header
