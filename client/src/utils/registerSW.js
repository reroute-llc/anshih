export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Use base path for GitHub Pages
      const swPath = import.meta.env.GITHUB_PAGES === 'true' 
        ? '/anshih/sw.js' 
        : '/sw.js'
      
      navigator.serviceWorker
        .register(swPath)
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
