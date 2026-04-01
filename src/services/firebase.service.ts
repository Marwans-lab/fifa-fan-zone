import { Injectable } from '@angular/core';

import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore, initializeFirestore } from 'firebase/firestore';
import { environment } from '../environments/environment';

const firebaseConfig = environment.firebase;

function initializeAppOnce(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
}

function initializeFirestoreWithFallback(app: FirebaseApp): Firestore {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
}

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  readonly app: FirebaseApp;
  readonly auth: Auth;
  readonly db: Firestore;

  constructor() {
    this.app = initializeAppOnce();
    this.auth = getAuth(this.app);
    this.db = initializeFirestoreWithFallback(this.app);
  }
}
