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
              <div className="flex flex-col gap-3 p-3 rounded-lg bg-secondary/50">
                {/* Deck 1 vs Deck 2 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground truncate max-w-[120px]">{deck1}</span>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className={`font-mono font-semibold text-lg ${getWinrateColor(matchup1vs2)}`}>
                      {matchup1vs2.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Deck 2 vs Deck 1 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground truncate max-w-[120px]">{deck2}</span>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className={`font-mono font-semibold text-lg ${getWinrateColor(matchup2vs1)}`}>
                      {matchup2vs1.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Summary */}
                <div className="pt-2 border-t border-border text-center">
                  {matchup1vs2 > 52 ? (
                    <span className="text-sm text-green-500 font-medium">
                      {deck1} {t("meta.favorable").toLowerCase()}
                    </span>
                  ) : matchup1vs2 < 48 ? (
                    <span className="text-sm text-red-500 font-medium">
                      {deck2} {t("meta.favorable").toLowerCase()}
                    </span>
                  ) : (
                    <span className="text-sm text-yellow-500 font-medium">
                      ~50/50
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-2">
                {t("meta.noMatchupData")}
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
