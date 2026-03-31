import { ensureAuth } from './ensureAuth'
import { initQAApp } from './qaapp'
import { saveFanCardStub } from './saveFanCardStub'

let _initPromise: Promise<void> | null = null

function unregisterLegacyServiceWorkers(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return Promise.resolve()
  }

  return new Promise(resolve => {
    window.addEventListener(
      'load',
      async () => {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations()
          await Promise.all(registrations.map(registration => registration.unregister()))
          const cacheKeys = await caches.keys()
          await Promise.all(cacheKeys.map(key => caches.delete(key)))
        } catch {
          // Best effort cleanup only.
        } finally {
          resolve()
        }
      },
      { once: true },
    )
  })
}

export function ensureAppReady(): Promise<void> {
  if (_initPromise) {
    return _initPromise
  }

  _initPromise = (async () => {
    initQAApp()

    if (import.meta.env.PROD) {
      await unregisterLegacyServiceWorkers()
    } else if ('serviceWorker' in navigator) {
      window.addEventListener(
        'load',
        () => {
          void navigator.serviceWorker.register('./sw.js').catch(() => undefined)
        },
        { once: true },
      )
    }

    await ensureAuth()

    if (!localStorage.getItem('ffz_seeded')) {
      await saveFanCardStub()
      localStorage.setItem('ffz_seeded', '1')
    }
  })()

  return _initPromise
}
