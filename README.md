# Movie Explorer

Movie Explorer browses trending movies, searches TMDb with infinite scrolling, and shows movie details, cast, and trailer links. Movie data is provided by TMDb.

## Setup

```sh
npm ci
npm start
```

Run `npm test` for tests and `npm run build` to create a production build.

## TMDb API setup

Create a TMDb account and obtain an API Read Access Token from your account's API settings. Copy `.env.example` to `.env.local` and set `TMDB_READ_ACCESS_TOKEN`. This is server-only and must be configured in Vercel's environment settings for deployment. Never add a `REACT_APP_` prefix to a secret.

Run `npm start` for the CRA frontend alone. Run `npx vercel dev` to test the frontend with the `/api/tmdb` function locally. Set the server token in Vercel's local environment before using the function.

## Create React App

This project uses Create React App to comply with the assignment's explicit setup requirements. Create React App is deprecated; its use here is an assignment constraint.

## Local profiles

Create a profile or log in with a username and password to unlock encrypted data stored in this browser. Refreshing locks the profile again. Usernames are visible storage identifiers; passwords are never stored. Clearing browser storage deletes profiles, and forgotten passwords cannot be recovered. Encryption does not protect an unlocked profile from malicious app scripts or prevent offline password guessing. No server authentication or cloud storage is used.

## Implemented browsing features

- Weekly trending movies from `/trending/movie/week`.
- Movie search from `/search/movie`, including paginated results.
- Movie details, credits, and videos from `/movie/{id}?append_to_response=credits,videos`.
- Local profile creation, login, and logout using browser encryption.
- Per-profile favorite movies, last submitted search, and light/dark theme preference.
- Saved search restores once after login; an explicit URL query takes precedence.
