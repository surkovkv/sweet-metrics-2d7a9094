import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Info, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import { archetypeList, matchupDB, getWinrate } from "@/data/matchups";

// Tier classification
function getTier(winrate: number): { tier: string; color: string } {
  if (winrate >= 54) return { tier: "S", color: "hsl(var(--winrate-good))" };
  if (winrate >= 52) return { tier: "A", color: "hsl(142 71% 55%)" };
  if (winrate >= 50) return { tier: "B", color: "hsl(var(--winrate-neutral))" };
  if (winrate >= 48) return { tier: "C", color: "hsl(25 95% 53%)" };
  return { tier: "D", color: "hsl(var(--winrate-bad))" };
}

const MetaTracker = () => {
  const [selected, setSelected] = useState<string | null>(null);

  // Sort by popularity
  const sortedArchetypes = useMemo(
    () => [...archetypeList].sort((a, b) => b.popularity - a.popularity).slice(0, 15),
    []
  );

  const maxPop = Math.max(...sortedArchetypes.map((a) => a.popularity));

  // Get counters/countered-by for selected archetype
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Live <span className="text-primary">Meta-трекер</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Популярность и сила архетипов на Legend-рангах. Кликни на колоду — узнай, кто её контрит.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bubble Chart Area */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Мета-карта
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full" style={{ minHeight: 420 }}>
                {/* Y-axis label */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground tracking-wider uppercase">
                  Винрейт %
                </div>
                {/* X-axis label */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground tracking-wider uppercase">
                  Популярность %
                </div>

                {/* Grid lines */}
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                  {/* 50% winrate line */}
                  <line
                    x1="10%"
                    x2="95%"
                    y1="50%"
                    y2="50%"
                    stroke="hsl(var(--border))"
                    strokeDasharray="4 4"
                  />
                  <text x="96%" y="50%" fill="hsl(var(--muted-foreground))" fontSize="10" dominantBaseline="middle">
                    50%
                  </text>
                </svg>

                {/* Bubbles */}
                {sortedArchetypes.map((arch) => {
                  const { tier, color } = getTier(arch.winrate);
                  const size = 28 + (arch.popularity / maxPop) * 52; // 28-80px
                  // Position: x = popularity (left→right), y = winrate (bottom→top)
                  const xPct = 10 + (arch.popularity / maxPop) * 80;
                  const yPct = 90 - ((arch.winrate - 36) / (58 - 36)) * 80; // map 36-58% to 90-10%
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
                            width: size,
                            height: size,
                            left: `${xPct}%`,
                            top: `${yPct}%`,
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
                        <div className="text-sm font-semibold text-foreground">{arch.name}</div>
                        <div className="text-xs text-muted-foreground">
                          WR: {arch.winrate}% · Pop: {arch.popularity}% · Tier {tier}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Tier List */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">Тир-лист</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {sortedArchetypes.map((arch) => {
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
                        <span
                          className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center"
                          style={{ backgroundColor: color, color: "hsl(var(--background))" }}
                        >
                          {tier}
                        </span>
                        <span className="text-foreground truncate">{arch.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{arch.winrate}%</span>
                        <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(arch.popularity / maxPop) * 100}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Matchup Details */}
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
                          Контрит (WR 55%+)
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
                          Проигрывает (WR ≤45%)
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
                        Нет ярко выраженных контр-матчапов
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
