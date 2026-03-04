export interface QAAppInterface {
  getAuthToken(): Promise<string>
  trackEvent(name: string, props?: Record<string, unknown>): void
  openNativeShare(payload: { title: string; text: string; url?: string }): Promise<void>
}

declare global {
  interface Window {
    QAApp: QAAppInterface
    // Remote-control bridge: called by the native WebView to push commands
    handleRemoteCommand: (cmd: import('./remoteControl').RemoteCommand) => void
  }
}

const browserFallback: QAAppInterface = {
  async getAuthToken() {
    // SSO token reuse will replace this in production
    return 'stub-token-dev'
  },

  trackEvent(name, props) {
    console.info('[QAApp.trackEvent]', name, props ?? {})
  },

  async openNativeShare(payload) {
    if (navigator.share) {
      await navigator.share(payload)
    } else {
      // Fallback: copy URL or text to clipboard
      const text = payload.url ?? payload.text
      try {
        await navigator.clipboard.writeText(text)
        console.info('[QAApp.openNativeShare] Copied to clipboard:', text)
      } catch {
        console.warn('[QAApp.openNativeShare] Clipboard unavailable:', text)
      }
    }
  },
}

export function initQAApp(): void {
  if (!window.QAApp) {
    window.QAApp = browserFallback
  }
}
