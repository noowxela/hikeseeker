import { useCallback, useEffect, useState } from 'react';
import type { HikeCard } from '../types';
import { HikeCardView } from './HikeCard';
import { MosaicOverlay } from './MosaicOverlay';
import { Boot } from '@phosphor-icons/react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export type CardPhase = 'back' | 'flipping' | 'mosaic' | 'revealed';

interface Props {
  cards: HikeCard[];
  ownedIds: Set<string>;
  /** Index of the card currently in the ritual (0-based). */
  currentIndex: number;
  /** How many cards have been fully revealed (and sit in the row). */
  revealedCount: number;
  phase: CardPhase;
  onPhaseChange: (phase: CardPhase) => void;
  onNext: () => void;
  onSelectCard: (card: HikeCard) => void;
  onRitualComplete: () => void;
}

const FLIP_MS = 560;
const FLIP_MS_REDUCED = 120;

/**
 * Centered one-by-one draw ritual:
 * backfold → click → flip → mosaic dissolve → next.
 */
export function DrawRevealStage({
  cards,
  ownedIds,
  currentIndex,
  revealedCount,
  phase,
  onPhaseChange,
  onNext,
  onSelectCard,
  onRitualComplete,
}: Props) {
  const reduced = usePrefersReducedMotion();
  const total = cards.length;
  const active = cards[currentIndex];
  const revealed = cards.slice(0, revealedCount);
  const [flipOn, setFlipOn] = useState(false);

  // Reset flip visual when moving to a new card
  useEffect(() => {
    setFlipOn(phase !== 'back');
  }, [currentIndex, phase]);

  // Reduced motion: skip flip+mosaic, land on revealed quickly
  useEffect(() => {
    if (!reduced || !active) return;
    if (phase === 'back') {
      const t = window.setTimeout(() => {
        setFlipOn(true);
        onPhaseChange('revealed');
      }, 40);
      return () => window.clearTimeout(t);
    }
  }, [reduced, phase, active, onPhaseChange]);

  const handleBackClick = useCallback(() => {
    if (phase !== 'back' || !active) return;
    if (reduced) {
      setFlipOn(true);
      onPhaseChange('revealed');
      return;
    }
    onPhaseChange('flipping');
    setFlipOn(true);
  }, [phase, active, reduced, onPhaseChange]);

  // After flip animation → mosaic
  useEffect(() => {
    if (phase !== 'flipping') return;
    const ms = reduced ? FLIP_MS_REDUCED : FLIP_MS;
    const t = window.setTimeout(() => onPhaseChange('mosaic'), ms);
    return () => window.clearTimeout(t);
  }, [phase, reduced, onPhaseChange]);

  const handleMosaicDone = useCallback(() => {
    onPhaseChange('revealed');
  }, [onPhaseChange]);

  const handleContinue = useCallback(() => {
    if (phase !== 'revealed') return;
    if (currentIndex >= total - 1) {
      onRitualComplete();
      return;
    }
    onNext();
  }, [phase, currentIndex, total, onNext, onRitualComplete]);

  if (!active) return null;

  const progressLabel = `Card ${currentIndex + 1} of ${total}`;
  const canOpenDetail = phase === 'revealed';
  const showMosaic = phase === 'mosaic' || (phase === 'flipping' && flipOn);

  // Seed from card id for stable mosaic scramble per hike
  let seed = 1;
  for (let i = 0; i < active.id.length; i++) {
    seed = (seed * 31 + active.id.charCodeAt(i)) >>> 0;
  }

  return (
    <div className="hs-ritual">
      <div className="hs-ritual__progress" aria-live="polite">
        {progressLabel}
      </div>

      <div className="hs-ritual__stage">
        <div
          className={`hs-flip${flipOn ? ' is-flipped' : ''}${reduced ? ' is-reduced' : ''}`}
        >
          <div className="hs-flip__inner">
            <button
              type="button"
              className="hs-flip__face hs-flip__back"
              onClick={handleBackClick}
              disabled={phase !== 'back'}
              aria-label={`Card back - tap to reveal ${progressLabel}`}
            >
              <span className="hs-flip__back-logo" aria-hidden>
                <Boot size={42} weight="duotone" />
              </span>
              <span className="hs-flip__back-title">HikeSeeker</span>
              <span className="hs-flip__back-hint">
                {phase === 'back' ? 'Tap to flip' : ''}
              </span>
            </button>

            <div className="hs-flip__face hs-flip__front">
              <div className="hs-flip__front-card">
                <HikeCardView
                  card={active}
                  owned={ownedIds.has(active.id)}
                  onSelect={
                    canOpenDetail ? () => onSelectCard(active) : undefined
                  }
                />
                {showMosaic && (
                  <MosaicOverlay
                    key={`${active.id}-mosaic`}
                    active={phase === 'mosaic'}
                    reducedMotion={reduced}
                    seed={seed}
                    onComplete={handleMosaicDone}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hs-ritual__actions">
        {phase === 'back' && (
          <p className="hs-muted">Flip the card, then watch the mosaic clear.</p>
        )}
        {phase === 'flipping' && (
          <p className="hs-muted">Flipping…</p>
        )}
        {phase === 'mosaic' && (
          <p className="hs-muted">Revealing trail…</p>
        )}
        {phase === 'revealed' && (
          <>
            <p className="hs-muted">
              {currentIndex < total - 1
                ? 'Card revealed - continue when ready.'
                : 'All three revealed.'}
            </p>
            <button
              type="button"
              className="hs-btn hs-btn--primary"
              onClick={handleContinue}
            >
              {currentIndex < total - 1 ? 'Next card' : 'Done'}
            </button>
          </>
        )}
      </div>

      {revealed.length > 0 && (
        <div className="hs-ritual__row" aria-label="Revealed cards">
          {revealed.map((c) => (
            <div key={c.id} className="hs-card-wrap">
              <HikeCardView
                card={c}
                owned={ownedIds.has(c.id)}
                compact
                onSelect={() => onSelectCard(c)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
