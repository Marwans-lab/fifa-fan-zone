import { Injectable } from '@angular/core';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private static shared:
    | {
        app: FirebaseApp;
        auth: Auth;
        db: Firestore;
      }
    | null = null;

  readonly app: FirebaseApp;
  readonly auth: Auth;
  readonly db: Firestore;

  constructor() {
    if (!FirebaseService.shared) {
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      const auth = getAuth(app);
      let db: Firestore;

      try {
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
          useFetchStreams: false,
        });
      } catch {
        db = getFirestore(app);
      }

      FirebaseService.shared = { app, auth, db };
    }

    this.app = FirebaseService.shared.app;
    this.auth = FirebaseService.shared.auth;
    this.db = FirebaseService.shared.db;
  }
}
