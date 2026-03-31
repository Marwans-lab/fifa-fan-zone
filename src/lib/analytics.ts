import { analyticsService } from '../app/services/service-instances';

/**
 * Thin analytics wrapper. Calls QAApp.trackEvent internally.
 * Never throws — analytics must not break the app.
 */
export function track(event: string, props?: Record<string, unknown>): void {
  analyticsService.track(event, props);
}
