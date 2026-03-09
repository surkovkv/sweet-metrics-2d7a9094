import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Trophy, Heart, Crosshair, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { type ArchetypeInfo } from "@/data/matchups";
import { getTier } from "./MetaChart";
import { useT } from "@/i18n/useTranslation";
import { toast } from "sonner";

interface AIAnalysis {
  top5: { rank: number; name: string; winrate: number; reason: string }[];
  metaHealth: string;
  counterMetaTip: string;
}

interface Props {
  archetypes: ArchetypeInfo[];
  matchupDB: Record<string, Record<string, number>>;
}

export default function MetaAIInsights({ archetypes, matchupDB }: Props) {
  const t = useT();
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [rawContent, setRawContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (archetypes.length === 0) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setRawContent(null);

    try {
      // Build matchup summary (top matchups for top 10 decks)
      const top10 = [...archetypes].sort((a, b) => b.popularity - a.popularity).slice(0, 10);
      const matchupSummary = top10.map(arch => {
        const matchups = matchupDB[arch.name];
        if (!matchups) return `${arch.name}: no matchup data`;
        const entries = Object.entries(matchups)
          .filter(([name]) => name !== arch.name)
          .sort(([, a], [, b]) => b - a);
        const best = entries.slice(0, 3).map(([n, w]) => `${n} ${w}%`).join(", ");
        const worst = entries.slice(-3).map(([n, w]) => `${n} ${w}%`).join(", ");
        return `${arch.name}: best vs [${best}], worst vs [${worst}]`;
      }).join("\n");

      const { data, error: fnError } = await supabase.functions.invoke("meta-ai-insights", {
        body: { archetypes: archetypes.slice(0, 20), matchupSummary },
      });

      if (fnError) {
        // Check for rate limit or payment errors
        if (fnError.message?.includes("429")) {
          toast.error("Rate limit exceeded. Try again in a minute.");
          throw new Error("Rate limit exceeded");
        }
        if (fnError.message?.includes("402")) {
          toast.error("AI credits exhausted.");
          throw new Error("Payment required");
        }
        throw fnError;
      }

      if (data?.analysis) {
        setAnalysis(data.analysis);
      } else if (data?.rawContent) {
        setRawContent(data.rawContent);
      } else {
        throw new Error("No analysis data received");
      }
    } catch (err) {
      console.error("AI analysis error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {t("meta.aiInsights")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!analysis && !rawContent && !loading && !error && (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground mb-3">
              {t("meta.top5Climb")}
            </p>
            <Button
              onClick={handleAnalyze}
              size="sm"
              className="gap-2"
              disabled={archetypes.length === 0}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t("meta.aiAnalyze")}
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("meta.aiLoading")}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive py-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{t("meta.aiError")}: {error}</span>
          </div>
        )}

        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Top 5 decks */}
            {analysis.top5 && analysis.top5.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Trophy className="h-3 w-3 text-primary" />
                  {t("meta.top5Ladder")}
                </div>
                <div className="space-y-2">
                  {analysis.top5.map((deck, i) => {
                    const tier = getTier(deck.winrate);
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-2 rounded-md bg-secondary/50"
                      >
                        <span
                          className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: tier.color, color: "hsl(var(--background))" }}
                        >
                          {deck.rank}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{deck.name}</span>
                            <span className="font-mono text-xs" style={{ color: tier.color }}>
                              {deck.winrate}%
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                            {deck.reason}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Meta health */}
            {analysis.metaHealth && (
              <div>
                <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Heart className="h-3 w-3 text-primary" />
                  {t("meta.metaHealth")}
                </div>
                <p className="text-xs text-foreground leading-relaxed bg-secondary/30 p-2 rounded-md">
                  {analysis.metaHealth}
                </p>
              </div>
            )}

            {/* Counter tip */}
            {analysis.counterMetaTip && (
              <div>
                <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Crosshair className="h-3 w-3 text-primary" />
                  {t("meta.counterTip")}
                </div>
                <p className="text-xs text-foreground leading-relaxed bg-secondary/30 p-2 rounded-md">
                  {analysis.counterMetaTip}
                </p>
              </div>
            )}

            {/* Re-analyze button */}
            <Button onClick={handleAnalyze} size="sm" variant="outline" className="w-full gap-2 text-xs">
              <Sparkles className="h-3 w-3" />
              {t("meta.aiAnalyze")}
            </Button>
          </motion.div>
        )}

        {/* Fallback: raw content from AI */}
        {rawContent && !analysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="prose prose-sm prose-invert max-w-none"
          >
            <pre className="text-xs text-foreground whitespace-pre-wrap bg-secondary/30 p-3 rounded-md max-h-64 overflow-y-auto">
              {rawContent}
            </pre>
            <Button onClick={handleAnalyze} size="sm" variant="outline" className="w-full gap-2 text-xs mt-3">
              <Sparkles className="h-3 w-3" />
              {t("meta.aiAnalyze")}
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
