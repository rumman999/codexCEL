import { useState, useCallback } from 'react'
import './App.css'

function App() {
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [status, setStatus] = useState(null)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragActive(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragActive(false)

    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      setUploadedFile(file)
      handleUpload(file)
    } else {
      setStatus({ type: 'error', message: 'Please upload a valid Excel or CSV file.' })
    }
  }, [])

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0]
    if (file) {
      setUploadedFile(file)
      handleUpload(file)
    }
  }, [])

  const handleUpload = async (file) => {
    setStatus({ type: 'loading', message: `Uploading "${file.name}"...` })

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Upload successful:', data)
      setStatus({ type: 'success', message: `"${file.name}" uploaded successfully! (${data.rowCount} rows, ${data.columnCount} columns)` })
    } catch (error) {
      console.error('Upload error:', error)
      setStatus({ type: 'error', message: `Upload failed: ${error.message}` })
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container header__inner">
          <div className="header__brand">
            <div className="header__logo">S</div>
            <h1 className="header__title">
              Sheet<span>Genie</span>
            </h1>
          </div>
          <div className="header__status">
            <div className="header__status-dot"></div>
            System Online
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          {/* Hero */}
          <section className="hero" id="hero-section">
            <div className="hero__badge">
              ✦ AI-Powered Excel Analysis
            </div>
            <h2 className="hero__title">
              Analyze spreadsheets with <span>AI intelligence</span>
            </h2>
            <p className="hero__subtitle">
              Upload your Excel files and let SheetGenie extract insights,
              generate charts, and answer questions about your data.
            </p>
          </section>

          {/* Upload Card */}
          <div
            id="upload-dropzone"
            className={`upload-card ${isDragActive ? 'upload-card--active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              type="file"
              id="file-input"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <div className="upload-card__icon">📊</div>
            <p className="upload-card__title">
              Drag & drop your file here, or <span>browse</span>
            </p>
            <p className="upload-card__subtitle">
              Supports .xlsx, .xls, and .csv files
            </p>
          </div>

          {/* Status Message */}
          {status && (
            <div
              id="upload-status"
              className="mt-6 text-center text-sm"
              style={{
                marginTop: '1.5rem',
                textAlign: 'center',
                color:
                  status.type === 'error'
                    ? 'var(--color-error)'
                    : status.type === 'success'
                    ? 'var(--color-success)'
                    : 'var(--color-text-secondary)',
              }}
            >
              {status.type === 'loading' && '⏳ '}
              {status.type === 'success' && '✅ '}
              {status.type === 'error' && '❌ '}
              {status.message}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>
            Built with <span>SheetGenie</span> — AI-powered spreadsheet analysis
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
