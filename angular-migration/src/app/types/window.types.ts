export interface QAAppInterface {
  getAuthToken(): Promise<string>;
  trackEvent(name: string, props?: Record<string, unknown>): void;
}

declare global {
  interface Window {
    QAApp?: QAAppInterface;
  }
}
