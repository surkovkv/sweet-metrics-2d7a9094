import { motion } from "framer-motion";
import { Check, Crown, Zap, BarChart2, Shield, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const FREE_FEATURES = [
  "Матрица матчапов (до 3 колод)",
  "Рекомендация по бану",
  "Live Meta-трекер",
  "Отправка новостей на модерацию",
  "Раздел вопросов/идей",
];

const PRO_FEATURES = [
  "Всё из FREE плана",
  "Матрица матчапов (3 и 4 колоды)",
  "Прогноз бана соперника",
  "Оптимальная колода для первого матча",
  "Ручной выбор своего бана",
  "Ранний доступ к новым функциям",
  "Приоритетная поддержка",
];

const Upgrade = () => {
  const { user, profile } = useAuth();
  const isPro = profile?.is_pro ?? false;

  return (
    <div className="min-h-screen bg-background">
      <ManaLensNavbar />
      <main className="container mx-auto px-4 pt-28 pb-12 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              <Crown className="h-4 w-4" />
              Тарифные планы
            </div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-3">
              Выбери свой <span className="text-primary">план</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              FREE — для знакомства с возможностями.<br />
              PRO — для серьёзных турнирных игроков.
            </p>
          </div>

          {/* Current status banner */}
          {user && isPro && (
            <div className="mb-8 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
              <Crown className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-primary">У тебя активен PRO план</p>
                <p className="text-sm text-muted-foreground">Все функции разблокированы. Спасибо за поддержку!</p>
              </div>
            </div>
          )}

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

            {/* FREE */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  Free
                </CardTitle>
                <p className="text-3xl font-bold text-foreground">0₽<span className="text-sm text-muted-foreground font-normal">/навсегда</span></p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {user ? (
                  <Button variant="outline" className="w-full" disabled={!isPro}>
                    {isPro ? "Текущий (без PRO)" : "Текущий план"}
                  </Button>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" className="w-full gap-2">
                      Зарегистрироваться
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* PRO */}
            <Card className={`bg-card border-primary/50 ring-1 ring-primary/20 relative overflow-hidden ${isPro ? "ring-2 ring-primary/50" : ""}`}>
              {/* Popular badge */}
              <div className="absolute top-4 right-4">
                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {isPro ? "Активен" : "Популярный"}
                </span>
              </div>

              {/* Subtle glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

              <CardHeader className="relative">
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" /> Pro
                </CardTitle>
                <p className="text-3xl font-bold text-foreground">299₽<span className="text-sm text-muted-foreground font-normal">/месяц</span></p>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-3 mb-6">
                  {PRO_FEATURES.map((f, i) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 shrink-0 ${i === 0 ? "text-muted-foreground" : "text-primary"}`} />
                      <span className={i === 0 ? "text-muted-foreground" : "text-foreground"}>{f}</span>
                    </li>
                  ))}
                </ul>

                {isPro ? (
                  <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                    <Crown className="h-4 w-4" /> PRO активирован
                  </div>
                ) : (
                  <Button
                    className="w-full gap-2 shadow-lg shadow-primary/25"
                    onClick={() => window.open("https://t.me/tourneyhelper_bot", "_blank")}
                  >
                    <Crown className="h-4 w-4" />
                    Оформить Pro
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Feature comparison highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: <BarChart2 className="h-5 w-5" />,
                title: "Прогноз бана соперника",
                desc: "Узнай, какую из твоих колод противник скорее всего забанит — подготовься заранее.",
              },
              {
                icon: <Star className="h-5 w-5" />,
                title: "Оптимальная первая колода",
                desc: "ИИ рассчитает лучшую колоду для первого матча с учётом всех банов.",
              },
              {
                icon: <Shield className="h-5 w-5" />,
                title: "Ручной выбор бана",
                desc: "Укажи, кого именно ты хочешь забанить — стратегия мгновенно обновится.",
              },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-card border border-border">
                <div className="text-primary mb-2">{item.icon}</div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

        </motion.div>
      </main>
    </div>
  );
};

export default Upgrade;
