import { Injectable } from '@angular/core'
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth'
import { FirebaseService } from './firebase.service'
import { QAAppService } from './qaapp.service'

const TOKEN_TIMEOUT_MS = 5000
const MAX_TOKEN_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 400
const TOKEN_REFRESH_INTERVAL_MS = 60_000

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authToken: string | null = null
  private refreshTimer: ReturnType<typeof setInterval> | null = null
  private ensureAuthPromise: Promise<boolean> | null = null

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly qaAppService: QAAppService,
  ) {
    this.startTokenRefresh()
  }

  getToken(): string | null {
    return this.authToken
  }

  ensureAuth(): Promise<boolean> {
    if (this.ensureAuthPromise !== null) {
      return this.ensureAuthPromise
    }

    this.ensureAuthPromise = this.resolveAuth().finally(() => {
      this.ensureAuthPromise = null
    })

    return this.ensureAuthPromise
  }

  async fetchAuthToken(): Promise<string | null> {
    for (let attempt = 1; attempt <= MAX_TOKEN_ATTEMPTS; attempt += 1) {
      try {
        const token = await this.withTimeout(this.qaAppService.getAuthToken(), TOKEN_TIMEOUT_MS)
        this.authToken = token
        return token
      } catch {
        if (attempt < MAX_TOKEN_ATTEMPTS) {
          await this.sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1))
        }
      }
    }

    this.authToken = null
    return null
  }

  private async resolveAuth(): Promise<boolean> {
    try {
      await this.ensureFirebaseUser()
      const token = await this.fetchAuthToken()
      return token !== null
    } catch {
      this.authToken = null
      return false
    }
  }

  private ensureFirebaseUser(): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(this.firebaseService.auth, async (user) => {
        try {
          if (user) {
            unsubscribe()
            resolve(user)
            return
          }

          const credential = await signInAnonymously(this.firebaseService.auth)
          unsubscribe()
          resolve(credential.user)
        } catch (error) {
          unsubscribe()
          reject(error)
        }
      })
    })
  }

  private startTokenRefresh(): void {
    if (this.refreshTimer !== null) {
      return
    }

    this.refreshTimer = setInterval(() => {
      void this.fetchAuthToken()
    }, TOKEN_REFRESH_INTERVAL_MS)
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Auth token request timed out'))
      }, timeoutMs)

      promise
        .then((value) => {
          clearTimeout(timeoutId)
          resolve(value)
        })
        .catch((error: unknown) => {
          clearTimeout(timeoutId)
          reject(error)
        })
    })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }
}
