import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type ArchetypeInfo } from "@/data/matchups";
import { useT } from "@/i18n/useTranslation";

interface Props {
  archetypes: ArchetypeInfo[];
  matchupDB: Record<string, Record<string, number>>;
}

function getWinrateColor(wr: number): string {
  if (wr >= 55) return "text-emerald-500";
  if (wr >= 50) return "text-amber-500";
  if (wr >= 45) return "text-orange-500";
  return "text-rose-500";
}

export default function DeckComparison({ archetypes, matchupDB }: Props) {
  const t = useT();
  const [deck1, setDeck1] = useState<string>("");
  const [deck2, setDeck2] = useState<string>("");

  const matchup1vs2 = deck1 && deck2 ? matchupDB[deck1]?.[deck2] : null;
  const matchup2vs1 = deck1 && deck2 ? matchupDB[deck2]?.[deck1] : null;

  const sortedArchetypes = [...archetypes].sort((a, b) => b.popularity - a.popularity);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-primary" />
          {t("meta.deckComparison")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Deck 1 selector */}
          <Select value={deck1} onValueChange={setDeck1}>
            <SelectTrigger className="w-full sm:w-48 bg-secondary border-border h-9 text-sm">
              <SelectValue placeholder={t("meta.selectOpponent")} />
            </SelectTrigger>
            <SelectContent>
              {sortedArchetypes.map(arch => (
                <SelectItem key={arch.name} value={arch.name}>{arch.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* VS indicator */}
          <div className="text-muted-foreground text-sm font-semibold shrink-0">vs</div>

          {/* Deck 2 selector */}
          <Select value={deck2} onValueChange={setDeck2}>
            <SelectTrigger className="w-full sm:w-48 bg-secondary border-border h-9 text-sm">
              <SelectValue placeholder={t("meta.selectOpponent")} />
            </SelectTrigger>
            <SelectContent>
              {sortedArchetypes.map(arch => (
                <SelectItem key={arch.name} value={arch.name}>{arch.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Result */}
        {deck1 && deck2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            {matchup1vs2 !== null && matchup2vs1 !== null ? (
              <div className="flex flex-col gap-4 p-4 rounded-xl bg-secondary/30 border border-border shadow-inner">
                {/* Deck 1's Perspective */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">{deck1}</span>
                    <span className={`font-bold text-sm tracking-wide ${getWinrateColor(matchup1vs2)}`}>
                      {matchup1vs2.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-background overflow-hidden">
                    <div className={`h-full ${matchup1vs2 >= 50 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${matchup1vs2}%` }} />
                  </div>
                </div>

                {/* Deck 2's Perspective */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">{deck2}</span>
                    <span className={`font-bold text-sm tracking-wide ${getWinrateColor(matchup2vs1)}`}>
                      {matchup2vs1.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-background overflow-hidden">
                    <div className={`h-full ${matchup2vs1 >= 50 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${matchup2vs1}%` }} />
                  </div>
                </div>

                {/* Summary Ribbon */}
                <div className="mt-2 text-center text-xs font-medium tracking-wide border-t border-border pt-3">
                  {matchup1vs2 > 52 ? (
                    <span className="text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      {deck1} {t("meta.favorable").toLowerCase()}
                    </span>
                  ) : matchup1vs2 < 48 ? (
                    <span className="text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                      {deck2} {t("meta.favorable").toLowerCase()}
                    </span>
                  ) : (
                    <span className="text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                      ~50/50 Even Matchup
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-6 border border-dashed border-border rounded-xl bg-secondary/20">
                {t("meta.noMatchupData")}
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
