import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  archetypeList as staticArchetypeList,
  matchupDB as staticMatchupDB,
  type ArchetypeInfo,
} from "@/data/matchups";

interface MatchupRow {
  archetype: string;
  opponent_archetype: string;
  winrate: number;
  total_games: number | null;
}

interface ArchetypeStat {
  archetype: string;
  winrate: number | null;
  popularity: number | null;
  total_games: number | null;
  hs_class: string | null;
}

interface MatchupData {
  archetypeList: ArchetypeInfo[];
  matchupDB: Record<string, Record<string, number>>;
  date: string | null;
  loading: boolean;
  error: string | null;
  isFromDB: boolean;
}

export function useMatchupData(): MatchupData {
  const [data, setData] = useState<MatchupData>({
    archetypeList: staticArchetypeList,
    matchupDB: staticMatchupDB,
    date: null,
    loading: true,
    error: null,
    isFromDB: false,
  });

  useEffect(() => {
    fetchFromDB();
  }, []);

  const fetchFromDB = useCallback(async () => {
    try {
      const { data: response, error } = await supabase.functions.invoke(
        "get-matchups"
      );

      if (error) throw error;

      if (
        !response?.success ||
        !response.matchups ||
        response.matchups.length === 0
      ) {
        // Fallback to static data
        setData((prev) => ({ ...prev, loading: false }));
        return;
      }

      const matchups: MatchupRow[] = response.matchups;
      const stats: ArchetypeStat[] = response.archetypeStats;

      // Build matchupDB from rows
      const db: Record<string, Record<string, number>> = {};
      for (const m of matchups) {
        if (!db[m.archetype]) db[m.archetype] = {};
        db[m.archetype][m.opponent_archetype] = m.winrate;
      }

      // Build archetypeList from stats
      const list: ArchetypeInfo[] = stats.map((s) => ({
        name: s.archetype,
        winrate: s.winrate ?? 50,
        popularity: s.popularity ?? 0,
        trend: "stable" as const, // We don't track trend in DB yet
        hsClass: s.hs_class ?? "Unknown",
      }));

      // Sort by popularity descending
      list.sort((a, b) => b.popularity - a.popularity);

      setData({
        archetypeList: list,
        matchupDB: db,
        date: response.date,
        loading: false,
        error: null,
        isFromDB: true,
      });
    } catch (err) {
      console.warn("Failed to fetch matchups from DB, using static data:", err);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, []);

  return data;
}
