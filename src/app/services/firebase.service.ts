import { Injectable } from '@angular/core'
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app'
import { Auth, getAuth } from 'firebase/auth'
import { Firestore, getFirestore, initializeFirestore } from 'firebase/firestore'

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  readonly app: FirebaseApp
  readonly auth: Auth
  readonly db: Firestore

  constructor() {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }

    this.app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
    this.auth = getAuth(this.app)
    try {
      this.db = initializeFirestore(this.app, {
        experimentalForceLongPolling: true,
        useFetchStreams: false,
      })
    } catch {
      this.db = getFirestore(this.app)
    }
  }
}
