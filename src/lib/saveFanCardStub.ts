import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export async function saveFanCardStub() {
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
