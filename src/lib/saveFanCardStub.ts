import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";

export async function saveFanCardStub() {
  // Skip if Firebase is not configured
  if (!isFirebaseConfigured || !auth || !db) {
    console.warn("Firebase not configured - skipping fan card stub");
    return;
  }

  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No UID yet");

  await setDoc(
    doc(db, "fanCards", uid),
    {
      teamId: "TBD",
      hasLocalPhoto: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
