import type { HikeCard } from '../types';

/** Simple string hash → 32-bit unsigned. */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG. */
function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic daily draw of `count` unique cards for a KL calendar date. */
export function drawForDate(
  catalog: HikeCard[],
  dateYYYYMMDD: string,
  count = 3,
): HikeCard[] {
  if (catalog.length === 0) return [];
  const n = Math.min(count, catalog.length);
  const rand = mulberry32(hashSeed(`hikeseeker:${dateYYYYMMDD}`));
  const pool = [...catalog];
  // Fisher–Yates partial shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}
