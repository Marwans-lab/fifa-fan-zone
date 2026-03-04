import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/tokens.css'
import './styles/global.css'
import { initQAApp } from './lib/qaapp'
import { initRemoteControl } from './lib/remoteControl'
import { ensureAuth } from './lib/ensureAuth'
import { saveFanCardStub } from './lib/saveFanCardStub'

initQAApp()
initRemoteControl()

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // SW registration failed — non-fatal in dev
    })
  })
}

async function start() {
  await ensureAuth()

  if (!localStorage.getItem('ffz_seeded')) {
    await saveFanCardStub()
    localStorage.setItem('ffz_seeded', '1')
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
}

start().catch((e) => {
  console.error('App bootstrap failed:', e)
})
