import { useMemo, useState } from 'react';
import catalogJson from './data/selangor-hikes.json';
import type { HikeCard } from './types';
import { Nav, type Page } from './components/Nav';
import { HikeDetailModal } from './components/HikeDetailModal';
import { Home } from './pages/Home';
import { Collection } from './pages/Collection';
import { Catalog } from './pages/Catalog';
import { useAuth } from './hooks/useAuth';
import { useUserData } from './hooks/useUserData';
import './App.css';

const catalog = catalogJson as HikeCard[];

function LoadingShell() {
  return (
    <div className="hs-loading" role="status" aria-live="polite" aria-label="Loading">
      <span className="hs-skeleton hs-skeleton--lg" />
      <span className="hs-skeleton hs-skeleton--md" />
      <span className="hs-skeleton hs-skeleton--sm" />
      <div className="hs-skeleton-cards" aria-hidden>
        <span className="hs-skeleton-card" />
        <span className="hs-skeleton-card" />
        <span className="hs-skeleton-card" />
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<HikeCard | null>(null);
  const { user, loading, signIn, signOut, firebaseConfigured } = useAuth();
  const { data, loading: dataLoading, error, ensureTodayDraw } =
    useUserData(user, catalog);

  const ownedIds = useMemo(() => data?.ownedCardIds ?? [], [data]);
  const bootLoading = loading || dataLoading;

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
      <a className="hs-skip" href="#main">
        Skip to content
      </a>
      <div className="hs-grain" aria-hidden />
      <Nav
        page={page}
        onNavigate={setPage}
        user={user}
        firebaseConfigured={firebaseConfigured}
        onSignIn={handleSignIn}
        onSignOut={() => void signOut()}
        signingIn={signingIn}
      />
      <main id="main" className="hs-main">
        {bootLoading && <LoadingShell />}
        {authError && <p className="hs-error">{authError}</p>}
        {error && <p className="hs-error">{error}</p>}
        {!bootLoading && page === 'home' && (
          <Home
            catalog={catalog}
            user={user}
            userData={data}
            onSignIn={handleSignIn}
            onDraw={ensureTodayDraw}
            firebaseConfigured={firebaseConfigured}
            onSelectCard={setSelectedCard}
          />
        )}
        {!bootLoading && page === 'collection' && (
          <Collection
            catalog={catalog}
            user={user}
            userData={data}
            onSignIn={handleSignIn}
            firebaseConfigured={firebaseConfigured}
            onSelectCard={setSelectedCard}
          />
        )}
        {!bootLoading && page === 'catalog' && (
          <Catalog
            catalog={catalog}
            ownedIds={ownedIds}
            onSelectCard={setSelectedCard}
          />
        )}
      </main>
      <footer className="hs-footer">
        <span>
          Card foil adapted from{' '}
          <a
            href="https://github.com/simeydotme/pokemon-cards-css"
            target="_blank"
            rel="noreferrer"
          >
            simeydotme/pokemon-cards-css
          </a>
        </span>
        <span>HikeSeeker · Selangor trails</span>
      </footer>
      <HikeDetailModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
}
