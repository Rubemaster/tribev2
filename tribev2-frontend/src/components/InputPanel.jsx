import { useState, useCallback } from 'react'
import { MODALITIES } from '../lib/constants'

export default function InputPanel({ modality, setModality, file, setFile, textInput, setTextInput, disabled }) {
  const activeModality = MODALITIES.find(m => m.id === modality)

  return (
    <section className="input-panel">
      {/* Modality selector */}
      <div className="modality-bar">
        {MODALITIES.map(m => (
          <button
            key={m.id}
            className={`modality-tab ${modality === m.id ? 'active' : ''}`}
            onClick={() => { setModality(m.id); setFile(null); setTextInput('') }}
            disabled={disabled}
          >
            <span className="tab-label">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="input-area">
        {modality === 'text' ? (
          <textarea
            className="text-input"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Paste text here — TRIBE v2 will predict how the brain responds to this content..."
            rows={5}
            disabled={disabled}
          />
        ) : (
          <DropZone
            accept={activeModality?.accept}
            file={file}
            setFile={setFile}
            disabled={disabled}
          />
        )}
      </div>
    </section>
  )
}

function DropZone({ accept, file, setFile, disabled }) {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback(e => {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }, [setFile, disabled])

  return (
    <div
      className={`dropzone ${dragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {file ? (
        <div className="file-preview">
          <span className="file-icon">■</span>
          <div className="file-info">
            <span className="file-name">{file.name}</span>
            <span className="file-size">{(file.size / 1e6).toFixed(1)} MB</span>
          </div>
          <button className="btn-remove" onClick={() => setFile(null)}>×</button>
        </div>
      ) : (
        <label className="upload-label">
          <span className="upload-icon">↑</span>
          <span>Drop {accept?.replace(/,/g, ' or ')} here</span>
          <span className="upload-hint">or click to browse</span>
          <input type="file" accept={accept} onChange={e => e.target.files[0] && setFile(e.target.files[0])} hidden />
        </label>
      )}
    </div>
  )
}
