import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Trophy, ShieldAlert, Target, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import {
  getWinrate,
  calculateBanStrategy,
  allArchetypes,
  archetypeList,
  getArchetypeInfo,
  type BanOption,
} from "@/data/matchups";

type DeckMode = 3 | 4;

const TournamentStrategist = () => {
  const [mode, setMode] = useState<DeckMode>(3);
  const [myArchetype, setMyArchetype] = useState<string>("");
  const [oppArchetypes, setOppArchetypes] = useState<string[]>(["", "", ""]);
  const [result, setResult] = useState<{
    myArchetype: string;
    oppArchetypes: string[];
    winrates: (number | null)[];
    banOptions: BanOption[];
  } | null>(null);

  const handleModeChange = (newMode: DeckMode) => {
    setMode(newMode);
    if (newMode === 4 && oppArchetypes.length === 3) {
      setOppArchetypes([...oppArchetypes, ""]);
    } else if (newMode === 3 && oppArchetypes.length === 4) {
      setOppArchetypes(oppArchetypes.slice(0, 3));
    }
    setResult(null);
  };

  const updateOppArchetype = (index: number, value: string) => {
    const updated = [...oppArchetypes];
    updated[index] = value;
    setOppArchetypes(updated);
  };

  const handleCalculate = () => {
    if (!myArchetype || oppArchetypes.some((a) => !a)) return;

    const winrates = oppArchetypes.map((opp) => getWinrate(myArchetype, opp));
    const banOptions = calculateBanStrategy(myArchetype, oppArchetypes);

    setResult({ myArchetype, oppArchetypes, winrates, banOptions });
  };

  const getWinrateColor = (wr: number | null) => {
    if (wr === null) return "text-muted-foreground";
    if (wr >= 55) return "text-winrate-good";
    if (wr >= 45) return "text-winrate-neutral";
    return "text-winrate-bad";
  };

  const getWinrateBg = (wr: number | null) => {
    if (wr === null) return "bg-secondary/50";
    if (wr >= 55) return "bg-winrate-good/15";
    if (wr >= 45) return "bg-winrate-neutral/15";
    return "bg-winrate-bad/15";
  };

  const allFilled = myArchetype && oppArchetypes.every((a) => a);

  return (
    <div className="min-h-screen bg-background">
      <ManaLensNavbar />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Турнирный <span className="text-primary">стратег</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Данные с HSGuru · Legend · Текущий патч
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-3 mb-8"
        >
          {[3, 4].map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m as DeckMode)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {m} колоды
            </button>
          ))}
        </motion.div>

        {/* My Archetype */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <label className="block text-sm font-medium text-foreground mb-2">
            <Swords className="inline h-4 w-4 mr-1.5 text-primary" />
            Твоя колода
          </label>
          <ArchetypeSelect value={myArchetype} onChange={setMyArchetype} placeholder="Выбери свой архетип..." />
        </motion.div>

        {/* Opponent Archetypes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 space-y-3"
        >
          <label className="block text-sm font-medium text-foreground">
            <Target className="inline h-4 w-4 mr-1.5 text-destructive" />
            Колоды противника
          </label>
          {oppArchetypes.map((arch, i) => (
            <ArchetypeSelect
              key={i}
              value={arch}
              onChange={(val) => updateOppArchetype(i, val)}
              placeholder={`Колода ${i + 1} противника...`}
            />
          ))}
        </motion.div>

        {/* Calculate Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-10"
        >
          <Button
            onClick={handleCalculate}
            disabled={!allFilled}
            className="w-full gap-2 h-12 text-base font-semibold"
          >
            <Trophy className="h-5 w-5" />
            Рассчитать стратегию бана
          </Button>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Winrate Matrix */}
              <Card className="bg-card border-border overflow-hidden">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Матрица винрейтов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                            Твоя колода
                          </th>
                          {result.oppArchetypes.map((opp, i) => (
                            <th key={i} className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">
                              <div>{opp}</div>
                              <div className="text-[10px] opacity-60">
                                {getArchetypeInfo(opp)?.popularity}% meta
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border">
                          <td className="py-3 px-3 font-medium text-primary">
                            <div>{result.myArchetype}</div>
                            <div className="text-[10px] text-muted-foreground">
                              WR: {getArchetypeInfo(result.myArchetype)?.winrate}%
                            </div>
                          </td>
                          {result.winrates.map((wr, i) => (
                            <td
                              key={i}
                              className={`py-3 px-3 text-center font-bold ${getWinrateColor(wr)} ${getWinrateBg(wr)} rounded`}
                            >
                              {wr !== null ? `${wr}%` : "—"}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {result.winrates.some((w) => w === null) && (
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      «—» означает недостаточно данных (менее 500 игр в матчапе)
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Ban Recommendation */}
              <Card className="bg-card border-border border-l-4 border-l-destructive">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                    Рекомендация по бану
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.banOptions.map((option, i) => {
                    const directWr = getWinrate(result.myArchetype, option.bannedArchetype);
                    return (
                      <div
                        key={i}
                        className={`p-4 rounded-lg ${
                          i === 0
                            ? "bg-destructive/10 border border-destructive/30"
                            : "bg-secondary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            {i === 0 ? (
                              <span className="text-lg">🔴</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">#{i + 1}</span>
                            )}
                            <span className={`font-medium ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}>
                              Забанить{" "}
                              <span className={i === 0 ? "text-destructive font-bold" : ""}>
                                {option.bannedArchetype}
                              </span>
                            </span>
                          </div>
                          <span className={`font-bold text-lg ${getWinrateColor(option.avgWinrate)}`}>
                            {option.avgWinrate}% avg
                          </span>
                        </div>
                        {i === 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Винрейт против {option.bannedArchetype}: {directWr !== null ? `${directWr}%` : "нет данных"}.
                            После бана средний винрейт: {option.avgWinrate}%
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// Компонент выбора архетипа
function ArchetypeSelect({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-secondary border-border text-foreground">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {archetypeList.map((arch) => (
          <SelectItem key={arch.name} value={arch.name}>
            <span className="flex items-center justify-between gap-3 w-full">
              <span>{arch.name}</span>
              <span className="text-xs text-muted-foreground ml-2">
                WR {arch.winrate}% · {arch.popularity}%
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default TournamentStrategist;
