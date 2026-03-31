import { Injectable } from '@angular/core';

export interface QAAppSharePayload {
  title: string;
  text: string;
  url?: string;
}

export interface QAAppBridge {
  getAuthToken(): Promise<string>;
  trackEvent(name: string, props?: Record<string, unknown>): void;
  openNativeShare(payload: QAAppSharePayload): Promise<void>;
}

declare global {
  interface Window {
    QAApp?: QAAppBridge;
  }
}

const browserFallback: QAAppBridge = {
  async getAuthToken() {
    return 'stub-token-dev';
  },
  trackEvent() {
    // no-op in browser fallback
  },
  async openNativeShare(payload) {
    if (typeof navigator === 'undefined') {
      return;
    }

    if (navigator.share) {
      await navigator.share(payload);
      return;
    }

    const fallbackText = payload.url ?? payload.text;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(fallbackText);
    }
  },
};

@Injectable({
  providedIn: 'root',
})
export class QAAppService {
  initBridge(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.QAApp) {
      window.QAApp = browserFallback;
    }
  }

  private getBridge(): QAAppBridge {
    this.initBridge();
    if (typeof window === 'undefined') {
      return browserFallback;
    }

    return window.QAApp ?? browserFallback;
  }

  getAuthToken(): Promise<string> {
    return this.getBridge().getAuthToken();
  }

  trackEvent(name: string, props?: Record<string, unknown>): void {
    this.getBridge().trackEvent(name, props);
  }

  openNativeShare(payload: QAAppSharePayload): Promise<void> {
    return this.getBridge().openNativeShare(payload);
  }
}
