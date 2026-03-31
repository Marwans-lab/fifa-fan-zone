import { Injectable, OnDestroy } from '@angular/core';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { FirebaseService } from './firebase.service';
import { QAAppService } from './qaapp.service';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  token: string | null;
  status: AuthStatus;
}

const TOKEN_TIMEOUT_MS = 5000;
const TOKEN_REFRESH_INTERVAL_MS = 60_000;
const TOKEN_REFRESH_ATTEMPTS = 3;
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const BACKOFF_BASE_MS = 250;

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private readonly firebaseService: FirebaseService;
  private readonly qaAppService: QAAppService;
  private authState: AuthState = { token: null, status: 'loading' };
  private tokenFetchedAt: number | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(firebaseService?: FirebaseService, qaAppService?: QAAppService) {
    this.firebaseService = firebaseService ?? new FirebaseService();
    this.qaAppService = qaAppService ?? new QAAppService();
    this.startTokenRefreshLifecycle();
  }

  async ensureAuth(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const unsub = onAuthStateChanged(this.firebaseService.auth, async (user) => {
        try {
          if (!user) {
            await signInAnonymously(this.firebaseService.auth);
          }

          unsub();
          resolve();
        } catch (error) {
          unsub();
          reject(error);
        }
      });
    });
  }

  async fetchAuthToken(): Promise<string | null> {
    for (let attempt = 1; attempt <= TOKEN_REFRESH_ATTEMPTS; attempt += 1) {
      const token = await this.fetchAuthTokenWithTimeout();
      if (token) {
        this.tokenFetchedAt = Date.now();
        this.authState = { token, status: 'authenticated' };
        return token;
      }

      if (attempt < TOKEN_REFRESH_ATTEMPTS) {
        await this.sleep(BACKOFF_BASE_MS * 2 ** (attempt - 1));
      }
    }

    this.authState = { token: null, status: 'unauthenticated' };
    return null;
  }

  getAuthState(): AuthState {
    return this.authState;
  }

  isTokenExpired(token: string | null): boolean {
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

  private startTokenRefreshLifecycle(): void {
    if (this.refreshTimer !== null) {
      return;
    }

    this.refreshTimer = setInterval(() => {
      void this.refreshTokenIfNeeded();
    }, TOKEN_REFRESH_INTERVAL_MS);
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    if (this.isTokenExpired(this.authState.token)) {
      await this.fetchAuthToken();
    }
  }

  private async fetchAuthTokenWithTimeout(): Promise<string | null> {
    try {
      const tokenPromise = this.qaAppService.getAuthToken();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Auth timeout')), TOKEN_TIMEOUT_MS);
      });

      return await Promise.race([tokenPromise, timeoutPromise]);
    } catch {
      return null;
    }
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
