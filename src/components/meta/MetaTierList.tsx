import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, ChevronDown, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type ArchetypeInfo } from "@/data/matchups";
import { getTier } from "./MetaChart";
import { useT } from "@/i18n/useTranslation";

interface Props {
  archetypes: ArchetypeInfo[];
  matchupDB: Record<string, Record<string, number>>;
  selected: string | null;
  onSelect: (name: string | null) => void;
  sortBy: "winrate" | "popularity";
  onSortChange: (s: "winrate" | "popularity") => void;
}

function WrColor({ wr }: { wr: number }) {
  const color = wr >= 55 ? "text-green-400" : wr >= 50 ? "text-primary" : wr >= 45 ? "text-muted-foreground" : "text-red-400";
  return <span className={`font-mono text-xs ${color}`}>{wr}%</span>;
}

export default function MetaTierList({ archetypes, matchupDB, selected, onSelect, sortBy, onSortChange }: Props) {
  const t = useT();
  const [lookupOpponent, setLookupOpponent] = useState<string>("");

  const sorted = useMemo(() => {
    const list = [...archetypes];
    if (sortBy === "winrate") list.sort((a, b) => b.winrate - a.winrate);
    else list.sort((a, b) => b.popularity - a.popularity);
    return list;
  }, [archetypes, sortBy]);

  const selectedMatchups = useMemo(() => {
    if (!selected || !matchupDB[selected]) return { favorable: [], unfavorable: [], all: [] };
    const entries = Object.entries(matchupDB[selected])
      .filter(([name]) => name !== selected)
      .map(([name, wr]) => ({ name, wr }));

    return {
      favorable: entries.filter(m => m.wr >= 55).sort((a, b) => b.wr - a.wr),
      unfavorable: entries.filter(m => m.wr <= 45).sort((a, b) => a.wr - b.wr),
      all: entries.sort((a, b) => b.wr - a.wr),
    };
  }, [selected, matchupDB]);

  const lookupWr = selected && lookupOpponent && matchupDB[selected]
    ? matchupDB[selected][lookupOpponent] ?? null
    : null;

  return (
    <div>
      {/* Sort toggle */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => onSortChange("winrate")}
          className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
            sortBy === "winrate"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("meta.sortByWinrate")}
        </button>
        <button
          onClick={() => onSortChange("popularity")}
          className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
            sortBy === "popularity"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("meta.sortByPopularity")}
        </button>
      </div>

      {/* Tier list */}
      <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
        {sorted.map((arch, i) => {
          const tier = getTier(arch.winrate);
          const isSelected = selected === arch.name;

          return (
            <div key={arch.name}>
              <div
                onClick={() => onSelect(isSelected ? null : arch.name)}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer transition-all ${
                  isSelected
                    ? "bg-primary/15 border border-primary/30 shadow-sm"
                    : "bg-secondary/50 hover:bg-secondary"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-muted-foreground w-5 text-right shrink-0 font-mono">
                    {i + 1}
                  </span>
                  <span
                    className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0"
                    style={{ backgroundColor: tier.color, color: "hsl(var(--background))" }}
                  >
                    {tier.id}
                  </span>
                  <span className="text-foreground truncate">{arch.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{arch.hsClass}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                  <span className="font-mono font-medium" style={{ color: tier.color }}>
                    {arch.winrate}%
                  </span>
                  <span className="w-8 text-right">{arch.popularity}%</span>
                  <div className="w-14 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(arch.winrate / 60) * 100}%`, backgroundColor: tier.color }}
                    />
                  </div>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${isSelected ? "rotate-180" : ""}`}
                  />
                </div>
              </div>

              {/* Expanded matchup details */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-card/80 border border-border/50 rounded-md mt-1 p-3 space-y-3">
                      {/* Matchup lookup */}
                      <div>
                        <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                          <Search className="h-3 w-3" />
                          {t("meta.deckVsDeck")}
                        </div>
                        <div className="flex items-center gap-2">
                          <Select value={lookupOpponent} onValueChange={setLookupOpponent}>
                            <SelectTrigger className="h-8 text-xs bg-secondary border-border flex-1">
                              <SelectValue placeholder={t("meta.selectOpponent")} />
                            </SelectTrigger>
                            <SelectContent>
                              {archetypes
                                .filter(a => a.name !== selected)
                                .map(a => (
                                  <SelectItem key={a.name} value={a.name}>
                                    {a.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {lookupWr !== null ? (
                            <div
                              className="px-3 py-1 rounded-md font-mono font-bold text-sm shrink-0"
                              style={{
                                backgroundColor:
                                  lookupWr >= 55
                                    ? "hsl(var(--winrate-good) / 0.2)"
                                    : lookupWr <= 45
                                    ? "hsl(var(--winrate-bad) / 0.2)"
                                    : "hsl(var(--winrate-neutral) / 0.2)",
                                color:
                                  lookupWr >= 55
                                    ? "hsl(var(--winrate-good))"
                                    : lookupWr <= 45
                                    ? "hsl(var(--winrate-bad))"
                                    : "hsl(var(--winrate-neutral))",
                              }}
                            >
                              {lookupWr}%
                            </div>
                          ) : lookupOpponent ? (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {t("meta.noMatchupData")}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Favorable matchups */}
                      {selectedMatchups.favorable.length > 0 && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3 text-green-400" />
                            {t("meta.favorable")} ({selectedMatchups.favorable.length})
                          </div>
                          <div className="grid grid-cols-1 gap-0.5">
                            {selectedMatchups.favorable.slice(0, 5).map(m => (
                              <div key={m.name} className="flex items-center justify-between text-xs py-0.5">
                                <span className="text-foreground truncate">{m.name}</span>
                                <WrColor wr={m.wr} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Unfavorable matchups */}
                      {selectedMatchups.unfavorable.length > 0 && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                            <ArrowDownRight className="h-3 w-3 text-red-400" />
                            {t("meta.unfavorable")} ({selectedMatchups.unfavorable.length})
                          </div>
                          <div className="grid grid-cols-1 gap-0.5">
                            {selectedMatchups.unfavorable.slice(0, 5).map(m => (
                              <div key={m.name} className="flex items-center justify-between text-xs py-0.5">
                                <span className="text-foreground truncate">{m.name}</span>
                                <WrColor wr={m.wr} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* All matchups summary */}
                      {selectedMatchups.all.length > 0 && (
                        <details className="group">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                            {t("meta.allMatchups")} ({selectedMatchups.all.length})
                          </summary>
                          <div className="mt-1.5 grid grid-cols-1 gap-0.5 max-h-40 overflow-y-auto">
                            {selectedMatchups.all.map(m => (
                              <div key={m.name} className="flex items-center justify-between text-xs py-0.5">
                                <span className="text-foreground truncate">{m.name}</span>
                                <WrColor wr={m.wr} />
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
