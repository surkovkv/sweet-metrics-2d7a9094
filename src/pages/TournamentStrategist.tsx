import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Trophy, ShieldAlert, Target, Info, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import {
  getWinrate,
  getEstimatedGames,
  calculateMultiBanStrategy,
  allArchetypes,
  archetypeList,
  getArchetypeInfo,
  type BanOption,
} from "@/data/matchups";

type DeckMode = 3 | 4;

const TournamentStrategist = () => {
  const [mode, setMode] = useState<DeckMode>(3);
  const [myArchetypes, setMyArchetypes] = useState<string[]>(["", "", ""]);
  const [oppArchetypes, setOppArchetypes] = useState<string[]>(["", "", ""]);
  const [result, setResult] = useState<{
    myArchetypes: string[];
    oppArchetypes: string[];
    banOptions: BanOption[];
  } | null>(null);

  const handleModeChange = (newMode: DeckMode) => {
    setMode(newMode);
    const resize = (arr: string[]) =>
      newMode === 4 && arr.length === 3
        ? [...arr, ""]
        : newMode === 3 && arr.length === 4
        ? arr.slice(0, 3)
        : arr;
    setMyArchetypes(resize(myArchetypes));
    setOppArchetypes(resize(oppArchetypes));
    setResult(null);
  };

  const updateMyArchetype = (index: number, value: string) => {
    const updated = [...myArchetypes];
    updated[index] = value;
    setMyArchetypes(updated);
  };

  const updateOppArchetype = (index: number, value: string) => {
    const updated = [...oppArchetypes];
    updated[index] = value;
    setOppArchetypes(updated);
  };

  const handleCalculate = () => {
    if (myArchetypes.some((a) => !a) || oppArchetypes.some((a) => !a)) return;
    const banOptions = calculateMultiBanStrategy(myArchetypes, oppArchetypes);
    setResult({ myArchetypes, oppArchetypes, banOptions });
  };

  const allFilled = myArchetypes.every((a) => a) && oppArchetypes.every((a) => a);

  return (
    <div className="min-h-screen bg-background">
      <ManaLensNavbar />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
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

        {/* Deck Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* My Decks */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="block text-sm font-medium text-foreground mb-3">
              <Swords className="inline h-4 w-4 mr-1.5 text-primary" />
              Твои колоды
            </label>
            <div className="space-y-3">
              {myArchetypes.map((arch, i) => (
                <ArchetypeSelect
                  key={`my-${i}`}
                  value={arch}
                  onChange={(val) => updateMyArchetype(i, val)}
                  placeholder={`Колода ${i + 1}...`}
                />
              ))}
            </div>
          </motion.div>

          {/* Opponent Decks */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-sm font-medium text-foreground mb-3">
              <Target className="inline h-4 w-4 mr-1.5 text-destructive" />
              Колоды противника
            </label>
            <div className="space-y-3">
              {oppArchetypes.map((arch, i) => (
                <ArchetypeSelect
                  key={`opp-${i}`}
                  value={arch}
                  onChange={(val) => updateOppArchetype(i, val)}
                  placeholder={`Колода ${i + 1} противника...`}
                />
              ))}
            </div>
          </motion.div>
        </div>

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
            Рассчитать стратегию
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
              {/* Full Matchup Matrix */}
              <MatchupMatrix
                myArchetypes={result.myArchetypes}
                oppArchetypes={result.oppArchetypes}
              />

              {/* Ban Recommendation */}
              <Card className="bg-card border-border border-l-4 border-l-destructive">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                    Рекомендация по бану
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.banOptions.map((option, i) => (
                    <BanOptionCard
                      key={i}
                      option={option}
                      index={i}
                      myArchetypes={result.myArchetypes}
                    />
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// Matchup Matrix Component
function MatchupMatrix({
  myArchetypes,
  oppArchetypes,
}: {
  myArchetypes: string[];
  oppArchetypes: string[];
}) {
  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          Матрица матчапов
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">
                  Ты ↓ / Противник →
                </th>
                {oppArchetypes.map((opp, i) => (
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
              {myArchetypes.map((my, rowIdx) => (
                <tr key={rowIdx} className="border-t border-border">
                  <td className="py-3 px-3 font-medium text-primary">
                    <div>{my}</div>
                    <div className="text-[10px] text-muted-foreground">
                      WR: {getArchetypeInfo(my)?.winrate}%
                    </div>
                  </td>
                  {oppArchetypes.map((opp, colIdx) => {
                    const wr = getWinrate(my, opp);
                    const games = getEstimatedGames(my, opp);
                    return (
                      <td
                        key={colIdx}
                        className={`py-3 px-3 text-center ${getWinrateBg(wr)} rounded`}
                      >
                        <div className={`font-bold ${getWinrateColor(wr)}`}>
                          {wr !== null ? `${wr}%` : "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {games !== null ? `~${games} игр` : "< 500"}
                        </div>
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
          «—» — менее 500 игр · Кол-во игр оценка на основе популярности
        </p>
      </CardContent>
    </Card>
  );
}

// Ban Option Card
function BanOptionCard({
  option,
  index,
  myArchetypes,
}: {
  option: BanOption;
  index: number;
  myArchetypes: string[];
}) {
  const directWrs = myArchetypes.map((my) => getWinrate(my, option.bannedArchetype));
  const worstWr = directWrs.filter((w): w is number => w !== null);
  const bestAgainst = worstWr.length > 0 ? Math.min(...worstWr) : null;

  return (
    <div
      className={`p-4 rounded-lg ${
        index === 0
          ? "bg-destructive/10 border border-destructive/30"
          : "bg-secondary/50"
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {index === 0 ? (
            <span className="text-lg">🔴</span>
          ) : (
            <span className="text-muted-foreground text-sm">#{index + 1}</span>
          )}
          <span className={`font-medium ${index === 0 ? "text-foreground" : "text-muted-foreground"}`}>
            Забанить{" "}
            <span className={index === 0 ? "text-destructive font-bold" : ""}>
              {option.bannedArchetype}
            </span>
          </span>
        </div>
        <span className={`font-bold text-lg ${getWinrateColor(option.avgWinrate)}`}>
          {option.avgWinrate}%
        </span>
      </div>
      {index === 0 && (
        <p className="text-sm text-muted-foreground mt-2">
          Худший винрейт среди ваших колод против {option.bannedArchetype}:{" "}
          {bestAgainst !== null ? `${bestAgainst}%` : "нет данных"}.
          После бана ваш средний лучший винрейт: {option.avgWinrate}%
        </p>
      )}
    </div>
  );
}

// Archetype Select
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

// Utility functions
function getWinrateColor(wr: number | null) {
  if (wr === null) return "text-muted-foreground";
  if (wr >= 55) return "text-winrate-good";
  if (wr >= 45) return "text-winrate-neutral";
  return "text-winrate-bad";
}

function getWinrateBg(wr: number | null) {
  if (wr === null) return "bg-secondary/50";
  if (wr >= 55) return "bg-winrate-good/15";
  if (wr >= 45) return "bg-winrate-neutral/15";
  return "bg-winrate-bad/15";
}

export default TournamentStrategist;
