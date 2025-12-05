import browser from 'webextension-polyfill'

// Initialize extension storage
async function initializeStorage() {
  const defaults = {
    enabled: true,
    autoCapture: false,
    apiUrl: 'http://localhost:3001',
    userId: null as string | null
  }

  const result = await browser.storage.local.get(Object.keys(defaults))
  await browser.storage.local.set({ ...defaults, ...result })
}

// Handle extension installation
browser.runtime.onInstalled.addListener(async (details) => {
  console.log('KnowMan extension installed/updated:', details.reason)
  await initializeStorage()

  if (details.reason === 'install') {
    // Open onboarding page
    await browser.tabs.create({
      url: browser.runtime.getURL('onboarding.html')
    })
  }
})

// Handle messages from content scripts or popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message, 'from:', sender)

  switch (message.type) {
    case 'GET_STORAGE':
      browser.storage.local.get(message.keys).then(sendResponse)
      return true // Keep message channel open for async response

    case 'SET_STORAGE':
      browser.storage.local.set(message.data).then(() => sendResponse({ success: true }))
      return true

    case 'CAPTURE_PAGE':
      // Forward to backend API
      fetch(`${message.apiUrl}/api/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: message.url,
          content: message.content,
          title: message.title,
          userId: message.userId
        })
      })
        .then((response) => response.json())
        .then((data) => sendResponse({ success: true, data }))
        .catch((error) => sendResponse({ success: false, error: error.message }))
      return true

    default:
      console.warn('Unknown message type:', message.type)
      sendResponse({ success: false, error: 'Unknown message type' })
  }
})

// Handle browser action clicks (optional - we use popup)
browser.action.onClicked.addListener(async (tab) => {
  console.log('Browser action clicked on tab:', tab.id)
  // Could open popup programmatically or show notification
})

console.log('KnowMan background service worker loaded')