import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Grid3x3, Loader2, Info, Trophy, Swords, Filter, Clock, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import { useMatchupData, type RankFilter } from "@/hooks/useMatchupData";
import { useT } from "@/i18n/useTranslation";

const SAMPLE_OPTIONS = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
const MIN_ARCHETYPE_GAMES = 50; // hard floor

const HS_CLASSES = [
  "Death Knight", "Demon Hunter", "Druid", "Hunter", "Mage", "Paladin",
  "Priest", "Rogue", "Shaman", "Warlock", "Warrior",
];

// Period filter values map directly to HSGuru's `period` query param.
// "current" = no period param = HSGuru's "current patch" (resolved dynamically server-side).
// TODO: получать версию патча динамически из hsguru.com (сейчас бэкенд просто
// запрашивает hsguru без period — он сам отдаёт данные текущего патча).
const PERIOD_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "current", labelKey: "matchups.periodCurrent" },
  { value: "past_day", labelKey: "matchups.periodDay" },
  { value: "past_3_days", labelKey: "matchups.period3Days" },
  { value: "past_week", labelKey: "matchups.periodWeek" },
  { value: "past_2_week", labelKey: "matchups.period2Weeks" },
  { value: "past_month", labelKey: "matchups.periodMonth" },
];

function getWrColor(wr: number | null) {
  if (wr === null) return "text-muted-foreground";
  if (wr >= 55) return "text-green-400";
  if (wr >= 45) return "text-yellow-400";
  return "text-red-400";
}
function getWrBg(wr: number | null) {
  if (wr === null) return "bg-secondary/30";
  if (wr >= 55) return "bg-green-500/10";
  if (wr >= 45) return "bg-yellow-500/10";
  return "bg-red-500/10";
}

const MatchupTable = () => {
  const t = useT();
  const [rank, setRank] = useState<RankFilter>("all");
  const [period, setPeriod] = useState<string>("current");
  const [minMatchupGames, setMinMatchupGames] = useState<number>(50);
  const [minArchetypeGames, setMinArchetypeGames] = useState<number>(50);
  const [classFilter, setClassFilter] = useState<string>("all");

  const { archetypeList, matchupDB, gamesDB, archetypeGames, loading } =
    useMatchupData(rank, period);

  // Rows: enforce min-archetype-games + class filter; preserve popularity order from server.
  const rows = useMemo(() => {
    let list = archetypeList.filter((a) => (archetypeGames[a.name] ?? 0) >= Math.max(minArchetypeGames, MIN_ARCHETYPE_GAMES));
    if (classFilter !== "all") list = list.filter((a) => a.hsClass === classFilter);
    return list;
  }, [archetypeList, archetypeGames, classFilter, minArchetypeGames]);

  // Columns: keep ALL eligible archetypes (≥50 games), independent of class filter,
  // but drop columns that have NO data above threshold for any selected row.
  const allCols = useMemo(
    () => archetypeList.filter((a) => (archetypeGames[a.name] ?? 0) >= Math.max(minArchetypeGames, MIN_ARCHETYPE_GAMES)),
    [archetypeList, archetypeGames, minArchetypeGames],
  );

  const cols = useMemo(() => {
    return allCols.filter((col) => {
      // keep column if any row has data above threshold against this col
      return rows.some((row) => {
        const wr = matchupDB[row.name]?.[col.name] ?? null;
        const games =
          gamesDB[row.name]?.[col.name] ??
          gamesDB[col.name]?.[row.name] ??
          null;
        if (wr === null) return false;
        if (games !== null && games < minMatchupGames) return false;
        return true;
      });
    });
  }, [allCols, rows, matchupDB, gamesDB, minMatchupGames]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <ManaLensNavbar />
        <main className="container mx-auto px-4 pt-24 pb-12 max-w-[1400px] overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Grid3x3 className="h-8 w-8 text-primary" />
              {t("matchups.title")}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              {t("matchups.subtitle")}
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="rounded-2xl bg-secondary/40 border border-border p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <FilterCell icon={<Trophy className="h-3.5 w-3.5 text-primary" />} label={t("matchups.rank")}>
                <Select value={rank} onValueChange={(v) => setRank(v as RankFilter)}>
                  <SelectTrigger className="h-9 bg-background border-border font-bold text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("matchups.rankAll")}</SelectItem>
                    <SelectItem value="legend">{t("matchups.rankLegend")}</SelectItem>
                    <SelectItem value="diamond_to_legend">{t("matchups.rankDiamondLegend")}</SelectItem>
                    <SelectItem value="top_1k">{t("matchups.rankTop1k")}</SelectItem>
                    <SelectItem value="top_5k">{t("matchups.rankTop5k")}</SelectItem>
                  </SelectContent>
                </Select>
              </FilterCell>

              <FilterCell icon={<Clock className="h-3.5 w-3.5 text-primary" />} label={t("matchups.period")}>
                <Select value={period} onValueChange={(v) => setPeriod(v)}>
                  <SelectTrigger className="h-9 bg-background border-border font-bold text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{t(p.labelKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterCell>

              <FilterCell icon={<Filter className="h-3.5 w-3.5 text-primary" />} label={t("matchups.class")}>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="h-9 bg-background border-border font-bold text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("matchups.classAll")}</SelectItem>
                    {HS_CLASSES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterCell>

              <FilterCell icon={<Swords className="h-3.5 w-3.5 text-primary" />} label={t("matchups.minMatchup")}>
                <Select value={String(minMatchupGames)} onValueChange={(v) => setMinMatchupGames(Number(v))}>
                  <SelectTrigger className="h-9 bg-background border-border font-bold text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SAMPLE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>≥ {n.toLocaleString()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterCell>

              <FilterCell icon={<Layers className="h-3.5 w-3.5 text-primary" />} label={t("matchups.minArchetype")}>
                <Select value={String(minArchetypeGames)} onValueChange={(v) => setMinArchetypeGames(Number(v))}>
                  <SelectTrigger className="h-9 bg-background border-border font-bold text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SAMPLE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>≥ {n.toLocaleString()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterCell>
            </div>
          </motion.div>

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && rows.length > 0 && (
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Grid3x3 className="h-5 w-5 text-primary" />
                  {t("matchups.matrix")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-[80vh] relative">
                  <table className="text-xs border-collapse min-w-max">
                    <thead className="sticky top-0 z-20 bg-card">
                      <tr>
                        <th className="sticky left-0 z-30 bg-card text-left py-2 px-3 border-b-2 border-border min-w-[200px]">
                          <div className="text-muted-foreground font-semibold">
                            {t("matchups.archetype")}
                          </div>
                        </th>
                        <th className="py-2 px-2 border-b-2 border-border text-muted-foreground font-semibold">WR%</th>
                        <th className="py-2 px-2 border-b-2 border-border text-muted-foreground font-semibold">POP%</th>
                        {cols.map((opp) => (
                          <th
                            key={opp.name}
                            className="py-2 px-2 border-b-2 border-border text-muted-foreground font-medium whitespace-nowrap"
                          >
                            <div className="max-w-[90px] truncate" title={opp.name}>
                              {opp.name}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.name} className="hover:bg-secondary/30">
                          <td className="sticky left-0 z-10 bg-card py-2 px-3 border-b border-border font-medium text-foreground whitespace-nowrap">
                            {row.name}
                            <div className="text-[10px] text-muted-foreground">
                              {row.hsClass}
                            </div>
                          </td>
                          <td className={`py-2 px-2 border-b border-border text-center font-bold ${getWrColor(row.winrate)}`}>
                            {row.winrate.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 border-b border-border text-center text-muted-foreground">
                            {row.popularity.toFixed(1)}
                          </td>
                          {cols.map((col) => {
                            const wr = matchupDB[row.name]?.[col.name] ?? null;
                            const games =
                              gamesDB[row.name]?.[col.name] ??
                              gamesDB[col.name]?.[row.name] ??
                              null;
                            const belowThreshold = games !== null && games < minMatchupGames;
                            const displayWr = belowThreshold ? null : wr;
                            return (
                              <td
                                key={col.name}
                                className={`py-2 px-2 border-b border-border text-center ${getWrBg(displayWr)}`}
                              >
                                {displayWr !== null ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <div className={`font-bold ${getWrColor(displayWr)}`}>
                                          {displayWr.toFixed(1)}
                                        </div>
                                        {games !== null && (
                                          <div className="text-[9px] text-muted-foreground">
                                            {games.toLocaleString()}
                                          </div>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">{row.name} vs {col.name}</p>
                                      <p className="text-xs font-semibold">
                                        {displayWr.toFixed(1)}%{" "}
                                        {games !== null && `· ${games.toLocaleString()} games`}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span className="text-muted-foreground"> </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {t("matchups.note")}
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && rows.length === 0 && (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center text-muted-foreground">
                {t("matchups.empty")}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
};

function FilterCell({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

export default MatchupTable;
