import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

console.log('🚀 App starting...')

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ Root element not found')
  document.body.innerHTML = '<div style="padding: 20px;"><h1>Error: Root element not found</h1></div>'
} else {
  console.log('✅ Root element found')
  try {
    console.log('📦 Rendering React app...')
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <HashRouter>
          <App />
        </HashRouter>
      </React.StrictMode>
    )
    console.log('✅ App rendered successfully')
  } catch (error) {
    console.error('❌ Failed to render app:', error)
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1>Error Loading Application</h1>
        <p>There was an error loading the application. Please check the console for details.</p>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    `
  }
}
