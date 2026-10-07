# Aziz's Cricket Cloud
1. `npm i && cp .env.example .env` (optional Supabase keys + `supabase/schema.sql`). Default umpire PIN is 1234 (change via the PIN button).
2. Drop a stadium photo at `public/cricket-bg.svg` (included; swap in your own photo by editing `.bg-stadium` in `src/index.css`)
3. `npm run dev` — works fully offline via localStorage; viewer links work on the same device until Supabase is configured.
Viewer links: `/match/view?token=…` and `/series/view?token=…` (SPA rewrite to index.html needed on your host).
Security model: viewers only call two token-scoped RPCs and have no table access; writes need a Supabase session (RLS by owner); the PIN gates the umpire UI on-device.

Umpire PIN: set `VITE_UMPIRE_PIN` in `.env` (default 1234). It is a client-side gate only; real write security comes from Supabase RLS.
Existing Supabase project: re-run `supabase/schema.sql` changes (new `concluded` column, camelCase series RPC).
