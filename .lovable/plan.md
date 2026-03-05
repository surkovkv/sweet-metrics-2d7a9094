

## Plan: Auto-update matchup data from HSGuru

### Critical Problem: HSGuru uses Phoenix LiveView

HSGuru renders matchup data via WebSocket (Phoenix LiveView). A simple `fetch()` of the HTML page returns only headers and popularity percentages --- **no actual winrate rows**. The table body is injected dynamically via WebSocket after page load. There is no public API.

This means **standard HTML parsing (Cheerio) will not work**. We need a tool that renders JavaScript.

### Viable Approach: Firecrawl Connector

Firecrawl can render JavaScript and return the full HTML. This is the only viable path within the Lovable/Supabase ecosystem.

**Prerequisite**: You need to connect the **Firecrawl connector** so its API key is available to edge functions. I'll prompt you to connect it.

### Architecture

```text
┌─────────────┐     ┌──────────────────────┐     ┌───────────┐
│ Admin Panel  │────>│ Edge Fn: scrape-hsguru│────>│ Firecrawl │
│ (button)     │     │  1. Fetch rendered HTML│     │ (JS render)│
│              │     │  2. Parse with regex   │     └───────────┘
│ Cron (daily) │────>│  3. Upsert to Supabase│
└─────────────┘     └──────────────────────┘
                              │
                              v
                    ┌──────────────────┐
                    │ matchups table   │
                    │ (Supabase)       │
                    └──────────────────┘
                              │
                              v
                    ┌──────────────────┐
                    │ Frontend: read   │
                    │ from DB instead  │
                    │ of static file   │
                    └──────────────────┘
```

### Implementation Steps

**1. Connect Firecrawl**
Prompt user to connect Firecrawl connector for `FIRECRAWL_API_KEY`.

**2. Create `matchups` table (migration)**
```sql
create table public.matchups (
  id bigint generated always as identity primary key,
  date date not null default current_date,
  archetype text not null,
  opponent_archetype text not null,
  winrate double precision not null,
  total_games int,
  created_at timestamptz default now(),
  unique(date, archetype, opponent_archetype)
);

create table public.archetype_stats (
  id bigint generated always as identity primary key,
  date date not null default current_date,
  archetype text not null,
  winrate double precision,
  popularity double precision,
  total_games int,
  created_at timestamptz default now(),
  unique(date, archetype)
);

alter table public.matchups enable row level security;
alter table public.archetype_stats enable row level security;

create policy "Public read" on public.matchups for select using (true);
create policy "Public read" on public.archetype_stats for select using (true);
```

**3. Create Edge Function `scrape-hsguru`**
- Uses Firecrawl to scrape `https://www.hsguru.com/matchups?min_archetype_sample=500&min_matchup_sample=500&rank=legend` with `waitFor: 5000` to let LiveView render.
- Parses the returned HTML to extract:
  - Column headers (opponent archetype names from `<th>` buttons with `phx-value-sort_by="opponent_X"`)
  - Row data: each `<tr>` in tbody has archetype name + winrate cells
  - Popularity from the 3rd header row
- Deletes old data for `current_date`, inserts new batch.
- Returns success/error.

**4. Create Edge Function `get-matchups`**
- Simple function that queries `matchups` table for latest date and returns JSON.
- Also returns `archetype_stats` for the same date.

**5. Update Admin Panel (`src/pages/Admin.tsx`)**
- Replace mock `triggerHsguruFetch` with real call to `scrape-hsguru` edge function.
- Show loading spinner and success/error toast.

**6. Update frontend data layer**
- Create `src/hooks/useMatchupData.ts`: fetches from `get-matchups` edge function, falls back to static `matchups.ts` if DB is empty.
- Update `TournamentStrategist.tsx` and `MetaTracker.tsx` to use the hook instead of importing static data directly.

**7. Daily cron job**
- Enable `pg_cron` and `pg_net` extensions.
- Schedule `scrape-hsguru` to run daily at 03:00 UTC.

### Files to create/modify

| File | Action |
|------|--------|
| `supabase/migrations/..._create_matchups.sql` | Create tables |
| `supabase/functions/scrape-hsguru/index.ts` | Firecrawl scrape + parse + upsert |
| `supabase/functions/get-matchups/index.ts` | Read from DB |
| `src/hooks/useMatchupData.ts` | New hook: DB-first, static fallback |
| `src/pages/Admin.tsx` | Wire up real sync button |
| `src/pages/TournamentStrategist.tsx` | Use dynamic data |
| `src/pages/MetaTracker.tsx` | Use dynamic data |
| `src/integrations/supabase/types.ts` | Add new table types |

### First step needed from you
I need to connect **Firecrawl** so the edge function can render JS-heavy pages. Without it, the scraper cannot get the actual data.

