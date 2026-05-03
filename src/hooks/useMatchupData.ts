import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type ArchetypeInfo } from "@/data/matchups";

export type RankFilter = "all" | "legend" | "diamond_to_legend" | "top_1k" | "top_5k";

interface MatchupData {
  archetypeList: ArchetypeInfo[];
  matchupDB: Record<string, Record<string, number>>;
  gamesDB: Record<string, Record<string, number>>;
  archetypeGames: Record<string, number>;
  date: string | null;
  period: string | null;
  rank: RankFilter;
  loading: boolean;
  error: string | null;
  isFromDB: boolean;
}

export function useMatchupData(rank: RankFilter = "all", period?: string | null): MatchupData {
  const [data, setData] = useState<MatchupData>({
    archetypeList: [],
    matchupDB: {},
    gamesDB: {},
    archetypeGames: {},
    date: null,
    period: null,
    rank,
    loading: true,
    error: null,
    isFromDB: false,
  });

  const fetchFromDB = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, rank }));
    try {
      const { data: response, error } = await supabase.functions.invoke("get-matchups", {
        body: { rank, period: period ?? undefined },
      });
      if (error) throw error;

      if (!response?.success) {
        setData((prev) => ({ ...prev, loading: false, rank }));
        return;
      }

      const matchups = response.matchups || [];
      const stats = response.archetypeStats || [];

      const db: Record<string, Record<string, number>> = {};
      const gdb: Record<string, Record<string, number>> = {};
      for (const m of matchups) {
        if (!m.archetype || !m.opponent) continue;
        (db[m.archetype] ||= {})[m.opponent] = Number(m.winrate);
        if (m.estimated_games != null) {
          (gdb[m.archetype] ||= {})[m.opponent] = Number(m.estimated_games);
        }
      }

      const archetypeGames: Record<string, number> = {};
      const list: ArchetypeInfo[] = [];
      for (const s of stats) {
        if (!s.name || s.name === "TOTAL_GAMES_METADATA") continue;
        const total = s.total_games != null ? Number(s.total_games) : 0;
        archetypeGames[s.name] = total;
        list.push({
          name: s.name,
          winrate: s.winrate != null ? Number(s.winrate) : 50,
          popularity: s.popularity != null ? Number(s.popularity) : 0,
          trend: "stable",
          hsClass: s.hs_class || "Unknown",
        });
      }
      list.sort((a, b) => b.popularity - a.popularity);

      setData({
        archetypeList: list,
        matchupDB: db,
        gamesDB: gdb,
        archetypeGames,
        date: response.date,
        period: response.period,
        rank: (response.rank as RankFilter) || rank,
        loading: false,
        error: null,
        isFromDB: list.length > 0,
      });
    } catch (err) {
      console.warn("Failed to fetch matchups:", err);
      setData((prev) => ({
        ...prev,
        loading: false,
        rank,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, [rank, period]);

  useEffect(() => {
    fetchFromDB();
  }, [fetchFromDB]);

  return data;
}
