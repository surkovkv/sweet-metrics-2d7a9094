-- Wipe existing data (user requested)
DELETE FROM public.matchups;
DELETE FROM public.archetype_stats;

-- Add rank and period to matchups
ALTER TABLE public.matchups
  ADD COLUMN IF NOT EXISTS rank text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS period text NOT NULL DEFAULT 'current';

-- Add rank, period, hs_class, total_games to archetype_stats
ALTER TABLE public.archetype_stats
  ADD COLUMN IF NOT EXISTS rank text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS period text NOT NULL DEFAULT 'current',
  ADD COLUMN IF NOT EXISTS hs_class text,
  ADD COLUMN IF NOT EXISTS total_games integer;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_matchups_date_rank_period
  ON public.matchups (date, rank, period);
CREATE INDEX IF NOT EXISTS idx_archetype_stats_date_rank_period
  ON public.archetype_stats (date, rank, period);
