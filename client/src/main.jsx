import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'

import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>

    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#111827',
          color: '#ffffff',
          border: '1px solid #22c55e',
          padding: '14px',
          borderRadius: '10px'
        },

        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: '#000'
          }
        },

        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#000'
          }
        }
      }}
    />

    <App />

  </StrictMode>,
)