import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";

export function ensureAuth(): Promise<void> {
  // If Firebase is not configured, resolve immediately
  if (!isFirebaseConfigured || !auth) {
    console.warn("Firebase not configured - skipping auth");
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) await signInAnonymously(auth);

        unsub();
        resolve();
      } catch (err) {
        unsub();
        reject(err);
      }
    });
  });
}
