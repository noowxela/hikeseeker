import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import type { UserDoc } from '../types';
import { db } from '../lib/firebase';
import { loadUserDoc, saveDailyDraw } from '../lib/userData';
import { klToday } from '../lib/klDate';
import { drawForDate } from '../lib/draw';
import type { HikeCard } from '../types';

export function useUserData(user: User | null, catalog: HikeCard[]) {
  const [data, setData] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadUserDoc(db, user)
      .then((doc) => {
        if (!cancelled) setData(doc);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Failed to load user data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const ensureTodayDraw = useCallback(async (): Promise<string[]> => {
    if (!user || !db) {
      throw new Error('Sign in required to draw and save cards.');
    }
    const today = klToday();
    const current = data ?? (await loadUserDoc(db, user));
    if (current.lastDrawDate === today && current.lastDrawIds.length > 0) {
      setData(current);
      return current.lastDrawIds;
    }
    const drawn = drawForDate(catalog, today, 3);
    const ids = drawn.map((c) => c.id);
    const next = await saveDailyDraw(
      db,
      user.uid,
      today,
      ids,
      current.ownedCardIds,
    );
    setData(next);
    return ids;
  }, [user, data, catalog]);

  return { data, loading, error, ensureTodayDraw, setData };
}
