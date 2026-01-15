export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Detect base path from current location
      // If we're on GitHub Pages, the path will be /anshih/...
      const basePath = window.location.pathname.startsWith('/anshih/') 
        ? '/anshih' 
        : ''
      const swPath = `${basePath}/sw.js`
      const scope = `${basePath}/`
      
      navigator.serviceWorker
        .register(swPath, { scope })
        .then((registration) => {
          console.log('SW registered: ', registration)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                if (confirm('New version available! Reload to update?')) {
                  window.location.reload()
                }
              }
            })
          })
        })
        .catch((registrationError) => {
          // Silently fail - service worker is optional
          console.log('SW registration failed (optional): ', registrationError)
        })
    })
  }
}
