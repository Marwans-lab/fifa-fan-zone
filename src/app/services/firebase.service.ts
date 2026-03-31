import { Injectable } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore, initializeFirestore } from 'firebase/firestore';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  readonly app: FirebaseApp;
  readonly auth: Auth;
  readonly db: Firestore;

  constructor() {
    this.app =
      getApps().length > 0 ? getApp() : initializeApp(environment.firebase);
    this.auth = getAuth(this.app);

    try {
      this.db = initializeFirestore(this.app, {
        experimentalForceLongPolling: true,
        useFetchStreams: false,
      });
    } catch {
      this.db = getFirestore(this.app);
    }
  }
}
