import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Plus, Trash2, Trophy, ShieldAlert, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import { decodeDeck } from "@/utils/deckCode";
import { getWinrate, calculateBanStrategy, allArchetypes, BanOption } from "@/data/matchups";

type DeckMode = 3 | 4;

const TournamentStrategist = () => {
  const [mode, setMode] = useState<DeckMode>(3);
  const [myDeckCode, setMyDeckCode] = useState("");
  const [oppDeckCodes, setOppDeckCodes] = useState<string[]>(["", "", ""]);
  const [result, setResult] = useState<{
    myArchetype: string;
    oppArchetypes: string[];
    winrates: number[];
    banOptions: BanOption[];
  } | null>(null);

  const handleModeChange = (newMode: DeckMode) => {
    setMode(newMode);
    if (newMode === 4 && oppDeckCodes.length === 3) {
      setOppDeckCodes([...oppDeckCodes, ""]);
    } else if (newMode === 3 && oppDeckCodes.length === 4) {
      setOppDeckCodes(oppDeckCodes.slice(0, 3));
    }
    setResult(null);
  };

  const updateOppDeck = (index: number, value: string) => {
    const updated = [...oppDeckCodes];
    updated[index] = value;
    setOppDeckCodes(updated);
  };

  const handleCalculate = () => {
    if (!myDeckCode.trim() || oppDeckCodes.some((c) => !c.trim())) return;

    const myDeck = decodeDeck(myDeckCode);
    const oppDecks = oppDeckCodes.map((c) => decodeDeck(c));
    const oppArchetypes = oppDecks.map((d) => d.archetype);

    const winrates = oppArchetypes.map((opp) => getWinrate(myDeck.archetype, opp));
    const banOptions = calculateBanStrategy(myDeck.archetype, oppArchetypes);

    setResult({
      myArchetype: myDeck.archetype,
      oppArchetypes,
      winrates,
      banOptions,
    });
  };

  const getWinrateColor = (wr: number) => {
    if (wr >= 55) return "text-winrate-good";
    if (wr >= 45) return "text-winrate-neutral";
    return "text-winrate-bad";
  };

  const getWinrateBg = (wr: number) => {
    if (wr >= 55) return "bg-winrate-good/15";
    if (wr >= 45) return "bg-winrate-neutral/15";
    return "bg-winrate-bad/15";
  };

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
            Рассчитай оптимальный бан — максимизируй шансы на победу
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

        {/* My Deck */}
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
          <Input
            value={myDeckCode}
            onChange={(e) => setMyDeckCode(e.target.value)}
            placeholder="Deck code твоей колоды..."
            className="bg-secondary border-border text-foreground"
          />
        </motion.div>

        {/* Opponent Decks */}
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
          {oppDeckCodes.map((code, i) => (
            <Input
              key={i}
              value={code}
              onChange={(e) => updateOppDeck(i, e.target.value)}
              placeholder={`Deck code колоды ${i + 1} противника...`}
              className="bg-secondary border-border text-foreground"
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
          <Button onClick={handleCalculate} className="w-full gap-2 h-12 text-base font-semibold">
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
                            <th key={i} className="text-center py-2 px-3 text-muted-foreground font-medium">
                              {opp}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border">
                          <td className="py-3 px-3 font-medium text-primary">
                            {result.myArchetype}
                          </td>
                          {result.winrates.map((wr, i) => (
                            <td
                              key={i}
                              className={`py-3 px-3 text-center font-bold ${getWinrateColor(wr)} ${getWinrateBg(wr)} rounded`}
                            >
                              {wr}%
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
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
                  {result.banOptions.map((option, i) => (
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
                          Самый плохой матчап — {getWinrate(result.myArchetype, option.bannedArchetype)}% винрейта. После бана средний винрейт: {option.avgWinrate}%
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Archetype Selector (alternative to deck codes) */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Быстрый выбор архетипа</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Нет deck code? Выбери архетип из списка
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {allArchetypes.map((arch) => (
                      <button
                        key={arch}
                        onClick={() => {
                          if (!myDeckCode) setMyDeckCode(arch);
                        }}
                        className="px-3 py-1.5 text-xs rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                      >
                        {arch}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default TournamentStrategist;
