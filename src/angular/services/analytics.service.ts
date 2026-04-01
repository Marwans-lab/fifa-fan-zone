import { Injectable } from '@angular/core';

import { QAAppService } from './qaapp.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private readonly qaappService: QAAppService) {}

  track(event: string, props?: Record<string, unknown>): void {
    try {
      this.qaappService.trackEvent(event, props);
    } catch {
      // Analytics should never block user flows.
    }
  }
}
