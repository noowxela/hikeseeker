import { useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import type { HikeCard, UserDoc } from '../types';
import { HikeCardView } from '../components/HikeCard';
import { klToday } from '../lib/klDate';
import { drawForDate } from '../lib/draw';

/** Stagger between each dealt card (ms). */
const DEAL_STAGGER_MS = 320;

interface Props {
  catalog: HikeCard[];
  user: User | null;
  userData: UserDoc | null;
  onSignIn: () => void;
  onDraw: () => Promise<string[]>;
  firebaseConfigured: boolean;
  onSelectCard: (card: HikeCard) => void;
}

export function Home({
  catalog,
  user,
  userData,
  onSignIn,
  onDraw,
  firebaseConfigured,
  onSelectCard,
}: Props) {
  const today = klToday();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [previewIds, setPreviewIds] = useState<string[] | null>(null);
  /** Bumps on each draw/preview so the deal animation re-runs even if ids match. */
  const [dealSeq, setDealSeq] = useState(0);

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

  /** Remount key: draw ids + seq so guest re-preview and new draws replay the deal. */
  const drawKey = displayIds ? `${displayIds.join(',')}:${dealSeq}` : '';

  async function handleDraw() {
    setErr(null);
    if (!user) {
      // Guest preview: show deterministic draw but do not save
      const guest = drawForDate(catalog, today, 3).map((c) => c.id);
      setDealSeq((n) => n + 1);
      setPreviewIds(guest);
      return;
    }
    setBusy(true);
    try {
      const ids = await onDraw();
      setDealSeq((n) => n + 1);
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
        <div className="hs-card-row" key={drawKey}>
          {cards.map((c, index) => (
            <div
              key={c.id}
              className="hs-card-wrap hs-card-wrap--deal"
              style={{ animationDelay: `${index * DEAL_STAGGER_MS}ms` }}
            >
              <HikeCardView
                card={c}
                owned={owned.has(c.id)}
                deal
                dealIndex={index}
                onSelect={() => onSelectCard(c)}
              />
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
