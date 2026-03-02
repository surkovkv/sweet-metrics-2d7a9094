import { DeckInfo, getManaCurve, getDustCost, getTypeCounts } from "@/utils/deckCode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Sparkles, Shield, Wand2, ArrowUp, ArrowDown, Equal } from "lucide-react";

interface Props {
  deck1: DeckInfo;
  deck2: DeckInfo;
}

function Diff({ a, b, label, suffix = "" }: { a: number; b: number; label: string; suffix?: string }) {
  const diff = a - b;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-foreground font-mono">{a}{suffix}</span>
        <span className="text-muted-foreground">vs</span>
        <span className="text-foreground font-mono">{b}{suffix}</span>
        {diff > 0 && <ArrowUp className="h-3 w-3 text-green-400" />}
        {diff < 0 && <ArrowDown className="h-3 w-3 text-red-400" />}
        {diff === 0 && <Equal className="h-3 w-3 text-muted-foreground" />}
      </div>
    </div>
  );
}

function MiniChart({ deck, color }: { deck: DeckInfo; color: string }) {
  const manaCurve = getManaCurve(deck.cards);
  const chartData = Object.entries(manaCurve).map(([mana, count]) => ({ mana, count }));

  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="mana" stroke="hsl(var(--muted-foreground))" fontSize={10} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
            }}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={color} opacity={0.7 + (i * 0.04)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DeckCompare({ deck1, deck2 }: Props) {
  const dust1 = getDustCost(deck1.cards);
  const dust2 = getDustCost(deck2.cards);
  const types1 = getTypeCounts(deck1.cards);
  const types2 = getTypeCounts(deck2.cards);
  const legendaries1 = deck1.cards.filter(c => c.rarity === "legendary").reduce((s, c) => s + c.count, 0);
  const legendaries2 = deck2.cards.filter(c => c.rarity === "legendary").reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-6">
      {/* Summary comparison */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">Сравнение</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 text-center text-sm mb-4">
            <div className="text-primary font-semibold">{deck1.archetype}</div>
            <div className="text-muted-foreground">vs</div>
            <div className="text-primary font-semibold">{deck2.archetype}</div>
          </div>
          <Diff a={dust1} b={dust2} label="Пыль" />
          <Diff a={types1.minion} b={types2.minion} label="Существа" />
          <Diff a={types1.spell} b={types2.spell} label="Заклинания" />
          <Diff a={legendaries1} b={legendaries2} label="Легендарные" />
          <Diff a={deck1.cards.length} b={deck2.cards.length} label="Уник. карт" />
        </CardContent>
      </Card>

      {/* Side-by-side mana curves */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm text-primary">{deck1.archetype}</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniChart deck={deck1} color="hsl(var(--primary))" />
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm text-primary">{deck2.archetype}</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniChart deck={deck2} color="hsl(142 71% 55%)" />
          </CardContent>
        </Card>
      </div>

      {/* Shared / unique cards */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">Общие карты</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const names1 = new Set(deck1.cards.map(c => c.name));
            const names2 = new Set(deck2.cards.map(c => c.name));
            const shared = [...names1].filter(n => names2.has(n));
            const only1 = [...names1].filter(n => !names2.has(n));
            const only2 = [...names2].filter(n => !names1.has(n));

            return (
              <div className="space-y-4">
                {shared.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Совпадают ({shared.length})</div>
                    <div className="flex flex-wrap gap-1.5">
                      {shared.map(n => (
                        <span key={n} className="px-2 py-1 text-xs rounded bg-primary/10 text-primary">{n}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {only1.length > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Только в {deck1.archetype} ({only1.length})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {only1.map(n => (
                          <span key={n} className="px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">{n}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {only2.length > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Только в {deck2.archetype} ({only2.length})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {only2.map(n => (
                          <span key={n} className="px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">{n}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
