import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import { AuthProvider } from './ui/auth/AuthContext'
import { AuthGate } from './ui/auth/AuthGate'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <AuthGate>
      <App />
    </AuthGate>
  </AuthProvider>
)
