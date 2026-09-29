import type { User } from 'firebase/auth';

export type Page = 'home' | 'collection' | 'catalog';

interface Props {
  page: Page;
  onNavigate: (p: Page) => void;
  user: User | null;
  firebaseConfigured: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  signingIn?: boolean;
}

export function Nav({
  page,
  onNavigate,
  user,
  firebaseConfigured,
  onSignIn,
  onSignOut,
  signingIn,
}: Props) {
  return (
    <header className="hs-nav">
      <div className="hs-nav__brand">
        <span className="hs-nav__logo" aria-hidden>
          🥾
        </span>
        <div>
          <strong>HikeSeeker</strong>
          <span className="hs-nav__tag">Selangor daily draws</span>
        </div>
      </div>
      <nav className="hs-nav__links" aria-label="Main">
        {(
          [
            ['home', 'Today'],
            ['collection', 'Collection'],
            ['catalog', 'Catalog'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={page === id ? 'is-active' : ''}
            onClick={() => onNavigate(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="hs-nav__auth">
        {!firebaseConfigured && (
          <span className="hs-nav__hint" title="Add VITE_FIREBASE_* in .env.local">
            Firebase not configured
          </span>
        )}
        {user ? (
          <>
            <span className="hs-nav__user">
              {user.displayName ?? user.email ?? 'Signed in'}
            </span>
            <button type="button" className="hs-btn hs-btn--ghost" onClick={onSignOut}>
              Sign out
            </button>
          </>
        ) : (
          <button
            type="button"
            className="hs-btn"
            onClick={onSignIn}
            disabled={!firebaseConfigured || signingIn}
          >
            {signingIn ? 'Signing in…' : 'Sign in with Google'}
          </button>
        )}
      </div>
    </header>
  );
}
