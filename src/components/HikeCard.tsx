import { useCallback, useRef, type PointerEvent } from 'react';
import type { HikeCard as HikeCardData } from '../types';
import { resolveCardImageUrl } from '../lib/cardImage';
import '../styles/pokemon-foil.css';

const RARITY_EMOJI: Record<string, string> = {
  common: '🌿',
  uncommon: '🍃',
  rare: '🏔️',
  epic: '⛰️',
  legendary: '🌋',
};

const CLICK_THRESHOLD_PX = 8;

interface Props {
  card: HikeCardData;
  compact?: boolean;
  owned?: boolean;
  /** Called on single click (not drag) or Enter. Opens detail panel. */
  onSelect?: () => void;
}

export function HikeCardView({ card, compact, owned, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const pointerOrigin = useRef<{ x: number; y: number } | null>(null);

  const reset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('active');
    el.style.setProperty('--rotate-x', '0deg');
    el.style.setProperty('--rotate-y', '0deg');
    el.style.setProperty('--card-opacity', '0');
    el.style.setProperty('--pointer-x', '50%');
    el.style.setProperty('--pointer-y', '50%');
    el.style.setProperty('--background-x', '50%');
    el.style.setProperty('--background-y', '50%');
  }, []);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    pointerOrigin.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = x / rect.width;
    const py = y / rect.height;
    const rotX = (0.5 - py) * 28;
    const rotY = (px - 0.5) * 28;
    el.classList.add('active');
    el.style.setProperty('--rotate-x', `${rotX}deg`);
    el.style.setProperty('--rotate-y', `${rotY}deg`);
    el.style.setProperty('--pointer-x', `${px * 100}%`);
    el.style.setProperty('--pointer-y', `${py * 100}%`);
    el.style.setProperty('--background-x', `${px * 100}%`);
    el.style.setProperty('--background-y', `${py * 100}%`);
    el.style.setProperty('--card-opacity', '1');
  }, []);

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const origin = pointerOrigin.current;
      pointerOrigin.current = null;
      if (!origin || !onSelect) return;
      const dx = e.clientX - origin.x;
      const dy = e.clientY - origin.y;
      if (Math.hypot(dx, dy) <= CLICK_THRESHOLD_PX) {
        onSelect();
      }
    },
    [onSelect],
  );

  const imageUrl = resolveCardImageUrl(card);

  return (
    <div
      ref={ref}
      className={`hs-card hs-card--${card.rarity}${compact ? ' hs-card--compact' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => {
        pointerOrigin.current = null;
        reset();
      }}
      onPointerCancel={() => {
        pointerOrigin.current = null;
        reset();
      }}
      role="button"
      aria-label={`${card.name}, ${card.rarity}. Open details`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onSelect) onSelect();
      }}
      style={compact ? { width: 180 } : undefined}
    >
      <div className="hs-card__face">
        <span className="hs-card__rarity">
          {card.rarity}
          {owned ? ' · owned' : ''}
        </span>
        <div className="hs-card__art">
          {imageUrl ? (
            <img src={imageUrl} alt="" loading="lazy" />
          ) : (
            <span aria-hidden>{RARITY_EMOJI[card.rarity] ?? '🥾'}</span>
          )}
        </div>
        <div className="hs-card__meta">
          <h3 className="hs-card__name">{card.name}</h3>
          <p className="hs-card__district">{card.district}</p>
          <div className="hs-card__stats">
            <span>{card.difficulty}</span>
            <span>{card.distanceKm} km</span>
          </div>
          {!compact && <p className="hs-card__blurb">{card.blurb}</p>}
        </div>
      </div>
      <div className="hs-card__foil" aria-hidden />
    </div>
  );
}
