import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DAILY_LIMIT = 5;

function getTodayKey() {
  return `promptcraft_count_${new Date().toISOString().slice(0, 10)}`;
}

function getUsageToday(): number {
  return parseInt(localStorage.getItem(getTodayKey()) || "0", 10);
}

function incrementUsage() {
  const key = getTodayKey();
  localStorage.setItem(key, String(getUsageToday() + 1));
}

export default function PromptCraft() {
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(DAILY_LIMIT - getUsageToday());
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setRemaining(DAILY_LIMIT - getUsageToday());
  }, []);

  const generate = async () => {
    if (!idea.trim()) return;
    if (getUsageToday() >= DAILY_LIMIT) {
      setShowLimitModal(true);
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const { data, error } = await supabase.functions.invoke("generate-prompt", {
        body: { idea: idea.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data.prompt);
      incrementUsage();
      setRemaining(DAILY_LIMIT - getUsageToday());
    } catch (e: any) {
      toast({
        title: "Ошибка",
        description: e.message || "Не удалось сгенерировать промт",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-semibold text-foreground tracking-tight">
            Prompt<span className="text-primary">Craft</span>
          </span>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Войти
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-6 py-16">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Генератор промтов для Midjourney
            </h1>
            <p className="text-muted-foreground">
              Опиши идею на русском или английском — получи идеальный промт
            </p>
          </div>

          <div className="space-y-4">
            <Textarea
              placeholder="Например: рыжий кот в космосе, киберпанк, 8 бит"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="min-h-[120px] text-base resize-none"
            />

            <Button
              onClick={generate}
              disabled={loading || !idea.trim()}
              className="w-full h-12 text-base font-medium"
            >
              {loading ? "Генерирую..." : "✨ Сгенерировать промт"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Осталось {remaining} бесплатных генераций сегодня
            </p>
          </div>

          {result && (
            <Card className="shadow-lg border border-border" style={{ borderRadius: 12 }}>
              <CardContent className="p-6 space-y-4">
                <p className="font-mono text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {result}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                >
                  {copied ? "✅ Скопировано!" : "📋 Копировать"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors">
            Купить доступ
          </a>
          <span>© 2024 PromptCraft</span>
        </div>
      </footer>

      {/* Limit modal */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Лимит исчерпан</DialogTitle>
            <DialogDescription>
              Бесплатные генерации закончились. Купи доступ на месяц за 200₽
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-2">
            <Button asChild>
              <a href="https://t.me/promptcraft_bot" target="_blank" rel="noopener noreferrer">
                Написать в Telegram
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
