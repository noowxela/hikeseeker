import { useMemo, useState } from 'react';
import type { HikeCard, Rarity } from '../types';
import { HikeCardView } from '../components/HikeCard';

interface Props {
  catalog: HikeCard[];
  ownedIds: string[];
}

const RARITIES: Array<Rarity | 'all'> = [
  'all',
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];

export function Catalog({ catalog, ownedIds }: Props) {
  const [q, setQ] = useState('');
  const [rarity, setRarity] = useState<Rarity | 'all'>('all');
  const owned = useMemo(() => new Set(ownedIds), [ownedIds]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return catalog.filter((c) => {
      if (rarity !== 'all' && c.rarity !== rarity) return false;
      if (!needle) return true;
      return (
        c.name.toLowerCase().includes(needle) ||
        c.district.toLowerCase().includes(needle) ||
        c.blurb.toLowerCase().includes(needle)
      );
    });
  }, [catalog, q, rarity]);

  return (
    <section className="hs-page">
      <h1>Catalog</h1>
      <p className="hs-muted">
        Browse all Selangor v1 spots. Signed-out users can preview; ownership comes from daily
        draws.
      </p>
      <div className="hs-filters">
        <input
          type="search"
          placeholder="Search name or district…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search catalog"
        />
        <select
          value={rarity}
          onChange={(e) => setRarity(e.target.value as Rarity | 'all')}
          aria-label="Filter by rarity"
        >
          {RARITIES.map((r) => (
            <option key={r} value={r}>
              {r === 'all' ? 'All rarities' : r}
            </option>
          ))}
        </select>
      </div>
      <p className="hs-muted">{filtered.length} shown</p>
      <div className="hs-card-grid">
        {filtered.map((c) => (
          <HikeCardView
            key={c.id}
            card={c}
            compact
            owned={owned.has(c.id)}
            onOpenMaps={() => window.open(c.mapsUrl, '_blank', 'noopener')}
          />
        ))}
      </div>
    </section>
  );
}
