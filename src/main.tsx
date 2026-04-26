// Polyfill crypto.randomUUID for non-secure contexts (e.g. HTTP on local IP)
if (!crypto.randomUUID) {
  crypto.randomUUID = () =>
    ('10000000-1000-4000-8000-100000000000').replace(/[018]/g, (c) =>
      (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    ) as `${string}-${string}-${string}-${string}-${string}`;
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GithubCallback } from './components/auth/GithubCallback'
import { GoogleCallback } from './components/auth/GoogleCallback'

const path = window.location.pathname;

if (path === '/auth/github/callback') {
  createRoot(document.getElementById('root')!).render(
    <StrictMode><GithubCallback /></StrictMode>,
  )
} else if (path === '/auth/google/callback') {
  createRoot(document.getElementById('root')!).render(
    <StrictMode><GoogleCallback /></StrictMode>,
  )
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode><App /></StrictMode>,
  )
}
