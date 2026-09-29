import type { HikeCard } from '../types';

/**
 * Prefer an explicit card.imageUrl; otherwise build a Maps Static API hybrid
 * thumbnail when VITE_GOOGLE_MAPS_API_KEY is set. Returns undefined so callers
 * can fall back to rarity emoji.
 */
export function resolveCardImageUrl(card: HikeCard): string | undefined {
  if (card.imageUrl) return card.imageUrl;

  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return undefined;

  const center = encodeURIComponent(
    `${card.name}, ${card.district}, Selangor, Malaysia`,
  );
  return `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=13&size=480x320&scale=2&maptype=hybrid&key=${key}`;
}
