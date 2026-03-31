import { Injectable } from '@angular/core';
import { QAAppService } from './qaapp.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private readonly qaAppService: QAAppService) {}

  track(event: string, props?: Record<string, unknown>): void {
    try {
      this.qaAppService.trackEvent(event, props);
    } catch {
      // Analytics must never block user flows.
    }
  }
}
