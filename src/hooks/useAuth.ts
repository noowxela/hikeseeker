import { useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, firebaseConfigured } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async () => {
    if (!auth || !googleProvider) {
      throw new Error(
        'Firebase is not configured. Copy .env.example to .env.local and add your project keys.',
      );
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code: string }).code)
          : '';
      // Popup blocked / COOP — fall back to redirect
      if (
        code.includes('popup') ||
        code === 'auth/cancelled-popup-request'
      ) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!auth) return;
    await fbSignOut(auth);
  }, []);

  return { user, loading, signIn, signOut, firebaseConfigured };
}
