import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  track(event: string, props?: Record<string, unknown>): void {
    try {
      window.QAApp?.trackEvent(event, props);
    } catch {
      // Analytics must never break the UI flow.
    }
  }
}
