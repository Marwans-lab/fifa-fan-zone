export interface QAAppInterface {
  getAuthToken(): Promise<string>;
  trackEvent(name: string, props?: Record<string, unknown>): void;
  openNativeShare?(payload: { title: string; text: string; url?: string }): Promise<void>;
}

declare global {
  interface Window {
    QAApp?: QAAppInterface;
  }
}
