import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Grid3x3, Loader2, Calendar, Info, ArrowUpDown } from "lucide-react";
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

const SAMPLE_OPTIONS = [1, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

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

type SortKey = "popularity" | "winrate" | "name" | "games";

const MatchupTable = () => {
  const t = useT();
  const [rank, setRank] = useState<RankFilter>("all");
  const [minArchGames, setMinArchGames] = useState<number>(1);
  const [minMatchupGames, setMinMatchupGames] = useState<number>(1);
  const [sortKey, setSortKey] = useState<SortKey>("popularity");

  const { archetypeList, matchupDB, gamesDB, archetypeGames, date, period, loading } =
    useMatchupData(rank);

  const filtered = useMemo(() => {
    const list = archetypeList.filter((a) => (archetypeGames[a.name] ?? 0) >= minArchGames);
    list.sort((a, b) => {
      if (sortKey === "popularity") return b.popularity - a.popularity;
      if (sortKey === "winrate") return b.winrate - a.winrate;
      if (sortKey === "games")
        return (archetypeGames[b.name] ?? 0) - (archetypeGames[a.name] ?? 0);
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [archetypeList, archetypeGames, minArchGames, sortKey]);

  // Summary stats
  const totalGames = useMemo(
    () => Object.values(archetypeGames).reduce((s, g) => s + g, 0),
    [archetypeGames],
  );
  const avgMetaWr = useMemo(() => {
    if (filtered.length === 0) return null;
    const sum = filtered.reduce((s, a) => s + (a.winrate || 0), 0);
    return Math.round((sum / filtered.length) * 10) / 10;
  }, [filtered]);

  const topPop = filtered[0];
  const topWr = useMemo(() => {
    return [...filtered].sort((a, b) => b.winrate - a.winrate)[0];
  }, [filtered]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <ManaLensNavbar />
        <main className="container mx-auto px-4 pt-24 pb-12 max-w-[1400px]">
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
            {date && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {t("tournament.updated")} {date}
                  {period ? ` · ${period}` : ""}
                </span>
              </div>
            )}
          </motion.div>

          {/* Filters */}
          <Card className="bg-card border-border mb-6">
            <CardContent className="pt-6 flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("matchups.rank")}
                </label>
                <Select value={rank} onValueChange={(v) => setRank(v as RankFilter)}>
                  <SelectTrigger className="w-36 h-9 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("matchups.rankAll")}</SelectItem>
                    <SelectItem value="legend">{t("matchups.rankLegend")}</SelectItem>
                    <SelectItem value="top_1k">{t("matchups.rankTop1k")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("matchups.minArchetype")}
                </label>
                <Select
                  value={String(minArchGames)}
                  onValueChange={(v) => setMinArchGames(Number(v))}
                >
                  <SelectTrigger className="w-32 h-9 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SAMPLE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n === 1 ? t("matchups.any") : `≥ ${n.toLocaleString()}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("matchups.minMatchup")}
                </label>
                <Select
                  value={String(minMatchupGames)}
                  onValueChange={(v) => setMinMatchupGames(Number(v))}
                >
                  <SelectTrigger className="w-32 h-9 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SAMPLE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n === 1 ? t("matchups.any") : `≥ ${n.toLocaleString()}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("matchups.sortBy")}
                </label>
                <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                  <SelectTrigger className="w-40 h-9 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">{t("matchups.sortPopularity")}</SelectItem>
                    <SelectItem value="winrate">{t("matchups.sortWinrate")}</SelectItem>
                    <SelectItem value="games">{t("matchups.sortGames")}</SelectItem>
                    <SelectItem value="name">{t("matchups.sortName")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <SummaryCard label={t("matchups.totalGames")} value={totalGames.toLocaleString()} />
              <SummaryCard label={t("matchups.archetypes")} value={String(filtered.length)} />
              <SummaryCard
                label={t("matchups.avgWr")}
                value={avgMetaWr !== null ? `${avgMetaWr}%` : "—"}
              />
              <SummaryCard
                label={t("matchups.topDeck")}
                value={topPop?.name || "—"}
                sub={topWr ? `${t("matchups.bestWr")}: ${topWr.name} (${topWr.winrate}%)` : ""}
              />
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Table */}
          {!loading && filtered.length > 0 && (
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
                        <th className="py-2 px-2 border-b-2 border-border text-muted-foreground font-semibold">
                          WR%
                        </th>
                        <th className="py-2 px-2 border-b-2 border-border text-muted-foreground font-semibold">
                          POP%
                        </th>
                        <th className="py-2 px-2 border-b-2 border-border text-muted-foreground font-semibold">
                          {t("matchups.games")}
                        </th>
                        {filtered.map((opp) => (
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
                      {filtered.map((row) => (
                        <tr key={row.name} className="hover:bg-secondary/30">
                          <td className="sticky left-0 z-10 bg-card py-2 px-3 border-b border-border font-medium text-foreground whitespace-nowrap">
                            {row.name}
                            <div className="text-[10px] text-muted-foreground">
                              {row.hsClass}
                            </div>
                          </td>
                          <td
                            className={`py-2 px-2 border-b border-border text-center font-bold ${getWrColor(row.winrate)}`}
                          >
                            {row.winrate.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 border-b border-border text-center text-muted-foreground">
                            {row.popularity.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 border-b border-border text-center text-muted-foreground">
                            {(archetypeGames[row.name] ?? 0).toLocaleString()}
                          </td>
                          {filtered.map((col) => {
                            const wr = matchupDB[row.name]?.[col.name] ?? null;
                            const games =
                              gamesDB[row.name]?.[col.name] ??
                              gamesDB[col.name]?.[row.name] ??
                              null;
                            const belowThreshold =
                              games !== null && games < minMatchupGames;
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
                                      <p className="text-xs">
                                        {row.name} vs {col.name}
                                      </p>
                                      <p className="text-xs font-semibold">
                                        {displayWr.toFixed(1)}%{" "}
                                        {games !== null && `· ${games.toLocaleString()} games`}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : belowThreshold ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="text-muted-foreground">—</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">
                                        {t("matchups.belowThreshold").replace(
                                          "{n}",
                                          String(minMatchupGames),
                                        )}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
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

          {!loading && filtered.length === 0 && (
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

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-4 rounded-lg bg-card border border-border">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </div>
      <div className="text-xl font-bold text-foreground mt-1 truncate">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-1 truncate">{sub}</div>}
    </div>
  );
}

export default MatchupTable;
