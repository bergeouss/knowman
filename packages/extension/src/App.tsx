import { useState, useEffect } from 'react'
import browser from 'webextension-polyfill'
import './App.css'

interface PageData {
  title: string
  url: string
  content: string
  timestamp: number
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageData | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [status, setStatus] = useState<string>('Ready')

  // Load current page data
  useEffect(() => {
    const loadCurrentPage = async () => {
      try {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
        if (tab.id) {
          const response = await browser.tabs.sendMessage(tab.id, {
            type: 'EXTRACT_PAGE_CONTENT'
          })

          if (response.success) {
            setCurrentPage({
              title: response.data.title,
              url: response.data.url,
              content: response.data.content.substring(0, 500) + '...',
              timestamp: Date.now()
            })
          }
        }
      } catch (error) {
        console.error('Error loading page:', error)
        setStatus('Error: ' + (error as Error).message)
      }
    }

    loadCurrentPage()
  }, [])

  // Load extension settings
  useEffect(() => {
    browser.storage.local.get(['enabled']).then((result) => {
      setIsEnabled(result.enabled !== false)
    })
  }, [])

  const handleCapturePage = async () => {
    if (!currentPage) return

    setIsCapturing(true)
    setStatus('Capturing page...')

    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
      if (tab.id) {
        const response = await browser.tabs.sendMessage(tab.id, {
          type: 'CAPTURE_PAGE',
          apiUrl: 'http://localhost:3001',
          userId: 'local-user'
        })

        if (response.success) {
          setStatus('Page captured successfully!')
          // Show success for 2 seconds
          setTimeout(() => setStatus('Ready'), 2000)
        } else {
          setStatus('Error: ' + response.error)
        }
      }
    } catch (error) {
      console.error('Capture error:', error)
      setStatus('Error: ' + (error as Error).message)
    } finally {
      setIsCapturing(false)
    }
  }

  const handleToggleEnabled = async () => {
    const newEnabled = !isEnabled
    setIsEnabled(newEnabled)
    await browser.storage.local.set({ enabled: newEnabled })
    setStatus(newEnabled ? 'Extension enabled' : 'Extension disabled')
  }

  const handleOpenDashboard = () => {
    browser.tabs.create({ url: 'http://localhost:3000' })
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">📚 KnowMan</h1>
        <div className="status-indicator">
          <div className={`status-dot ${isEnabled ? 'enabled' : 'disabled'}`} />
          <span className="status-text">{isEnabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </header>

      <div className="content">
        {currentPage ? (
          <div className="page-preview">
            <h3 className="page-title">{currentPage.title}</h3>
            <p className="page-url">{currentPage.url}</p>
            <div className="page-snippet">
              {currentPage.content}
            </div>
          </div>
        ) : (
          <div className="loading">Loading page info...</div>
        )}

        <div className="actions">
          <button
            className="btn btn-primary"
            onClick={handleCapturePage}
            disabled={isCapturing || !isEnabled}
          >
            {isCapturing ? 'Capturing...' : '💾 Capture Page'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleToggleEnabled}
          >
            {isEnabled ? '⏸️ Disable' : '▶️ Enable'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleOpenDashboard}
          >
            📊 Open Dashboard
          </button>
        </div>

        <div className="status-bar">
          {status}
        </div>
      </div>

      <footer className="footer">
        <small>AI-powered knowledge management</small>
      </footer>
    </div>
  )
}

export default App
