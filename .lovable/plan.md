# Plan: Replace Meta with "Таблица матчапов" + data pipeline overhaul

## 1. Remove Meta section entirely

- Delete `src/pages/MetaTracker.tsx` and `src/components/meta/*` (MetaChart, MetaTierList, MetaAIInsights, DeckComparison).
- Delete edge function `supabase/functions/meta-ai-insights`.
- Remove `/meta` route from `src/App.tsx`.
- Remove Meta nav link from `src/components/ManaLensNavbar.tsx`.
- Remove the Meta feature card on `src/pages/Landing.tsx` and related translation keys (`landing.metaTitle/Desc`, `nav.meta`, all `meta.*` keys) in `src/i18n/translations.ts`.

## 2. Add new "Таблица матчапов" section

- New route `/matchups` in `src/App.tsx` → new page `src/pages/MatchupTable.tsx`.
- Navbar: replace Meta link with **Таблица матчапов** (icon: `Table2`/`Grid3x3`).
- Landing: replace Meta card with Matchup Table card pointing to `/matchups`.
- Page layout follows hsguru.com/matchups:
  - Top filter bar: **Rank** (`all` / `legend` / `top_1k`), **Period** (current patch default), **Min Archetype Sample** (games per archetype), **Min Matchup Sample** (games per matchup cell), class filter.
  - Summary strip: total games, number of archetypes, average meta WR, most popular / highest WR archetype.
  - Main table (sticky header + first column): rows = archetypes (name + class color + total games + popularity% + overall WR), cols = opponents, cells = WR% + small games count below. Cells with games < min-matchup show `—` with tooltip "Games < N". Sortable by any column header.
  - WR cells color-coded (green/yellow/red) as on hsguru.

## 3. Data pipeline — rebuild

### Schema changes (migration)

Current tables keep one row per date. We need to segment by **rank** and **period**. New columns (migration):

- `matchups`: add `rank text not null default 'legend'`, `period text not null default 'current'`.
- `archetype_stats`: add `rank text`, `period text`, `hs_class text`, keep `total_games` / `popularity`.
- Wipe existing rows: `DELETE FROM matchups; DELETE FROM archetype_stats;` (per user: "удали все данные по архетипам").
- Indexes on `(date, rank, period)` for both tables.

### Rewrite `scrape-hsguru` edge function

- Fetch **three** hsguru URLs per run, each with `min_archetype_sample=1&min_matchup_sample=1&period=patch_35.0.3`:
  - `rank=all`
  - `rank=legend`
  - `rank=top_legend` (saved as `top_1k`)
- Parse each page's table the same way (popularity row + total games cell + matchup cells with WR and game counts).
- Store with the correct `rank` value; patch/period stored in `period` column (auto-detect from response or config).
- Admin panel "sync" button triggers this.

### Rewrite `get-matchups` edge function

- Accept `rank` and `period` query params (defaults: `all` / latest).
- Return matchups + archetype stats filtered by those. No client-side rank filtering.

## 4. Hook and strategist refactor

### `src/hooks/useMatchupData.ts`

- Accept `{ rank, period }` args.
- Refetch on change. Expose `archetypeGames`, `gamesDB` (per-cell games), `hsClass` per archetype from DB (drop the `staticClassMap` fallback for class — use DB `hs_class`).
- Drop fallback to `src/data/matchups.ts` static archetype list (per user: remove static archetype data). Keep static file only for historical `banStrategy` helpers if still referenced; otherwise delete.

### `src/pages/TournamentStrategist.tsx`

- Remove all current `minMatchupGames` / `minArchetypeGames` Select blocks and replace with a **three-filter bar**:
  - **Rank**: `all` (default) / `legend` / `top_1k`
  - **Min Archetype Games**: dropdown (50, 100, 250, 500, 1k, 2.5k, 5k, 10k) — filters selectable deck list
  - **Min Matchup Games**: dropdown (same scale) — applied in `getWinrate`; when a cell's games < threshold, final ban table shows `—` with tooltip `Matchup Games < N`.
- `useMatchupData({ rank })` drives both the dropdown options and the matrix.
- Clear stale selections when rank/archetype filter excludes them (existing effect already handles this).

## 5. Optional UX unification

Not merging Strategist and Matchup Table into one page — keep them separate for clarity, but both consume the same `useMatchupData` + shared filter component `src/components/matchups/MatchupFilters.tsx` (Rank + Min Archetype + Min Matchup) so behavior stays consistent.

## 6. Translations

- Remove `meta.*` and `nav.meta`, `landing.metaTitle`, `landing.metaDesc`.
- Add new keys across all 8 languages: `nav.matchups`, `matchups.title`, `matchups.subtitle`, `matchups.rank`, `matchups.rankAll`, `matchups.rankLegend`, `matchups.rankTop1k`, `matchups.minArchetype`, `matchups.minMatchup`, `matchups.totalGames`, `matchups.avgWr`, `matchups.gamesBelowThreshold`, `landing.matchupsTitle`, `landing.matchupsDesc`, `tournament.rank`.

## Technical notes

- Static archetype data: `src/data/matchups.ts` will be shrunk to just class→color mapping (or deleted entirely if the DB supplies `hs_class`). `banStrategy.ts` takes `getWinrate` callback so it stays intact.
- No change to auth, roles, RLS (both tables stay publicly readable, writes via service role in edge function).
- Admin page keeps the "Sync" button; after refactor it triggers three fetches sequentially.

## Files

Create: `src/pages/MatchupTable.tsx`, `src/components/matchups/MatchupFilters.tsx`, `src/components/matchups/MatchupGrid.tsx`.
Edit: `src/App.tsx`, `src/components/ManaLensNavbar.tsx`, `src/pages/Landing.tsx`, `src/pages/TournamentStrategist.tsx`, `src/hooks/useMatchupData.ts`, `src/i18n/translations.ts`, `supabase/functions/scrape-hsguru/index.ts`, `supabase/functions/get-matchups/index.ts`.
Delete: `src/pages/MetaTracker.tsx`, `src/components/meta/*`, `supabase/functions/meta-ai-insights/*`.
Migration: add `rank`, `period`, `hs_class` columns; truncate both tables; add indexes.