# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` — install dependencies.
- `npm run dev` — start the Express + Vite development server (`tsx server.ts`); default port is 3000 unless `PORT` is set.
- `npm run build` — create the production frontend bundle in `dist/`.
- `npm run preview` — serve the Vite production bundle for local inspection.
- `npm run lint` — run TypeScript type-checking (`tsc --noEmit`); despite the script name, this is not an ESLint run.
- There is no test script or configured test runner in `package.json`.

## Architecture and data flow

This is a React 19 + TypeScript single-page site built with Vite and Tailwind CSS 4. `index.html` loads `src/main.tsx`, which mounts `src/App.tsx`. App owns the site-wide content state and language/page state, then passes content and callbacks into page sections and admin UI. The app uses History API navigation with path/query parsing inside `App.tsx`, rather than React Router.

Persistent content is represented by `SiteContent` in `src/types/index.ts`, with defaults in `src/data/initialData.ts`. `src/utils/storage.ts` is the key content boundary: it loads/saves a browser localStorage copy and attempts to synchronize with the server via `/api/site-data`; startup fetches remote data and falls back to static `/site-data.json`. Content changes flow from admin editing callbacks through `App.tsx` to `saveSiteContent`. When changing persistence behavior, inspect both this utility and the corresponding API implementation in `server.ts`, plus the deployment data files (`site-data.json` and `public/site-data.json`).

`server.ts` is the Express backend and development entry point. It provides API endpoints and file-backed data/configuration, serves/proxies media, and in production serves `dist`. The local JSON files are runtime data stores; deploy environments must provide writable persistent storage and route API requests to this server for admin edits to survive refreshes/devices. A static-only deployment can serve the frontend and fallback JSON but cannot persist API updates.

The UI is organized as route/page sections in `src/components/`; `AdminStudioModal.tsx` is the editing surface, while `AdminAnalyticsTab.tsx` and `src/utils/analytics.ts` handle analytics. Shared integrations live under `src/utils/` (storage, Supabase, GitHub media, Telegram, analytics, translation, and crypto). `vite.config.ts` configures React and Tailwind plugins, the `@` root alias, and optional HMR disabling through `DISABLE_HMR=true`.

## Repository notes

- No README, Cursor rules, Copilot instructions, or existing repository-level `CLAUDE.md` were present when this file was created.
- `ARCHITECTURE_REPORT.md` documents the intended architecture and deployment model; verify details against implementation when editing, since documentation can drift.
- The current `server.ts` should be validated before relying on it: the opening section appears to contain malformed/incomplete middleware and logger setup. Run `npm run lint` and `npm run dev` to establish the current baseline before attributing failures to later changes.
- `npm run clean` uses Unix `rm -rf` and may not work in Windows PowerShell; avoid it there or use an equivalent deliberate cleanup command.
