# HikeSeeker

Daily hiking-spot card draws for **Selangor**. Vite + React + TypeScript, Firebase Auth (Google) + Firestore, foil/tilt cards, Vercel-ready.

One draw of **3 unique** trail cards per **Asia/Kuala_Lumpur** calendar day. Reopening the same day shows the same draw. Solo collection only.

## Features (v1)

- Home: draw / view today’s 3 cards
- Collection: cards you’ve unlocked via daily draws
- Catalog: browse ~25 Selangor spots (signed-out OK)
- Sign in with Google to save draws to Firestore
- Card foil & tilt UI adapted from [simeydotme/pokemon-cards-css](https://github.com/simeydotme/pokemon-cards-css) techniques (CSS transforms, gradients, blend-modes)
- Tap a card for an in-app detail panel (Google Maps embed + trail info)
- Optional Maps Static API thumbnails when `VITE_GOOGLE_MAPS_API_KEY` is set

Deferred ideas live in [`docs/later.md`](docs/later.md).

## Quick start

```bash
npm install
cp .env.example .env.local
# fill VITE_FIREBASE_* (see below)
npm run dev
```

```bash
npm run build   # must pass
npm run preview
```

## Firebase setup

1. Create a project in [Firebase Console](https://console.firebase.google.com).
2. Enable **Authentication → Sign-in method → Google**.
3. Create a **Web** app and copy the config into `.env.local`:

   | Env var | Firebase field |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

4. Enable **Cloud Firestore** (production or test mode while developing).
5. Suggested document shape: `users/{uid}`

   ```json
   {
     "ownedCardIds": ["broga-hill", "bukit-gasing"],
     "lastDrawDate": "2026-09-29",
     "lastDrawIds": ["broga-hill", "bukit-tabur", "frim-kepong"],
     "displayName": "Alex",
     "email": "you@example.com",
     "updatedAt": "2026-09-29T04:00:00.000Z"
   }
   ```

6. **Authorized domains**: Authentication → Settings → Authorized domains  
   Add `localhost`, your Vercel domain (e.g. `hikeseeker.vercel.app`), and any custom domain.

### Example Firestore rules (tighten before production)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

> This repo ships **placeholders only** (`.env.example`). No real API keys are committed.

### Optional: Google Maps Static API (card thumbnails)

Set `VITE_GOOGLE_MAPS_API_KEY` in `.env.local` (and Vercel env) to show hybrid map images on cards. Enable **Maps Static API** in Google Cloud, restrict the key by **HTTP referrer**, and leave blank to keep the rarity emoji fallback. The detail modal embed works without this key.

## Vercel deploy

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. Framework preset: **Vite**. Build: `npm run build`, output: `dist`.
3. Add the same `VITE_FIREBASE_*` env vars (and optional `VITE_GOOGLE_MAPS_API_KEY`) in Project → Settings → Environment Variables.
4. Redeploy after env changes.
5. Add the Vercel domain to Firebase Auth authorized domains.

`vercel.json` includes SPA rewrites to `index.html`.

## Catalog

Data: [`src/data/selangor-hikes.json`](src/data/selangor-hikes.json)

Each entry: `id`, `name`, `district`, `difficulty`, `distanceKm`, `mapsUrl`, `rarity`, `blurb`, optional `imageUrl`.

## Attribution

- Holofoil / tilt presentation inspired by [simeydotme/pokemon-cards-css](https://github.com/simeydotme/pokemon-cards-css) (Simon Goellner). HikeSeeker vendors adapted CSS under `src/styles/pokemon-foil.css`, not a verbatim dump of that repo’s assets. Rarity map: common/uncommon → Common & Uncommon glare; rare → Amazing Rare; epic → VMax; legendary → Trainer Gallery Holofoil ([demo](https://poke-holo.simey.me)).
- Trail blurbs are informal summaries for discovery — always check local permits, weather, and park rules before hiking.

## License

App code: MIT (unless noted otherwise). Pokémon is a trademark of its owners; this project is unrelated to The Pokémon Company.
