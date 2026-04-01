import { Injectable } from '@angular/core';

export interface NativeSharePayload {
  title: string;
  text: string;
  url?: string;
}

export interface QAAppBridge {
  getAuthToken(): Promise<string>;
  trackEvent(name: string, props?: Record<string, unknown>): void;
  openNativeShare(payload: NativeSharePayload): Promise<void>;
}

interface QAAppWindow extends Window {
  QAApp?: QAAppBridge;
}

@Injectable({ providedIn: 'root' })
export class QAAppService {
  async getAuthToken(): Promise<string> {
    const bridge = this.getBridge();
    if (bridge?.getAuthToken) {
      return bridge.getAuthToken();
    }

    // Browser/dev fallback until native bridge is injected.
    return 'stub-token-dev';
  }

  trackEvent(name: string, props?: Record<string, unknown>): void {
    try {
      this.getBridge()?.trackEvent?.(name, props);
    } catch {
      // Analytics is non-fatal.
    }
  }

  async openNativeShare(payload: NativeSharePayload): Promise<void> {
    const bridge = this.getBridge();
    if (bridge?.openNativeShare) {
      await bridge.openNativeShare(payload);
      return;
    }

    if (typeof navigator.share === 'function') {
      await navigator.share(payload);
      return;
    }

    const fallbackText = payload.url ?? payload.text;
    if (!fallbackText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(fallbackText);
    } catch {
      // Clipboard fallback can fail silently in restricted contexts.
    }
  }

  private getBridge(): QAAppBridge | undefined {
    return (window as QAAppWindow).QAApp;
  }
}
