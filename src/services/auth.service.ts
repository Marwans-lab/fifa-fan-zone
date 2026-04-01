import { Injectable } from '@angular/core';

import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';

import { FirebaseService } from './firebase.service';
import { QAAppService } from './qaapp.service';

const TOKEN_TIMEOUT_MS = 5000;
const TOKEN_MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 300;
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private token: string | null = null;
  private tokenFetchedAt: number | null = null;

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly qaappService: QAAppService
  ) {}

  async ensureAuth(): Promise<void> {
    const currentUser = this.firebaseService.auth.currentUser;
    if (currentUser) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(this.firebaseService.auth, async (user: User | null) => {
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
      });
    });
  }

  async fetchAuthToken(): Promise<string | null> {
    if (!this.isTokenExpired(this.token)) {
      return this.token;
    }

    for (let attempt = 1; attempt <= TOKEN_MAX_RETRIES; attempt += 1) {
      try {
        const token = await this.withTimeout(this.qaappService.getAuthToken(), TOKEN_TIMEOUT_MS);
        this.token = token;
        this.tokenFetchedAt = Date.now();
        return token;
      } catch {
        if (attempt === TOKEN_MAX_RETRIES) {
          return null;
        }

        await this.delay(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }

    return null;
  }

  clearToken(): void {
    this.token = null;
    this.tokenFetchedAt = null;
  }

  private isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    if (token === 'stub-token-dev') return false;
    if (this.tokenFetchedAt === null) return true;

    return Date.now() - this.tokenFetchedAt > TOKEN_MAX_AGE_MS;
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutHandle = window.setTimeout(() => reject(new Error('Auth timeout')), timeoutMs);

      promise.then(
        value => {
          window.clearTimeout(timeoutHandle);
          resolve(value);
        },
        error => {
          window.clearTimeout(timeoutHandle);
          reject(error);
        }
      );
    });
  }

  private async delay(ms: number): Promise<void> {
    await new Promise<void>(resolve => {
      window.setTimeout(resolve, ms);
    });
  }
}
