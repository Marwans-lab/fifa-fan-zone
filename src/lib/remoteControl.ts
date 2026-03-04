import type { FanCard } from '../store/useStore'

// ─── Command types ─────────────────────────────────────────────────────────────
export type RemoteCommand =
  | { type: 'navigate'; path: string }
  | { type: 'reset' }
  | { type: 'updateFanCard'; patch: Partial<FanCard> }
  | { type: 'addPoints'; n: number }

export const REMOTE_EVENT = 'fanzone:remote-command'

// ─── Init ──────────────────────────────────────────────────────────────────────
// Called once at bootstrap. Exposes window.handleRemoteCommand so the native
// WebView can call: webView.evaluateJavascript("window.handleRemoteCommand({…})")
export function initRemoteControl(): void {
  window.handleRemoteCommand = (cmd: RemoteCommand) => {
    window.dispatchEvent(new CustomEvent(REMOTE_EVENT, { detail: cmd }))
  }
}
