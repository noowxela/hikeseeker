import { useEffect, useMemo, useRef, useState } from 'react';

const COLS = 8;
const ROWS = 12;
const TILE_COUNT = COLS * ROWS;

/** Scrambled tile palette — trail / foil vibes, not the real art. */
const TILE_COLORS = [
  '#1a3d2c',
  '#2d6a4f',
  '#40916c',
  '#52b788',
  '#0d2818',
  '#3a5f4a',
  '#1b4332',
  '#74c69d',
  '#081c15',
  '#95d5b2',
  '#2b4a3a',
  '#d8f3dc',
];

function shuffleIndices(n: number, seed: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  let s = seed >>> 0 || 1;
  for (let i = n - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface Props {
  /** When true, start dissolving tiles. */
  active: boolean;
  /** Faster dissolve when prefers-reduced-motion. */
  reducedMotion?: boolean;
  /** Stable-ish seed so remounts of the same card look consistent. */
  seed?: number;
  onComplete: () => void;
}

/**
 * Pixelated / scrambled grid overlay that dissolves randomly
 * (chunk-by-chunk) until the real card face shows through.
 */
export function MosaicOverlay({
  active,
  reducedMotion = false,
  seed = 1,
  onComplete,
}: Props) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const order = useMemo(() => shuffleIndices(TILE_COUNT, seed), [seed]);
  const colors = useMemo(
    () =>
      Array.from({ length: TILE_COUNT }, (_, i) => {
        const s = (seed * 7919 + i * 104729) >>> 0;
        return TILE_COLORS[s % TILE_COLORS.length];
      }),
    [seed],
  );

  const [cleared, setCleared] = useState<Set<number>>(() => new Set());
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active || done) return;

    if (reducedMotion) {
      setCleared(new Set(order));
      setDone(true);
      const t = window.setTimeout(() => onCompleteRef.current(), 80);
      return () => window.clearTimeout(t);
    }

    const chunkSize = 3;
    let step = 0;
    const intervalMs = 42;

    const id = window.setInterval(() => {
      step += 1;
      const end = Math.min(step * chunkSize, TILE_COUNT);
      setCleared(new Set(order.slice(0, end)));
      if (end >= TILE_COUNT) {
        window.clearInterval(id);
        setDone(true);
        window.setTimeout(() => onCompleteRef.current(), 120);
      }
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [active, done, reducedMotion, order]);

  if (done && cleared.size >= TILE_COUNT) {
    return null;
  }

  return (
    <div
      className="hs-mosaic"
      aria-hidden
      style={{
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
      }}
    >
      {colors.map((color, i) => (
        <span
          key={i}
          className={`hs-mosaic__tile${cleared.has(i) ? ' is-gone' : ''}`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
