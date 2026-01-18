import './WelcomeModal.css'

function WelcomeModal({ onClose }) {
  return (
    <div className="welcome-overlay" onClick={onClose}>
      <div className="welcome-modal" onClick={(e) => e.stopPropagation()}>
        <div className="welcome-header">
          <h2 className="welcome-title">WHAT'S NEW ON V1.1?</h2>
          <button className="welcome-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="welcome-content">
          <ul className="welcome-list">
            <li>There's a new collection for text.</li>
            <li>You can now reorder and filter collections.</li>
            <li>Long press on media to copy or save on mobile.</li>
          </ul>
        </div>
        <div className="welcome-footer">
          <button className="welcome-ok-btn" onClick={onClose}>
            GOT IT
          </button>
        </div>
      </div>
    </div>
  )
}

export default WelcomeModal
