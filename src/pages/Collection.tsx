import { useMemo } from 'react';
import type { User } from 'firebase/auth';
import { Mountains, SignIn } from '@phosphor-icons/react';
import type { HikeCard, UserDoc } from '../types';
import { HikeCardView } from '../components/HikeCard';

interface Props {
  catalog: HikeCard[];
  user: User | null;
  userData: UserDoc | null;
  onSignIn: () => void;
  firebaseConfigured: boolean;
  onSelectCard: (card: HikeCard) => void;
}

export function Collection({
  catalog,
  user,
  userData,
  onSignIn,
  firebaseConfigured,
  onSelectCard,
}: Props) {
  const owned = useMemo(() => {
    const ids = new Set(userData?.ownedCardIds ?? []);
    return catalog.filter((c) => ids.has(c.id));
  }, [catalog, userData]);

  if (!user) {
    return (
      <section className="hs-page">
        <h1>Your collection</h1>
        <p className="hs-page-lead">
          Sign in to save daily draws into a solo collection.
        </p>
        <div className="hs-empty">
          <span className="hs-empty__icon" aria-hidden>
            <SignIn size={22} weight="duotone" />
          </span>
          <p className="hs-empty__title">Collection locked</p>
          <p className="hs-empty__body">
            Google sign-in keeps your trail cards across devices.
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
      </section>
    );
  }

  return (
    <section className="hs-page">
      <h1>Your collection</h1>
      <div className="hs-progress">
        <span className="hs-progress__num">
          {owned.length}/{catalog.length}
        </span>
        <span className="hs-progress__label">cards owned · solo collection</span>
      </div>
      {owned.length === 0 ? (
        <div className="hs-empty">
          <span className="hs-empty__icon" aria-hidden>
            <Mountains size={22} weight="duotone" />
          </span>
          <p className="hs-empty__title">Trail bag is empty</p>
          <p className="hs-empty__body">
            Draw today&apos;s cards on the Today tab to start collecting.
          </p>
        </div>
      ) : (
        <div className="hs-card-grid">
          {owned.map((c) => (
            <HikeCardView
              key={c.id}
              card={c}
              compact
              owned
              onSelect={() => onSelectCard(c)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
