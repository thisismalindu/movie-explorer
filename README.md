# Movie Explorer

A React movie browser using TMDb for movie data. It supports weekly trends, submitted search with infinite scrolling, movie details and trailers, encrypted local profiles, favorites, saved search, and per-profile light/dark themes.

## Setup

```sh
npm ci
npx vercel dev
```

Create a TMDb account and obtain an **API Read Access Token** in account API settings. Copy `.env.example` to `.env.local` and set `TMDB_READ_ACCESS_TOKEN`. The Vercel function reads this server-only variable; do not rename it to `REACT_APP_*` or commit the value. Restart `vercel dev` after changing it. `npm start` runs only the CRA frontend and does not provide the API function.

Run `npm test` and `npm run test:api` for automated checks, or `npm run build` for a production build.

## TMDb requests

The browser calls the same-origin `/api/tmdb` function. It allowlists these TMDb operations:

- `/trending/movie/week`
- `/search/movie` with a query and page (1–500)
- `/movie/{id}` with `credits,videos` appended

The function fixes the upstream TMDb host and supplies English results. The browser never receives the bearer token. Frontend code and data are public; the token is server-only.

## Local profiles and limitations

Create a local profile with a username and password, then log in to unlock it. Favorites, the last submitted search, and the theme are encrypted in this browser using PBKDF2 and AES-GCM. Refresh keeps the profile unlocked in the current tab by storing usable key material in `sessionStorage`; this is less protective while the tab session exists, and tab duplication or recovery may retain that session. Explicit logout removes it. The password is never stored. Usernames remain readable storage identifiers. Clearing browser storage deletes profiles; forgotten passwords cannot be recovered. Encryption does not protect an unlocked profile from malicious scripts in the app or prevent offline password guessing. Profiles do not sync between browsers or devices; there is no server authentication or cloud profile storage.

## Vercel deployment

Import the repository into Vercel. Use `npm run build` as the build command, `build` as the output directory, and add `TMDB_READ_ACCESS_TOKEN` as a server environment variable for the deployment environments you use. `vercel.json` routes application URLs to the CRA entry point while leaving API and static asset paths available. After deployment, check `/`, `/favorites`, `/login`, a direct `/movies/{id}` URL, a submitted `/?q=...` search, and `/api/tmdb` with the app.

## Manual verification

- Browse trending movies; search, scroll through pages, clear, and retry a failed request.
- Open a movie directly and from a card; check details, cast, and trailer link.
- Create two profiles, keep separate favorites/search/theme settings, refresh, and log out.
- Open Home, Favorites, Login, a movie URL, a search URL, and an unknown URL directly.
- Use keyboard navigation and form submission; check narrow and desktop widths in both themes.

## Verification record

Automated app tests, proxy tests, and the production build pass. A local browser check covered direct routes, search URL/history, profile creation and refresh restoration, logout, theme persistence, and 360px/1280px widths without horizontal overflow. Live TMDb requests through `vercel dev` could not be checked because the local Vercel CLI requires account login for this unlinked checkout.

## Credits

Movie data and images are provided by TMDb. This product uses the TMDB API but is not endorsed or certified by TMDB.

## Create React App

This project uses Create React App to comply with the assignment's explicit setup requirements. Create React App is deprecated; its use here is an assignment constraint.
