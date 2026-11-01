# Cloudflare Pages Functions setup

The production site uses the Cloudflare Pages Functions in `functions/`. Keep the existing Express server available during preview and cutover; Pages does not run `server.ts`.

## Cloudflare resources and bindings

1. In the Cloudflare account serving the Pages project, create a D1 database named `sina-site-data` and an R2 bucket named `sina-site-images`.
2. Replace `REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID` in `wrangler.toml` with the actual D1 database ID. Keep the binding names `DB` and `MEDIA` unchanged in local, preview, and production environments.
3. Apply the schema with `npx wrangler d1 migrations apply sina-site-data --remote`.
4. Enable public delivery for the R2 bucket through a dedicated media custom domain (recommended). Set the Pages variable `MEDIA_PUBLIC_URL` to that HTTPS origin, without a trailing slash. Do not make the bucket broadly writable.
5. Set these **Secrets** in the Pages project's production and preview environments (and local `.dev.vars` when needed):
   - `ADMIN_INITIAL_PASSCODE`: a new, unique password with at least 8 characters. It is used only to bootstrap the first D1 credential; after the first successful login and a password change, remove this Secret.
   - `ADMIN_SESSION_SECRET`: a stable random secret of at least 32 bytes, used to sign HttpOnly admin sessions.
   - `GEMINI_API_KEY`: Gemini server-side API key.
   - `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`: optional notification integration; keep the bot token out of all client bundles. The old frontend source contained a bot token, so revoke/rotate that token with BotFather before enabling this integration, then set only the replacement as a Cloudflare Secret.
   - `GITHUB_TOKEN`: optional least-privilege token for updating the repository's `site-data.json` only.
6. Set the Pages variable `GITHUB_REPOSITORY` to `szarghami/sinazarghami-aistudio-site` only if GitHub sync is wanted. The API ignores client-supplied repository, path, and token values.
7. Keep the Pages build command as `npm run build` and output directory as `dist`. The Functions directory is at the repository root and must be included in the Pages deployment.

## Local development

- Copy `.dev.vars.example` to `.dev.vars` and replace the placeholder values. `.dev.vars` is git-ignored.
- Create a local database/bucket binding as needed, then run `npx wrangler d1 migrations apply sina-site-data --local`.
- Run `npm run pages:dev` to build and serve through the Pages runtime. This differs from `npm run dev`, which starts the legacy Express server.
- Before integrating an admin change, log in with `ADMIN_INITIAL_PASSCODE`, publish site content once (which stores it in D1), then change the password in the admin panel. The passcode is stored as a salted PBKDF2 hash in D1; the session is an HttpOnly, Secure, SameSite=Strict cookie.

## Data and migration notes

- On first read, `/api/site-data` falls back to the static `/site-data.json` asset. The first authenticated admin publish writes the complete content to D1. Confirm that file is current before the first publish and retain a backup.
- The browser no longer receives the admin passcode, Telegram bot token, or GitHub token. Existing localStorage passcodes and tokens are intentionally not imported.
- New admin image uploads use R2 and require `MEDIA_PUBLIC_URL`; existing absolute image URLs remain unchanged. On the first authenticated site-data publish, valid embedded JPEG/PNG/WebP data URLs in the submitted content are migrated into R2 and replaced with their public URLs before D1 persistence. Back up site content first and verify the public R2 domain before that publish.
- Videos remain URL/embed-only. Video upload and transcoding are not part of this migration.
- Analytics events are rate-limited and retained for 180 days. Analytics summary/report endpoints require the admin session.
- `npm run lint` currently reports parse errors throughout the pre-existing `server.ts`; use `npm run lint:pages` to type-check the new Functions independently while that legacy baseline is unresolved.

## Rollback

Do not remove `server.ts` until Cloudflare preview testing confirms the required admin flows and production data has been backed up. If the new Pages Functions are not ready, leave the production Pages deployment on its previous release and restore the prior client bundle; do not point production writes to an uninitialized D1 database.