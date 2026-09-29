import { useMemo, useState } from 'react';
import catalogJson from './data/selangor-hikes.json';
import type { HikeCard } from './types';
import { Nav, type Page } from './components/Nav';
import { Home } from './pages/Home';
import { Collection } from './pages/Collection';
import { Catalog } from './pages/Catalog';
import { useAuth } from './hooks/useAuth';
import { useUserData } from './hooks/useUserData';
import './App.css';

const catalog = catalogJson as HikeCard[];

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { user, loading, signIn, signOut, firebaseConfigured } = useAuth();
  const { data, loading: dataLoading, error, ensureTodayDraw } =
    useUserData(user, catalog);

  const ownedIds = useMemo(() => data?.ownedCardIds ?? [], [data]);

  async function handleSignIn() {
    setAuthError(null);
    setSigningIn(true);
    try {
      await signIn();
    } catch (e: unknown) {
      setAuthError(e instanceof Error ? e.message : 'Sign-in failed');
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div className="hs-app">
      <Nav
        page={page}
        onNavigate={setPage}
        user={user}
        firebaseConfigured={firebaseConfigured}
        onSignIn={handleSignIn}
        onSignOut={() => void signOut()}
        signingIn={signingIn}
      />
      <main className="hs-main">
        {(loading || dataLoading) && <p className="hs-muted">Loading…</p>}
        {authError && <p className="hs-error">{authError}</p>}
        {error && <p className="hs-error">{error}</p>}
        {page === 'home' && (
          <Home
            catalog={catalog}
            user={user}
            userData={data}
            onSignIn={handleSignIn}
            onDraw={ensureTodayDraw}
            firebaseConfigured={firebaseConfigured}
          />
        )}
        {page === 'collection' && (
          <Collection
            catalog={catalog}
            user={user}
            userData={data}
            onSignIn={handleSignIn}
            firebaseConfigured={firebaseConfigured}
          />
        )}
        {page === 'catalog' && (
          <Catalog catalog={catalog} ownedIds={ownedIds} />
        )}
      </main>
      <footer className="hs-footer">
        <span>
          Card foil/tilt techniques adapted from{' '}
          <a
            href="https://github.com/simeydotme/pokemon-cards-css"
            target="_blank"
            rel="noreferrer"
          >
            simeydotme/pokemon-cards-css
          </a>
        </span>
        <span>· HikeSeeker · Selangor v1</span>
      </footer>
    </div>
  );
}
