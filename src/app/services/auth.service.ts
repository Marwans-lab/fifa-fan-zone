import { Injectable, OnDestroy } from '@angular/core';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { FirebaseService } from './firebase.service';
import { QAAppService } from './qaapp.service';

const TOKEN_TIMEOUT_MS = 5_000;
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1_000;
const TOKEN_REFRESH_INTERVAL_MS = 60_000;
const TOKEN_FETCH_ATTEMPTS = 3;
const TOKEN_RETRY_BASE_MS = 500;

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private token: string | null = null;
  private tokenFetchedAt: number | null = null;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly qaAppService: QAAppService,
  ) {
    this.startTokenRefreshLifecycle();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval !== null) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  async ensureAuth(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        this.firebaseService.auth,
        async (user) => {
          try {
            if (!user) {
              await signInAnonymously(this.firebaseService.auth);
            }
            unsubscribe();
            resolve();
          } catch (error) {
            unsubscribe();
            reject(error);
          }
        },
        (error) => {
          unsubscribe();
          reject(error);
        },
      );
    });
  }

  async fetchAuthToken(): Promise<string | null> {
    for (let attempt = 1; attempt <= TOKEN_FETCH_ATTEMPTS; attempt += 1) {
      try {
        const token = await this.withTimeout(
          this.qaAppService.getAuthToken(),
          TOKEN_TIMEOUT_MS,
        );
        this.token = token;
        this.tokenFetchedAt = Date.now();
        return token;
      } catch {
        if (attempt === TOKEN_FETCH_ATTEMPTS) {
          this.token = null;
          this.tokenFetchedAt = null;
          return null;
        }

        const retryDelay = TOKEN_RETRY_BASE_MS * 2 ** (attempt - 1);
        await this.sleep(retryDelay);
      }
    }

    return null;
  }

  getToken(): string | null {
    return this.token;
  }

  async hasValidSession(): Promise<boolean> {
    await this.ensureAuth();
    if (this.isTokenExpired(this.token)) {
      await this.fetchAuthToken();
    }
    return !this.isTokenExpired(this.token);
  }

  private startTokenRefreshLifecycle(): void {
    if (this.refreshInterval !== null) {
      return;
    }

    void this.fetchAuthToken();

    this.refreshInterval = setInterval(() => {
      void this.fetchAuthToken();
    }, TOKEN_REFRESH_INTERVAL_MS);
  }

  private isTokenExpired(token: string | null): boolean {
    if (!token) {
      return true;
    }

    if (token === 'stub-token-dev') {
      return false;
    }

    if (this.tokenFetchedAt === null) {
      return true;
    }

    return Date.now() - this.tokenFetchedAt > TOKEN_MAX_AGE_MS;
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Auth timeout')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
