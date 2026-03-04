/**
 * Thin analytics wrapper. Calls QAApp.trackEvent internally.
 * Never throws — analytics must not break the app.
 */
export function track(event: string, props?: Record<string, unknown>): void {
  try {
    window.QAApp?.trackEvent(event, props)
  } catch {
    // Non-fatal
  }
}
