import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GithubCallback } from './components/auth/GithubCallback'

const path = window.location.pathname;

if (path === '/auth/github/callback') {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <GithubCallback />
    </StrictMode>,
  )
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
