import { useMemo } from 'react';
import type { User } from 'firebase/auth';
import type { HikeCard, UserDoc } from '../types';
import { HikeCardView } from '../components/HikeCard';

interface Props {
  catalog: HikeCard[];
  user: User | null;
  userData: UserDoc | null;
  onSignIn: () => void;
  firebaseConfigured: boolean;
}

export function Collection({
  catalog,
  user,
  userData,
  onSignIn,
  firebaseConfigured,
}: Props) {
  const owned = useMemo(() => {
    const ids = new Set(userData?.ownedCardIds ?? []);
    return catalog.filter((c) => ids.has(c.id));
  }, [catalog, userData]);

  if (!user) {
    return (
      <section className="hs-page">
        <h1>Your collection</h1>
        <p className="hs-muted">Sign in to save daily draws into a solo collection.</p>
        <button
          type="button"
          className="hs-btn"
          onClick={onSignIn}
          disabled={!firebaseConfigured}
        >
          Sign in with Google
        </button>
      </section>
    );
  }

  return (
    <section className="hs-page">
      <h1>Your collection</h1>
      <p className="hs-muted">
        {owned.length} / {catalog.length} cards owned · solo collection only
      </p>
      {owned.length === 0 ? (
        <p className="hs-empty">Draw today&apos;s cards on the Home tab to start collecting.</p>
      ) : (
        <div className="hs-card-grid">
          {owned.map((c) => (
            <HikeCardView
              key={c.id}
              card={c}
              compact
              owned
              onOpenMaps={() => window.open(c.mapsUrl, '_blank', 'noopener')}
            />
          ))}
        </div>
      )}
    </section>
  );
}
