import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Info, ArrowUpRight, ArrowDownRight, Filter, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import { archetypeList, allClasses, getWinrate } from "@/data/matchups";
import { useT } from "@/i18n/useTranslation";

function getTier(winrate: number): { tier: string; color: string } {
  if (winrate >= 54) return { tier: "S", color: "hsl(var(--winrate-good))" };
  if (winrate >= 52) return { tier: "A", color: "hsl(142 71% 55%)" };
  if (winrate >= 50) return { tier: "B", color: "hsl(var(--winrate-neutral))" };
  if (winrate >= 48) return { tier: "C", color: "hsl(25 95% 53%)" };
  return { tier: "D", color: "hsl(var(--winrate-bad))" };
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-green-400" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-400" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

const MetaTracker = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string>("all");
  const t = useT();

  const filteredArchetypes = useMemo(() => {
    let list = [...archetypeList].sort((a, b) => b.popularity - a.popularity);
    if (classFilter !== "all") {
      list = list.filter((a) => a.hsClass === classFilter);
    }
    return list.slice(0, 15);
  }, [classFilter]);

  const maxPop = Math.max(...filteredArchetypes.map((a) => a.popularity));

  const recommendation = useMemo(() => {
    const top3 = [...archetypeList].sort((a, b) => b.popularity - a.popularity).slice(0, 3);
    let best: typeof archetypeList[0] | null = null;
    let bestScore = -1;
    for (const arch of archetypeList) {
      let wins = 0;
      for (const tt of top3) {
        if (arch.name === tt.name) continue;
        const wr = getWinrate(arch.name, tt.name);
        if (wr && wr > 50) wins++;
      }
      const score = wins * 100 + arch.winrate;
      if (score > bestScore) { bestScore = score; best = arch; }
    }
    return best;
  }, []);

  const matchupDetails = useMemo(() => {
    if (!selected) return null;
    const counters: { name: string; wr: number }[] = [];
    const counteredBy: { name: string; wr: number }[] = [];
    for (const arch of archetypeList) {
      if (arch.name === selected) continue;
      const wr = getWinrate(selected, arch.name);
      if (wr === null) continue;
      if (wr >= 55) counters.push({ name: arch.name, wr });
      if (wr <= 45) counteredBy.push({ name: arch.name, wr });
    }
    counters.sort((a, b) => b.wr - a.wr);
    counteredBy.sort((a, b) => a.wr - b.wr);
    return { counters, counteredBy };
  }, [selected]);

  return (
    <div className="min-h-screen bg-background">
      <ManaLensNavbar />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            {t("meta.title")} <span className="text-primary">{t("meta.titleHighlight")}</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            {t("meta.subtitle")}
          </p>
        </motion.div>

        {recommendation && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4 px-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {t("meta.bestChoice")} <span className="text-primary">{recommendation.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {recommendation.winrate}% WR · {recommendation.popularity}% pop · {t("meta.beatsTop")}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-48 bg-secondary border-border">
              <SelectValue placeholder={t("meta.allClasses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("meta.allClasses")}</SelectItem>
              {allClasses.map((cls) => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {t("meta.metaMap")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full" style={{ minHeight: 420 }}>
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground tracking-wider uppercase">
                  {t("meta.winrateAxis")}
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground tracking-wider uppercase">
                  {t("meta.popularityAxis")}
                </div>

                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                  {[44, 48, 50, 52, 56].map((wr) => {
                    const yPct = 90 - ((wr - 36) / (58 - 36)) * 80;
                    return (
                      <g key={wr}>
                        <line x1="10%" x2="95%" y1={`${yPct}%`} y2={`${yPct}%`} stroke="hsl(var(--border))" strokeDasharray={wr === 50 ? "none" : "4 4"} strokeOpacity={wr === 50 ? 0.6 : 0.3} />
                        <text x="7%" y={`${yPct}%`} fill="hsl(var(--muted-foreground))" fontSize="9" dominantBaseline="middle" textAnchor="end">{wr}%</text>
                      </g>
                    );
                  })}
                  <g transform="translate(20, 15)">
                    <circle cx="0" cy="0" r="4" fill="hsl(var(--winrate-good))" opacity="0.8" />
                    <text x="8" y="1" fill="hsl(var(--muted-foreground))" fontSize="8" dominantBaseline="middle">S-Tier</text>
                    <circle cx="50" cy="0" r="4" fill="hsl(142 71% 55%)" opacity="0.8" />
                    <text x="58" y="1" fill="hsl(var(--muted-foreground))" fontSize="8" dominantBaseline="middle">A-Tier</text>
                    <circle cx="100" cy="0" r="4" fill="hsl(var(--winrate-neutral))" opacity="0.8" />
                    <text x="108" y="1" fill="hsl(var(--muted-foreground))" fontSize="8" dominantBaseline="middle">B-Tier</text>
                    <circle cx="150" cy="0" r="4" fill="hsl(25 95% 53%)" opacity="0.8" />
                    <text x="158" y="1" fill="hsl(var(--muted-foreground))" fontSize="8" dominantBaseline="middle">C/D</text>
                  </g>
                </svg>

                {filteredArchetypes.map((arch) => {
                  const { tier, color } = getTier(arch.winrate);
                  const size = 28 + (arch.popularity / maxPop) * 52;
                  const xPct = 10 + (arch.popularity / maxPop) * 80;
                  const yPct = 90 - ((arch.winrate - 36) / (58 - 36)) * 80;
                  const isSelected = selected === arch.name;

                  return (
                    <Tooltip key={arch.name}>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: Math.random() * 0.3, type: "spring", stiffness: 200 }}
                          onClick={() => setSelected(isSelected ? null : arch.name)}
                          className="absolute cursor-pointer flex items-center justify-center rounded-full transition-all duration-200"
                          style={{
                            width: size, height: size,
                            left: `${xPct}%`, top: `${yPct}%`,
                            transform: "translate(-50%, -50%)",
                            backgroundColor: color,
                            opacity: isSelected ? 1 : selected ? 0.35 : 0.75,
                            border: isSelected ? "2px solid hsl(var(--foreground))" : "1px solid transparent",
                            zIndex: isSelected ? 10 : 1,
                          }}
                        >
                          <span className="text-[9px] font-bold text-background leading-none text-center px-1 select-none">
                            {arch.name.length > 10 ? arch.name.split(" ")[0] : arch.name}
                          </span>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-card border-border">
                        <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          {arch.name} <TrendIcon trend={arch.trend} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          WR: {arch.winrate}% · Pop: {arch.popularity}% · Tier {tier} · {arch.hsClass}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">{t("meta.tierList")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {filteredArchetypes.map((arch) => {
                  const { tier, color } = getTier(arch.winrate);
                  return (
                    <div
                      key={arch.name}
                      onClick={() => setSelected(selected === arch.name ? null : arch.name)}
                      className={`flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                        selected === arch.name ? "bg-primary/15 border border-primary/30" : "bg-secondary/50 hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: color, color: "hsl(var(--background))" }}>
                          {tier}
                        </span>
                        <span className="text-foreground truncate">{arch.name}</span>
                        <TrendIcon trend={arch.trend} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{arch.winrate}%</span>
                        <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(arch.winrate / 60) * 100}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {selected && matchupDetails && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-base flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      {selected}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {matchupDetails.counters.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3 text-green-400" />
                          {t("meta.counters")}
                        </div>
                        {matchupDetails.counters.map((m) => (
                          <div key={m.name} className="flex items-center justify-between text-sm py-1">
                            <span className="text-foreground">{m.name}</span>
                            <span className="text-green-400 font-mono text-xs">{m.wr}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {matchupDetails.counteredBy.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <ArrowDownRight className="h-3 w-3 text-red-400" />
                          {t("meta.counteredBy")}
                        </div>
                        {matchupDetails.counteredBy.map((m) => (
                          <div key={m.name} className="flex items-center justify-between text-sm py-1">
                            <span className="text-foreground">{m.name}</span>
                            <span className="text-red-400 font-mono text-xs">{m.wr}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {matchupDetails.counters.length === 0 && matchupDetails.counteredBy.length === 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Minus className="h-4 w-4" />
                        {t("meta.noCounters")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MetaTracker;
