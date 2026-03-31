import { Injectable } from '@angular/core'

export interface QAAppSharePayload {
  title: string
  text: string
  url?: string
}

export interface QAAppBridge {
  getAuthToken(): Promise<string>
  trackEvent(name: string, props?: Record<string, unknown>): void
  openNativeShare(payload: QAAppSharePayload): Promise<void>
}

declare global {
  interface Window {
    QAApp?: QAAppBridge
  }
}

@Injectable({ providedIn: 'root' })
export class QAAppService {
  private readonly browserFallback: QAAppBridge = {
    getAuthToken: async () => 'stub-token-dev',
    trackEvent: () => {},
    openNativeShare: async (payload: QAAppSharePayload) => {
      if (navigator.share) {
        await navigator.share(payload)
        return
      }

      const text = payload.url ?? payload.text
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        // Ignore clipboard failures in browser fallback mode.
      }
    },
  }

  getAuthToken(): Promise<string> {
    return (window.QAApp ?? this.browserFallback).getAuthToken()
  }

  trackEvent(name: string, props?: Record<string, unknown>): void {
    ;(window.QAApp ?? this.browserFallback).trackEvent(name, props)
  }

  openNativeShare(payload: QAAppSharePayload): Promise<void> {
    return (window.QAApp ?? this.browserFallback).openNativeShare(payload)
  }
}
