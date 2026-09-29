import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { UserDoc } from '../types';

const emptyUser = (): UserDoc => ({
  ownedCardIds: [],
  lastDrawDate: null,
  lastDrawIds: [],
});

export async function loadUserDoc(
  db: Firestore,
  user: User,
): Promise<UserDoc> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const initial: UserDoc = {
      ...emptyUser(),
      displayName: user.displayName ?? undefined,
      email: user.email ?? undefined,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(ref, initial);
    return initial;
  }
  const data = snap.data() as Partial<UserDoc>;
  return {
    ownedCardIds: data.ownedCardIds ?? [],
    lastDrawDate: data.lastDrawDate ?? null,
    lastDrawIds: data.lastDrawIds ?? [],
    displayName: data.displayName ?? user.displayName ?? undefined,
    email: data.email ?? user.email ?? undefined,
    updatedAt: data.updatedAt,
  };
}

export async function saveDailyDraw(
  db: Firestore,
  uid: string,
  date: string,
  drawIds: string[],
  previousOwned: string[],
): Promise<UserDoc> {
  const owned = Array.from(new Set([...previousOwned, ...drawIds]));
  const next: UserDoc = {
    ownedCardIds: owned,
    lastDrawDate: date,
    lastDrawIds: drawIds,
    updatedAt: new Date().toISOString(),
  };
  const ref = doc(db, 'users', uid);
  await setDoc(ref, next, { merge: true });
  return next;
}

export async function mergeOwned(
  db: Firestore,
  uid: string,
  ownedCardIds: string[],
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    ownedCardIds,
    updatedAt: new Date().toISOString(),
  });
}
