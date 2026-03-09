import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Filter, Loader2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import { allClasses as staticAllClasses } from "@/data/matchups";
import { useMatchupData } from "@/hooks/useMatchupData";
import { useT } from "@/i18n/useTranslation";
import MetaChart from "@/components/meta/MetaChart";
import MetaTierList from "@/components/meta/MetaTierList";
import MetaAIInsights from "@/components/meta/MetaAIInsights";
import DeckComparison from "@/components/meta/DeckComparison";

const MIN_GAMES_OPTIONS = [
  { value: "0", label: "All" },
  { value: "250", label: "250+" },
  { value: "500", label: "500+" },
  { value: "1000", label: "1K+" },
  { value: "2500", label: "2.5K+" },
  { value: "5000", label: "5K+" },
  { value: "10000", label: "10K+" },
  { value: "25000", label: "25K+" },
  { value: "50000", label: "50K+" },
];

const MetaTracker = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [activeTier, setActiveTier] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"winrate" | "popularity">("popularity");
  const [minGames, setMinGames] = useState("0");
  const t = useT();
  const { archetypeList, matchupDB, gamesDB, loading, date, isFromDB } = useMatchupData();

  const allClasses = useMemo(() => {
    const classes = [...new Set(archetypeList.map(a => a.hsClass))].filter(c => c !== "Unknown").sort();
    return classes.length > 0 ? classes : staticAllClasses;
  }, [archetypeList]);

  // Filter archetypes by class and min games
  const filteredArchetypes = useMemo(() => {
    let list = [...archetypeList];

    if (classFilter !== "all") {
      list = list.filter(a => a.hsClass === classFilter);
    }

    const minG = parseInt(minGames);
    if (minG > 0) {
      list = list.filter(a => {
        // Since HSGuru scraper doesn't provide gamesDB anymore, we estimate using popularity
        const games = gamesDB[a.name];
        if (games && Object.keys(games).length > 0) {
          const total = Object.values(games).reduce((sum, g) => sum + g, 0);
          return total >= minG;
        } else {
          // Estimate games: ~675k total games, popularity is a percentage
          const estimatedGamesFromPop = Math.round(676578 * (a.popularity / 100));
          return estimatedGamesFromPop >= minG;
        }
      });
    }

    // Fix WR if it's mysteriously 5-43% directly in the list
    return list.map(a => {
      let safeWr = a.winrate;
      if (safeWr < 45 && safeWr > 0) {
        // Fallback to calculate real WR from DB if the raw field got corrupted
        const wrs = archetypeList.map(opp => matchupDB[a.name]?.[opp.name]).filter(w => w != null) as number[];
        if (wrs.length > 0) {
          safeWr = wrs.reduce((sum, w) => sum + w, 0) / wrs.length;
        }
      }
      return { ...a, winrate: parseFloat(safeWr.toFixed(1)) };
    });
  }, [archetypeList, classFilter, minGames, gamesDB, matchupDB]);

  // Removed: recommendation banner (no longer needed per user request)

  return (
    <div className="min-h-screen bg-background">
      <ManaLensNavbar />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-7xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            {t("meta.title")} <span className="text-primary">{t("meta.titleHighlight")}</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-2">
            {t("meta.subtitle")}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("meta.rank")}:</span>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
              {t("meta.rankLegend")}
            </span>
          </div>
          {date && isFromDB && (
            <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Updated {date}</span>
            </div>
          )}
        </motion.div>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Removed recommendation banner - per user request */}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-44 bg-secondary border-border h-9 text-sm">
              <SelectValue placeholder={t("meta.allClasses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("meta.allClasses")}</SelectItem>
              {allClasses.map(cls => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={minGames} onValueChange={setMinGames}>
            <SelectTrigger className="w-36 bg-secondary border-border h-9 text-sm">
              <SelectValue placeholder={t("meta.minGames")} />
            </SelectTrigger>
            <SelectContent>
              {MIN_GAMES_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.value === "0" ? t("meta.gamesAll") : opt.label} {opt.value !== "0" ? t("meta.gamesLabel") : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Meta Chart - full width */}
        {!loading && filteredArchetypes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="bg-card border-border mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg">{t("meta.metaMap")}</CardTitle>
              </CardHeader>
              <CardContent>
                <MetaChart
                  archetypes={filteredArchetypes}
                  selected={selected}
                  onSelect={setSelected}
                  activeTier={activeTier}
                  onTierClick={setActiveTier}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Grid: Tier List + AI Insights */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tier List - 2/3 width */}
            <div className="lg:col-span-2">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-lg">{t("meta.tierList")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <MetaTierList
                    archetypes={filteredArchetypes}
                    matchupDB={matchupDB}
                    selected={selected}
                    onSelect={setSelected}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right sidebar - AI Insights + Deck Comparison */}
            <div className="space-y-6">
              <DeckComparison
                archetypes={filteredArchetypes}
                matchupDB={matchupDB}
              />
              <MetaAIInsights
                archetypes={filteredArchetypes}
                matchupDB={matchupDB}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MetaTracker;
