import browser from 'webextension-polyfill'

// Content extraction utilities
function extractPageContent(): {
  title: string
  url: string
  content: string
  html: string
  textContent: string
} {
  const title = document.title
  const url = window.location.href
  const html = document.documentElement.outerHTML
  const textContent = document.body?.textContent?.trim() || ''

  // Simple content extraction - will be enhanced with Readability.js later
  let content = textContent.substring(0, 10000) // Limit content size

  // Try to get meta description
  const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content')
  if (metaDescription) {
    content = metaDescription + '\n\n' + content
  }

  return {
    title,
    url,
    content,
    html,
    textContent
  }
}

// Listen for messages from background/popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message)

  switch (message.type) {
    case 'EXTRACT_PAGE_CONTENT': {
      const pageData = extractPageContent()
      sendResponse({ success: true, data: pageData })
      break
    }

    case 'CAPTURE_PAGE': {
      const pageData = extractPageContent()

      // Send to background for processing
      browser.runtime.sendMessage({
        type: 'CAPTURE_PAGE',
        ...pageData,
        apiUrl: message.apiUrl,
        userId: message.userId
      }).then(response => {
        sendResponse(response)
      }).catch(error => {
        sendResponse({ success: false, error: error.message })
      })

      return true // Keep message channel open for async response
    }

    case 'HIGHLIGHT_TEXT': {
      // Basic text highlighting (simplified)
      const selection = window.getSelection()
      if (selection && selection.toString().trim()) {
        const range = selection.getRangeAt(0)
        const span = document.createElement('span')
        span.style.backgroundColor = 'yellow'
        span.style.cursor = 'pointer'
        span.title = 'Click to remove highlight'
        span.addEventListener('click', () => span.remove())
        range.surroundContents(span)

        sendResponse({
          success: true,
          text: selection.toString(),
          highlighted: true
        })
      } else {
        sendResponse({ success: false, error: 'No text selected' })
      }
      break
    }

    default:
      console.warn('Unknown message type in content script:', message.type)
      sendResponse({ success: false, error: 'Unknown message type' })
  }
})

// Add KnowMan button to page (optional UI)
function addToolbarButton() {
  if (document.getElementById('knowman-toolbar-button')) return

  const button = document.createElement('button')
  button.id = 'knowman-toolbar-button'
  button.innerHTML = '📚 KnowMan'
  button.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 10000;
    background: #4f46e5;
    color: white;
    border: none;
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `

  button.addEventListener('click', () => {
    browser.runtime.sendMessage({ type: 'OPEN_POPUP' })
  })

  document.body.appendChild(button)
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('KnowMan content script loaded')
    addToolbarButton()
  })
} else {
  console.log('KnowMan content script loaded')
  addToolbarButton()
}

console.log('KnowMan content script initialized')