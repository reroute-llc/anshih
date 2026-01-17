import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import './UploadPanel.css'

function UploadPanel({ onClose, onUploadSuccess, droppedFile }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadMethod, setUploadMethod] = useState('file') // 'file', 'url', or 'text'
  const [urlInput, setUrlInput] = useState('')
  const [customName, setCustomName] = useState('')
  const [textContent, setTextContent] = useState('')
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

  const detectMediaType = (mimetype) => {
    if (mimetype.startsWith('audio/')) {
      return 'soundbites'
    } else if (mimetype === 'image/gif') {
      return 'gifs'
    } else if (mimetype.startsWith('image/')) {
      return 'images'
    }
    return null
  }

  const handleUpload = async () => {
    if (uploadMethod === 'file' && !selectedFile) return
    if (uploadMethod === 'url' && !urlInput.trim()) return
    if (uploadMethod === 'text' && !textContent.trim()) return

    setUploading(true)
    setUploadProgress(0)

    try {
      if (uploadMethod === 'text') {
        // Create text item
        const itemName = customName.trim() || 'Untitled Text'
        const { error: dbError } = await supabase
          .from('text_items')
          .insert({
            name: itemName,
            content: textContent.trim()
          })

        if (dbError) throw dbError

        setUploadProgress(100)
        setTimeout(() => {
          onUploadSuccess()
          setTextContent('')
          setCustomName('')
          setUploadProgress(0)
          setUploading(false)
        }, 500)
      } else if (uploadMethod === 'file') {
        const file = selectedFile
        const type = detectMediaType(file.type)
        
        if (!type) {
          alert('Unsupported file type. Only audio, GIF, or image files are allowed')
          setUploading(false)
          return
        }

        // Generate unique file path
        const fileExt = file.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `${type}/${fileName}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath)

        // Insert into database
        const itemName = customName.trim() || file.name.substring(0, file.name.lastIndexOf('.')) || file.name
        const { error: dbError } = await supabase
          .from('media_items')
          .insert({
            name: itemName,
            type: type,
            storage_path: filePath,
            storage_bucket: 'media',
            size: file.size
          })

        if (dbError) throw dbError

        setUploadProgress(100)
        setTimeout(() => {
          onUploadSuccess()
          setSelectedFile(null)
          setCustomName('')
          setUploadProgress(0)
          setUploading(false)
        }, 500)
      } else {
        // URL upload - use Edge Function
        const { data, error } = await supabase.functions.invoke('upload-url', {
          body: {
            url: urlInput.trim(),
            name: customName.trim() || undefined
          }
        })

        if (error) throw error

        if (data.error) {
          alert(data.error)
          setUploading(false)
          return
        }

        setUploadProgress(100)
        setTimeout(() => {
          onUploadSuccess()
          setUrlInput('')
          setCustomName('')
          setUploadProgress(0)
          setUploading(false)
        }, 500)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(error.message || 'Upload failed!')
      setUploading(false)
    }
  }

  return (
    <div className="upload-overlay" onClick={onClose}>
      <div className="upload-panel" onClick={(e) => e.stopPropagation()}>
        <div className="upload-header">
          <h2 className="upload-title">{uploadMethod === 'text' ? 'CREATE TEXT' : 'UPLOAD MEDIA'}</h2>
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
                  setTextContent('')
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
                  setTextContent('')
                }}
                disabled={uploading}
              >
                🔗 URL
              </button>
              <button
                className={`method-btn ${uploadMethod === 'text' ? 'active' : ''}`}
                onClick={() => {
                  setUploadMethod('text')
                  setSelectedFile(null)
                  setUrlInput('')
                }}
                disabled={uploading}
              >
                📝 TEXT
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
          ) : uploadMethod === 'url' ? (
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
          ) : (
            <div className="text-selector">
              <label className="type-label">ENTER TEXT:</label>
              <textarea
                className="text-input"
                placeholder="Paste or type your text here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                disabled={uploading}
                rows={10}
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
            disabled={(uploadMethod === 'file' && !selectedFile) || (uploadMethod === 'url' && !urlInput.trim()) || (uploadMethod === 'text' && !textContent.trim()) || uploading}
          >
            {uploading ? 'UPLOADING...' : uploadMethod === 'text' ? 'CREATE' : 'UPLOAD'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UploadPanel
