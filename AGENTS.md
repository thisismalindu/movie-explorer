# Working rules

## Task and Git workflow
- This is a frontend-only Movie Explorer assignment, starting from a fresh Create React App app.
- Follow the stages in C:/Users/malindu/repos/movie-explorer-docs/README.md.
- Work on only the single commit-sized task the user requests. Stop when it is implemented and sufficiently verified; do not advance to another task.
- When asked to plan, produce a short plan without editing. Implement when the user asks to execute it. The user selects the model, including Luna; do not switch models or delegate independently.
- The user creates branches, commits, pushes, and publishes. Do not perform those actions. A branch may contain several focused single-task commits.
- Inspect only files relevant to the current task. Preserve unrelated work. Report changed files, verification, and any limitation briefly.

## Keep the implementation small
- Use JavaScript and Create React App. Retain CRA and explain its deprecation and assignment requirement in the app README.
- Write the minimum readable code needed for the requested behavior. Prefer clear names and direct functions over abstractions, cleverness, or compressed syntax.
- Add dependencies and files only when their feature needs them. Use libraries for substantial existing functionality; avoid duplicate state or overlapping libraries.
- Use standard MUI components and default styling for the core. Custom styling, animations, and optional features come later. Basic responsiveness, labels, keyboard usability, and required light/dark switching remain part of the core.
- Avoid generic service/repository layers, unnecessary hooks, component wrappers, speculative edge cases, and broad refactors. Comment decisions that need explanation.

## Required functionality and ownership
- Use Axios for TMDb requests, React Router for navigation, and Redux Toolkit with RTK Query for movie data. Use React Intersection Observer for infinite search scrolling.
- RTK Query owns fetched data. Redux owns active-profile favorites and preferences. Components own temporary input. The URL owns the submitted search query.
- Include trending movies, submitted search with infinite scrolling, movie details and trailer links, favorites, last-search persistence, and light/dark mode.
- Handle ordinary loading, empty, API-error, missing-poster, and missing-trailer states. Preserve loaded results when the next page fails.
- Use a small app/components/features structure as needed. Keep movie, favorite, and profile code together by feature; do not pre-create empty architecture.

## Local profiles
- No Supabase, backend, cloud database, or cloud profile storage. Login unlocks a password-encrypted local profile.
- Normalize usernames by trimming and lowercasing; never trim or otherwise modify passwords. Use the username to locate the profile and the password to derive its key.
- Use browser Web Crypto: PBKDF2/SHA-256 with 600,000 iterations and a random 16-byte salt per profile; AES-GCM with a 256-bit key and fresh random 12-byte IV for every save.
- Store a versioned record with salt, derivation parameters, IV, and ciphertext. Encrypt one payload containing favorite movie summaries, last submitted search, and theme preference.
- Keep the non-extractable key in the session provider's memory, outside Redux. Never persist passwords or encryption keys. Clear password inputs after use. Refresh requires unlocking again.
- Serialize saves. Finish pending persistence before logout clears the key and profile state. Display save failures; never overwrite data after failed decryption.
- Allow public browsing/search; saving favorites requires an unlocked profile. Before login use MUI light mode. Restore profile preferences on unlock; an explicit URL query takes precedence over saved search.
- Explain in the app README and profile creation UI that data exists only in this browser, clearing storage deletes it, and forgotten passwords cannot be recovered. Do not claim server authentication or protection against malicious scripts in an unlocked app or offline password guessing.
- Password recovery/change, cross-device sync, and simultaneous multi-tab editing are outside the core scope.

## Verification and documentation
- Verify the current task with proportionate checks. Run a production build at meaningful milestones. Broader automated testing follows the core, not every small UI edit.
- Verify encryption round trips, incorrect passwords, tampering, fresh IVs, profile isolation, and save ordering when implementing those modules.
- Keep real local configuration out of Git; document placeholders in .env.example. Frontend environment variables are visible in the browser bundle, not secret storage.
- Keep the app README short and current: setup, API usage, features, CRA disclaimer, local-profile limitations, and deployment instructions. Include TMDb attribution in the app.
- Do not add the assignment PDF to the repository. Use GitLab and Netlify for the intended handoff; the user performs publishing.
