import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "./firebase";

export function ensureAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) await signInAnonymously(auth);

        console.log("Firebase UID:", auth.currentUser?.uid);

        unsub();
        resolve();
      } catch (err) {
        unsub();
        reject(err);
      }
    });
  });
}
