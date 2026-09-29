import { useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import type { HikeCard, UserDoc } from '../types';
import { HikeCardView } from '../components/HikeCard';
import { klToday } from '../lib/klDate';
import { drawForDate } from '../lib/draw';

interface Props {
  catalog: HikeCard[];
  user: User | null;
  userData: UserDoc | null;
  onSignIn: () => void;
  onDraw: () => Promise<string[]>;
  firebaseConfigured: boolean;
}

export function Home({
  catalog,
  user,
  userData,
  onSignIn,
  onDraw,
  firebaseConfigured,
}: Props) {
  const today = klToday();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [previewIds, setPreviewIds] = useState<string[] | null>(null);

  const savedIds =
    userData?.lastDrawDate === today ? userData.lastDrawIds : null;

  const displayIds = savedIds ?? previewIds;

  const cards = useMemo(() => {
    if (!displayIds) return [];
    return displayIds
      .map((id) => catalog.find((c) => c.id === id))
      .filter((c): c is HikeCard => Boolean(c));
  }, [catalog, displayIds]);

  const owned = new Set(userData?.ownedCardIds ?? []);

  async function handleDraw() {
    setErr(null);
    if (!user) {
      // Guest preview: show deterministic draw but do not save
      const guest = drawForDate(catalog, today, 3).map((c) => c.id);
      setPreviewIds(guest);
      return;
    }
    setBusy(true);
    try {
      const ids = await onDraw();
      setPreviewIds(ids);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Draw failed');
    } finally {
      setBusy(false);
    }
  }

  const alreadyDrawn = Boolean(savedIds?.length);

  return (
    <section className="hs-page">
      <div className="hs-hero">
        <h1>Today&apos;s trail cards</h1>
        <p>
          One draw of 3 unique Selangor hikes per day ({today}, Asia/Kuala_Lumpur).
          Same draw if you reopen today.
        </p>
      </div>

      {!user && (
        <div className="hs-banner">
          <p>
            Browse freely. <strong>Sign in</strong> to save today&apos;s draw to your
            collection. Guests can preview the daily set (not saved).
          </p>
          <button
            type="button"
            className="hs-btn"
            onClick={onSignIn}
            disabled={!firebaseConfigured}
          >
            Sign in with Google
          </button>
        </div>
      )}

      <div className="hs-actions">
        <button
          type="button"
          className="hs-btn hs-btn--primary"
          onClick={handleDraw}
          disabled={busy || (user ? alreadyDrawn : false)}
        >
          {busy
            ? 'Drawing…'
            : alreadyDrawn
              ? 'Drawn for today'
              : user
                ? 'Draw today\'s 3 cards'
                : 'Preview today\'s draw'}
        </button>
        {alreadyDrawn && (
          <span className="hs-muted">Saved · reopen anytime today for the same set</span>
        )}
        {!user && displayIds && (
          <span className="hs-muted">Preview only — sign in to collect</span>
        )}
      </div>

      {err && <p className="hs-error">{err}</p>}

      {cards.length > 0 ? (
        <div className="hs-card-row">
          {cards.map((c) => (
            <div key={c.id} className="hs-card-wrap">
              <HikeCardView
                card={c}
                owned={owned.has(c.id)}
                onOpenMaps={() => window.open(c.mapsUrl, '_blank', 'noopener')}
              />
              <a
                className="hs-maps-link"
                href={c.mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps →
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="hs-muted hs-empty">
          No cards yet — hit the draw button to reveal today&apos;s trio.
        </p>
      )}
    </section>
  );
}
