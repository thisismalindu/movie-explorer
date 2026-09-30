# Movie Explorer

Movie Explorer browses trending movies, searches TMDb with infinite scrolling, and shows movie details, cast, and trailer links. Movie data is provided by TMDb.

## Setup

```sh
npm ci
npm start
```

Run `npm test` for tests and `npm run build` to create a production build.

## TMDb API setup

Create a TMDb account and obtain an API Read Access Token from your account's API settings. Copy `.env.example` to `.env.local`, add the token to `REACT_APP_TMDB_READ_ACCESS_TOKEN`, and restart the development server. CRA embeds frontend environment variables in the browser bundle, so this token is visible to app users; it is not a server-side secret.

## Create React App

This project uses Create React App to comply with the assignment's explicit setup requirements. Create React App is deprecated; its use here is an assignment constraint.

## Local profiles

Create a profile or log in with a username and password to unlock encrypted data stored in this browser. Refreshing locks the profile again. Usernames are visible storage identifiers; passwords are never stored. Clearing browser storage deletes profiles, and forgotten passwords cannot be recovered. Encryption does not protect an unlocked profile from malicious app scripts or prevent offline password guessing. Favorites and preference controls are planned; no server authentication or cloud storage is used.

## Implemented browsing features

- Weekly trending movies from `/trending/movie/week`.
- Movie search from `/search/movie`, including paginated results.
- Movie details, credits, and videos from `/movie/{id}?append_to_response=credits,videos`.
- Local profile creation, login, and logout using browser encryption.
