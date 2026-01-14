import { useState, useEffect } from 'react'
import './UploadPanel.css'

function UploadPanel({ onClose, onUploadSuccess, droppedFile }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadMethod, setUploadMethod] = useState('file') // 'file' or 'url'
  const [urlInput, setUrlInput] = useState('')
  const [customName, setCustomName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Handle dropped file
  useEffect(() => {
    if (droppedFile) {
      setSelectedFile(droppedFile)
      setUploadMethod('file')
      // Auto-set custom name to filename without extension if empty
      if (droppedFile.name) {
        const nameWithoutExt = droppedFile.name.substring(0, droppedFile.name.lastIndexOf('.')) || droppedFile.name
        setCustomName(prev => prev || nameWithoutExt)
      }
    }
  }, [droppedFile])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      // Auto-set custom name to filename without extension if empty
      if (!customName && file.name) {
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
        setCustomName(nameWithoutExt)
      }
    }
  }

  const handleUpload = async () => {
    if (uploadMethod === 'file' && !selectedFile) return
    if (uploadMethod === 'url' && !urlInput.trim()) return

    setUploading(true)
    setUploadProgress(0)

    try {
      if (uploadMethod === 'file') {
        const formData = new FormData()
        formData.append('file', selectedFile)
        if (customName.trim()) {
          formData.append('name', customName.trim())
        }

        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setUploadProgress(percentComplete)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            setUploading(false)
            setUploadProgress(100)
            setTimeout(() => {
              onUploadSuccess()
              setSelectedFile(null)
              setCustomName('')
              setUploadProgress(0)
            }, 500)
          } else {
            const response = JSON.parse(xhr.responseText || '{}')
            alert(response.error || 'Upload failed!')
            setUploading(false)
          }
        })

        xhr.addEventListener('error', () => {
          alert('Upload error!')
          setUploading(false)
        })

        xhr.open('POST', '/api/upload')
        xhr.send(formData)
      } else {
        // URL upload
        const response = await fetch('/api/upload-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: urlInput.trim(),
            name: customName.trim() || undefined
          })
        })

        const data = await response.json()

        if (response.ok) {
          setUploadProgress(100)
          setTimeout(() => {
            onUploadSuccess()
            setUrlInput('')
            setCustomName('')
            setUploadProgress(0)
            setUploading(false)
          }, 500)
        } else {
          alert(data.error || 'Upload failed!')
          setUploading(false)
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed!')
      setUploading(false)
    }
  }

  return (
    <div className="upload-overlay" onClick={onClose}>
      <div className="upload-panel" onClick={(e) => e.stopPropagation()}>
        <div className="upload-header">
          <h2 className="upload-title">UPLOAD MEDIA</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="upload-content">
          <div className="upload-method-selector">
            <label className="type-label">UPLOAD METHOD:</label>
            <div className="method-buttons">
              <button
                className={`method-btn ${uploadMethod === 'file' ? 'active' : ''}`}
                onClick={() => {
                  setUploadMethod('file')
                  setUrlInput('')
                }}
                disabled={uploading}
              >
                📁 FILE
              </button>
              <button
                className={`method-btn ${uploadMethod === 'url' ? 'active' : ''}`}
                onClick={() => {
                  setUploadMethod('url')
                  setSelectedFile(null)
                }}
                disabled={uploading}
              >
                🔗 URL
              </button>
            </div>
          </div>

          {uploadMethod === 'file' ? (
            <div className="file-selector">
              <label className="file-label">
                <input
                  type="file"
                  accept="audio/*,image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                <div className="file-input-display">
                  {selectedFile ? (
                    <div className="file-selected">
                      <div className="file-icon">📎</div>
                      <div className="file-name">{selectedFile.name}</div>
                      <div className="file-size">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ) : (
                    <div className="file-placeholder">
                      <div className="file-icon">📁</div>
                      <div>CLICK TO SELECT FILE</div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          ) : (
            <div className="url-selector">
              <label className="type-label">ENTER URL:</label>
              <input
                type="url"
                className="url-input"
                placeholder="https://example.com/file.gif"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={uploading}
              />
            </div>
          )}

          <div className="name-selector">
            <label className="type-label">CUSTOM NAME (OPTIONAL):</label>
            <input
              type="text"
              className="name-input"
              placeholder="Leave empty to use original name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              disabled={uploading}
            />
          </div>

          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="progress-text">{Math.round(uploadProgress)}%</div>
            </div>
          )}

          <button
            className="upload-submit-btn"
            onClick={handleUpload}
            disabled={(uploadMethod === 'file' && !selectedFile) || (uploadMethod === 'url' && !urlInput.trim()) || uploading}
          >
            {uploading ? 'UPLOADING...' : 'UPLOAD'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UploadPanel
