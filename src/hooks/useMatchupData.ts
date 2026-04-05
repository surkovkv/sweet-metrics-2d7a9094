import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  archetypeList as staticArchetypeList,
  matchupDB as staticMatchupDB,
  type ArchetypeInfo,
} from "@/data/matchups";

interface MatchupData {
  archetypeList: ArchetypeInfo[];
  matchupDB: Record<string, Record<string, number>>;
  gamesDB: Record<string, Record<string, number>>;
  archetypeGames: Record<string, number>;
  date: string | null;
  loading: boolean;
  error: string | null;
  isFromDB: boolean;
}

// Cross-reference static data for hsClass
const staticClassMap = Object.fromEntries(
  staticArchetypeList.map(a => [a.name, a.hsClass])
);

export function useMatchupData(): MatchupData {
  const [data, setData] = useState<MatchupData>({
    archetypeList: staticArchetypeList,
    matchupDB: staticMatchupDB,
    gamesDB: {},
    archetypeGames: {},
    date: null,
    loading: true,
    error: null,
    isFromDB: false,
  });

  const fetchFromDB = useCallback(async () => {
    try {
      const { data: response, error } = await supabase.functions.invoke("get-matchups");

      if (error) throw error;

      if (!response?.success || !response.matchups || response.matchups.length === 0) {
        setData(prev => ({ ...prev, loading: false }));
        return;
      }

      const matchups = response.matchups;
      const stats = response.archetypeStats;

      // Build matchupDB and gamesDB from rows
      // DB columns: archetype, opponent, winrate, estimated_games
      const db: Record<string, Record<string, number>> = {};
      const gdb: Record<string, Record<string, number>> = {};
      for (const m of matchups) {
        const arch = m.archetype;
        const opp = m.opponent;
        if (!arch || !opp) continue;
        if (!db[arch]) db[arch] = {};
        db[arch][opp] = m.winrate;
        if (m.estimated_games) {
          if (!gdb[arch]) gdb[arch] = {};
          gdb[arch][opp] = m.estimated_games;
        }
      }

      // Build archetypeList from stats
      // DB columns: name, winrate, popularity (no hs_class)
      // Note: scraper stores raw totalGames in 'popularity' field for row archetypes
      // and stores true % for column archetypes from header row.
      // TOTAL_GAMES_METADATA is a sentinel entry — filter it out.
      const allStats = (stats || []) as Array<{ name: string; winrate: number | null; popularity: number | null; total_games: number | null }>;
      const totalGamesMeta = allStats.find((s) => s.name === "TOTAL_GAMES_METADATA");
      const totalMatchesFromDB = totalGamesMeta?.popularity ?? null;

      const filteredStats = allStats.filter((s) => s.name !== "TOTAL_GAMES_METADATA");

      const archetypeGames: Record<string, number> = {};
      const totalRef = totalMatchesFromDB ?? 676578;

      for (const s of filteredStats) {
        if (s.total_games) {
          archetypeGames[s.name] = s.total_games;
        } else if (s.popularity !== null) {
          if (s.popularity > 100) {
            archetypeGames[s.name] = s.popularity;
          } else if (s.popularity > 0) {
            archetypeGames[s.name] = Math.round((s.popularity / 100) * totalRef);
          } else {
            archetypeGames[s.name] = 0;
          }
        }
      }

      const list: ArchetypeInfo[] = filteredStats.map((s) => ({
        name: s.name,
        winrate: s.winrate ?? 50,
        popularity: s.popularity !== null && s.popularity <= 100 ? s.popularity : (archetypeGames[s.name] ? Math.round((archetypeGames[s.name] / totalRef) * 100) : 0),
        trend: "stable" as const,
        hsClass: staticClassMap[s.name] || "Unknown",
      }));

      list.sort((a, b) => b.popularity - a.popularity);

      setData({
        archetypeList: list.length > 0 ? list : staticArchetypeList,
        matchupDB: Object.keys(db).length > 0 ? db : staticMatchupDB,
        gamesDB: gdb,
        archetypeGames,
        date: response.date,
        loading: false,
        error: null,
        isFromDB: list.length > 0,
      });
    } catch (err) {
      console.warn("Failed to fetch matchups from DB, using static data:", err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, []);

  useEffect(() => {
    fetchFromDB();
  }, [fetchFromDB]);

  return data;
}
