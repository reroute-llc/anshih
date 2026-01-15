import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import '@hackernoon/pixel-icon-library/fonts/iconfont.css'
import { registerServiceWorker } from './utils/registerSW.js'

registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
