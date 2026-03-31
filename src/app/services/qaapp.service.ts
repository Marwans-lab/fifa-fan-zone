import { Injectable } from '@angular/core';

export interface QAAppSharePayload {
  title: string;
  text: string;
  url?: string;
}

export interface QAAppInterface {
  getAuthToken(): Promise<string>;
  trackEvent(name: string, props?: Record<string, unknown>): void;
  openNativeShare(payload: QAAppSharePayload): Promise<void>;
}

declare global {
  interface Window {
    QAApp?: QAAppInterface;
  }
}

@Injectable({ providedIn: 'root' })
export class QAAppService {
  private readonly browserFallback: QAAppInterface = {
    async getAuthToken() {
      return 'stub-token-dev';
    },
    trackEvent(name: string, props?: Record<string, unknown>) {
      console.info('[QAApp.trackEvent]', name, props ?? {});
    },
    async openNativeShare(payload: QAAppSharePayload) {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }

      const text = payload.url ?? payload.text;
      try {
        await navigator.clipboard.writeText(text);
        console.info('[QAApp.openNativeShare] Copied to clipboard:', text);
      } catch {
        console.warn('[QAApp.openNativeShare] Clipboard unavailable:', text);
      }
    },
  };

  constructor() {
    if (!window.QAApp) {
      window.QAApp = this.browserFallback;
    }
  }

  getAuthToken(): Promise<string> {
    return (window.QAApp ?? this.browserFallback).getAuthToken();
  }

  trackEvent(name: string, props?: Record<string, unknown>): void {
    (window.QAApp ?? this.browserFallback).trackEvent(name, props);
  }

  openNativeShare(payload: QAAppSharePayload): Promise<void> {
    return (window.QAApp ?? this.browserFallback).openNativeShare(payload);
  }
}
