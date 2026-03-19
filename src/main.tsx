import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/tokens.css'
import './styles/global.css'
import { initQAApp } from './lib/qaapp'
import { ensureAuth } from './lib/ensureAuth'
import { saveFanCardStub } from './lib/saveFanCardStub'

initQAApp()

if ('serviceWorker' in navigator) {
  // ✅ In production, force-uninstall old SW + caches so Netlify stops serving stale bundles
  if (import.meta.env.PROD) {
    window.addEventListener('load', async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      } catch {
        // ignore
      }
    })
  }

  // ✅ Only register SW in dev (optional)
  if (import.meta.env.DEV) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {})
    })
  }
}

async function start() {
  await ensureAuth()

  if (!localStorage.getItem('ffz_seeded')) {
    await saveFanCardStub()
    localStorage.setItem('ffz_seeded', '1')
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
}

start().catch((e) => {
  console.error('App bootstrap failed:', e)
})
