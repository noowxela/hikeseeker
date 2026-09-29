import { useEffect, useCallback } from 'react';
import type { HikeCard } from '../types';

interface Props {
  card: HikeCard | null;
  onClose: () => void;
}

function embedSrc(card: HikeCard): string {
  const q = encodeURIComponent(`${card.name} ${card.district}`);
  return `https://www.google.com/maps?q=${q}&output=embed`;
}

export function HikeDetailModal({ card, onClose }: Props) {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!card) return;
    document.addEventListener('keydown', onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [card, onKeyDown]);

  if (!card) return null;

  return (
    <div
      className="hs-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="hs-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hs-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="hs-modal__header">
          <div>
            <p className="hs-modal__rarity">{card.rarity}</p>
            <h2 id="hs-modal-title">{card.name}</h2>
            <p className="hs-modal__district">{card.district}</p>
          </div>
          <button
            type="button"
            className="hs-btn hs-btn--ghost hs-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="hs-modal__map">
          <iframe
            title={`Map of ${card.name}`}
            src={embedSrc(card)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>

        <div className="hs-modal__body">
          <div className="hs-modal__stats">
            <span>{card.difficulty}</span>
            <span>{card.distanceKm} km</span>
          </div>
          <p className="hs-modal__blurb">{card.blurb}</p>
        </div>

        <footer className="hs-modal__footer">
          <a
            className="hs-btn hs-btn--primary"
            href={card.mapsUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps →
          </a>
          <button type="button" className="hs-btn" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
