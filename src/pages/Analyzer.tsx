import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Copy, Check, Sparkles, Shield, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { decodeDeck, getManaCurve, getDustCost, getTypeCounts, DeckInfo } from "@/utils/deckCode";
import { archetypeList } from "@/data/matchups";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function getTier(winrate: number): { tier: string; color: string } {
  if (winrate >= 54) return { tier: "S", color: "hsl(var(--winrate-good))" };
  if (winrate >= 52) return { tier: "A", color: "hsl(142 71% 55%)" };
  if (winrate >= 50) return { tier: "B", color: "hsl(var(--winrate-neutral))" };
  if (winrate >= 48) return { tier: "C", color: "hsl(25 95% 53%)" };
  return { tier: "D", color: "hsl(var(--winrate-bad))" };
}

const Analyzer = () => {
  const [deckCode, setDeckCode] = useState("");
  const [deckInfo, setDeckInfo] = useState<DeckInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = () => {
    if (!deckCode.trim()) return;
    const info = decodeDeck(deckCode);
    setDeckInfo(info);
  };

  const handleCopy = () => {
    if (!deckInfo) return;
    const text = deckInfo.cards.map((c) => `${c.count}x ${c.name} (${c.manaCost})`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const manaCurve = deckInfo ? getManaCurve(deckInfo.cards) : null;
  const dustCost = deckInfo ? getDustCost(deckInfo.cards) : 0;
  const typeCounts = deckInfo ? getTypeCounts(deckInfo.cards) : null;

  const chartData = manaCurve
    ? Object.entries(manaCurve).map(([mana, count]) => ({ mana, count }))
    : [];

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
            Анализатор <span className="text-primary">колоды</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Вставь deck code — получи полный разбор: мана-кривая, карты, стоимость в пыли
          </p>
        </motion.div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 mb-10"
        >
          <Input
            value={deckCode}
            onChange={(e) => setDeckCode(e.target.value)}
            placeholder="Вставь deck code, например: AAECAQcG..."
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button onClick={handleAnalyze} className="shrink-0 gap-2">
            <Search className="h-4 w-4" />
            Анализ
          </Button>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {deckInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Header */}
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="font-display text-xl text-primary">
                      {deckInfo.archetype}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{deckInfo.heroClass}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {dustCost} пыли
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      {typeCounts?.minion} существ
                    </span>
                    <span className="flex items-center gap-1">
                      <Wand2 className="h-4 w-4" />
                      {typeCounts?.spell} заклинаний
                    </span>
                  </div>
                </CardHeader>
              </Card>

              {/* Mana Curve Chart */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Мана-кривая</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="mana" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {chartData.map((_, i) => (
                            <Cell key={i} fill="hsl(var(--primary))" opacity={0.7 + (i * 0.04)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Archetype Strength */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Сила архетипа в мете</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const archInfo = archetypeList.find(a => a.name === deckInfo.archetype);
                    if (!archInfo) return (
                      <p className="text-sm text-muted-foreground">Архетип не найден в текущей мете</p>
                    );
                    const { tier, color } = getTier(archInfo.winrate);
                    return (
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold"
                          style={{ backgroundColor: color, color: "hsl(var(--background))" }}
                        >
                          {tier}
                        </div>
                        <div>
                          <div className="text-foreground font-semibold">{archInfo.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Винрейт: {archInfo.winrate}% · Популярность: {archInfo.popularity}%
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Rarity Breakdown */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Распределение по редкости</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {(["legendary", "epic", "rare", "common"] as const).map((r) => {
                      const count = deckInfo.cards.filter(c => c.rarity === r).reduce((s, c) => s + c.count, 0);
                      const labels: Record<string, string> = { legendary: "Легенд.", epic: "Эпич.", rare: "Редкие", common: "Обычные" };
                      const colors: Record<string, string> = { legendary: "bg-primary/20 text-primary", epic: "bg-purple-500/20 text-purple-400", rare: "bg-blue-500/20 text-blue-400", common: "bg-secondary text-muted-foreground" };
                      return (
                        <div key={r} className={`flex-1 rounded-lg p-3 text-center ${colors[r]}`}>
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-xs mt-1">{labels[r]}</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Card List */}
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-display text-lg">Список карт</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Скопировано" : "Копировать"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {deckInfo.cards
                      .sort((a, b) => a.manaCost - b.manaCost)
                      .map((card, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-3 py-2 rounded-md bg-secondary/50 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                              {card.manaCost}
                            </span>
                            <span className="text-foreground">{card.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              card.rarity === "legendary" ? "bg-primary/20 text-primary" :
                              card.rarity === "epic" ? "bg-purple-500/20 text-purple-400" :
                              card.rarity === "rare" ? "bg-blue-500/20 text-blue-400" :
                              "bg-secondary text-muted-foreground"
                            }`}>
                              {card.rarity}
                            </span>
                            <span className="text-muted-foreground">×{card.count}</span>
                          </div>
                        </div>
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

export default Analyzer;
