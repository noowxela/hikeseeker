import { useCallback, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { CardsThree } from '@phosphor-icons/react';
import type { HikeCard, UserDoc } from '../types';
import { HikeCardView } from '../components/HikeCard';
import {
  DrawRevealStage,
  type CardPhase,
} from '../components/DrawRevealStage';
import { klToday } from '../lib/klDate';
import { drawForDate } from '../lib/draw';

interface Props {
  catalog: HikeCard[];
  user: User | null;
  userData: UserDoc | null;
  onSignIn: () => void;
  onDraw: () => Promise<string[]>;
  firebaseConfigured: boolean;
  onSelectCard: (card: HikeCard) => void;
}

type Mode =
  | { kind: 'idle' }
  | {
      kind: 'ritual';
      ids: string[];
      currentIndex: number;
      revealedCount: number;
      phase: CardPhase;
    }
  | { kind: 'done'; ids: string[] };

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
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });

  const savedIds =
    userData?.lastDrawDate === today ? userData.lastDrawIds : null;
  const alreadyDrawn = Boolean(savedIds?.length);

  // Persist saved draw into "done" display (skip ritual by default)
  const displayFromSaved =
    alreadyDrawn && mode.kind === 'idle' ? savedIds : null;

  const doneIds =
    mode.kind === 'done'
      ? mode.ids
      : displayFromSaved;

  const ritualCards = useMemo(() => {
    if (mode.kind !== 'ritual') return [];
    return mode.ids
      .map((id) => catalog.find((c) => c.id === id))
      .filter((c): c is HikeCard => Boolean(c));
  }, [catalog, mode]);

  const doneCards = useMemo(() => {
    if (!doneIds) return [];
    return doneIds
      .map((id) => catalog.find((c) => c.id === id))
      .filter((c): c is HikeCard => Boolean(c));
  }, [catalog, doneIds]);

  const owned = new Set(userData?.ownedCardIds ?? []);

  function startRitual(ids: string[]) {
    setMode({
      kind: 'ritual',
      ids,
      currentIndex: 0,
      revealedCount: 0,
      phase: 'back',
    });
  }

  async function handleDraw() {
    setErr(null);
    if (!user) {
      const guest = drawForDate(catalog, today, 3).map((c) => c.id);
      startRitual(guest);
      return;
    }
    setBusy(true);
    try {
      const ids = await onDraw();
      startRitual(ids);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Draw failed');
    } finally {
      setBusy(false);
    }
  }

  function handleReplay() {
    const ids = savedIds ?? (mode.kind === 'done' ? mode.ids : null);
    if (!ids?.length) return;
    startRitual(ids);
  }

  const onPhaseChange = useCallback((phase: CardPhase) => {
    setMode((m) => (m.kind === 'ritual' ? { ...m, phase } : m));
  }, []);

  const onNext = useCallback(() => {
    setMode((m) => {
      if (m.kind !== 'ritual') return m;
      const nextIndex = m.currentIndex + 1;
      return {
        ...m,
        currentIndex: nextIndex,
        revealedCount: m.currentIndex + 1,
        phase: 'back',
      };
    });
  }, []);

  const onRitualComplete = useCallback(() => {
    setMode((m) => {
      if (m.kind !== 'ritual') return m;
      return { kind: 'done', ids: m.ids };
    });
  }, []);

  const inRitual = mode.kind === 'ritual';
  const showStaticRow = !inRitual && doneCards.length > 0;

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
            className="hs-btn hs-btn--primary"
            onClick={onSignIn}
            disabled={!firebaseConfigured}
          >
            Sign in with Google
          </button>
        </div>
      )}

      {!inRitual && (
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
                  ? "Draw today's 3 cards"
                  : "Preview today's draw"}
          </button>
          {alreadyDrawn && (
            <span className="hs-muted">
              Saved · reopen anytime today for the same set
            </span>
          )}
          {!user && doneCards.length > 0 && (
            <span className="hs-muted">Preview only - sign in to collect</span>
          )}
          {(alreadyDrawn || mode.kind === 'done') && doneCards.length > 0 && (
            <button
              type="button"
              className="hs-btn hs-btn--ghost"
              onClick={handleReplay}
            >
              Replay reveal
            </button>
          )}
        </div>
      )}

      {err && <p className="hs-error">{err}</p>}

      {inRitual && ritualCards.length > 0 && (
        <DrawRevealStage
          cards={ritualCards}
          ownedIds={owned}
          currentIndex={mode.currentIndex}
          revealedCount={mode.revealedCount}
          phase={mode.phase}
          onPhaseChange={onPhaseChange}
          onNext={onNext}
          onSelectCard={onSelectCard}
          onRitualComplete={onRitualComplete}
        />
      )}

      {showStaticRow ? (
        <div className="hs-card-row">
          {doneCards.map((c) => (
            <div key={c.id} className="hs-card-wrap">
              <HikeCardView
                card={c}
                owned={owned.has(c.id)}
                onSelect={() => onSelectCard(c)}
              />
            </div>
          ))}
        </div>
      ) : (
        !inRitual && (
          <div className="hs-empty">
            <span className="hs-empty__icon" aria-hidden>
              <CardsThree size={22} weight="duotone" />
            </span>
            <p className="hs-empty__title">No cards yet</p>
            <p className="hs-empty__body">
              Hit the draw button to reveal today&apos;s trio of Selangor trails.
            </p>
          </div>
        )
      )}
    </section>
  );
}
