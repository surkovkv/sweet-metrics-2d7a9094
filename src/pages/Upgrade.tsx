import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Brain, Target, History, Zap, ArrowRight, Star, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const FREE_FEATURES = [
  "Калькулятор банов: 3 расчёта (пробные)",
  "Таблица матчапов с базовыми фильтрами",
  "Рекомендация одного бана",
  "Данные ранга All / Legend",
  "Раздел вопросов и идей",
];

const DAYPASS_FEATURES = [
  "Полный функционал Tournament Prep",
  "Безлимитные расчёты в калькуляторе",
  "ИИ-рекомендации и прогноз бана соперника",
  "Все ранги и периоды",
  "Автоматически отключается через 24 часа",
];

const LEGENDARY_FEATURES = [
  { text: "ИИ подскажет твой лучший бан", highlight: true },
  { text: "Прогноз бана соперника", highlight: false },
  { text: "Оптимальная колода для первого матча с учётом банов", highlight: false },
  { text: "Ручной режим бана + сохранение последнего расчёта", highlight: false },
  { text: "Все ранги: Diamond–Legend, Top 1K, Top 5K", highlight: false },
  { text: "Приоритетная поддержка в Telegram", highlight: false },
  { text: "Ранний доступ к новым функциям и данным", highlight: false },
];

const TIERS = [
  { id: "month", title: "Месяц", price: "199₽", per: "/мес", note: "Подписка, отмена в любой момент" },
  { id: "season", title: "Сезон (3 мес)", price: "399₽", per: "", note: "Экономия 33% — самый популярный", popular: true },
  { id: "year", title: "Год", price: "999₽", per: "", note: "Экономия 58% — для постоянных игроков" },
];

// Bronze 10 rank icon (FREE) — small hex with bronze gradient
const BronzeIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <span className={`inline-flex items-center justify-center ${className} rounded-md bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 border border-amber-600/60 shadow-inner`} aria-hidden />
);

// Legendary rank 1 icon — golden hex with "1"
const LegendaryIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <span className={`inline-flex items-center justify-center ${className} rounded-md bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 border border-yellow-300/80 shadow-[0_0_10px_rgba(250,204,21,0.4)] text-black font-display font-bold text-[10px]`}>1</span>
);

const Upgrade = () => {
  const { user, profile } = useAuth();
  const isPro = profile?.is_pro ?? false;

  return (
    <div className="min-h-screen bg-background">
      <ManaLensNavbar />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="text-center mb-10 page-title">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/15 border border-yellow-400/40 text-yellow-300 text-sm font-medium mb-4">
              <Crown className="h-4 w-4" /> Тарифные планы
            </div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-3">
              Выбери свой <span className="text-yellow-400">план</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              FREE — попробовать инструмент.<br />
              Day Pass — для одного турнирного дня.<br />
              Legendary — серьёзная подготовка с ИИ и без ограничений.
            </p>
          </div>

          {user && isPro && (
            <div className="mb-8 p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/40 flex items-center gap-3">
              <LegendaryIcon className="h-6 w-6" />
              <div>
                <p className="font-semibold text-yellow-300">У тебя активен Legendary</p>
                <p className="text-sm text-muted-foreground">Все функции разблокированы. Спасибо за поддержку!</p>
              </div>
            </div>
          )}

          {/* Three tiers grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* FREE */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <BronzeIcon /> Free
                </CardTitle>
                <p className="text-3xl font-bold text-foreground">
                  0₽<span className="text-sm text-muted-foreground font-normal">/навсегда</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Базовый доступ — для знакомства</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {user ? (
                  <Button variant="outline" className="w-full" disabled={!isPro}>
                    {isPro ? "Текущий (без Legendary)" : "Текущий план"}
                  </Button>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" className="w-full gap-2">Зарегистрироваться</Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* DAY PASS */}
            <Card className="relative overflow-hidden border-2 border-orange-400/60 bg-gradient-to-br from-orange-400/10 via-card to-card shadow-[0_0_30px_-12px_rgba(251,146,60,0.45)]">
              <div className="absolute top-4 right-4">
                <span className="bg-orange-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  На сегодня
                </span>
              </div>
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2 text-orange-300">
                  <Clock className="h-5 w-5" /> Day Pass
                </CardTitle>
                <p className="text-3xl font-bold text-foreground">
                  150₽<span className="text-sm text-muted-foreground font-normal">/24 часа</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Сегодня турнир? Полный доступ на день.</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {DAYPASS_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 shrink-0 mt-0.5 text-orange-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full gap-2 bg-orange-400 text-black hover:bg-orange-300 shadow-lg shadow-orange-500/30"
                  onClick={() => window.open("https://t.me/tourneyhelper_bot", "_blank")}
                >
                  <Clock className="h-4 w-4" /> Активировать на 24 часа
                </Button>
                <p className="text-[11px] text-muted-foreground text-center mt-2">
                  Идеально для одного турнирного дня. После — возврат к Free.
                </p>
              </CardContent>
            </Card>

            {/* LEGENDARY */}
            <Card className="relative overflow-hidden border-2 border-yellow-400/60 bg-gradient-to-br from-yellow-400/10 via-card to-card shadow-[0_0_40px_-10px_rgba(250,204,21,0.4)]">
              <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-yellow-300/15 to-transparent" />
              <div className="absolute top-4 right-4">
                <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {isPro ? "Активен" : "Рекомендовано"}
                </span>
              </div>
              <CardHeader className="relative">
                <CardTitle className="font-display text-xl flex items-center gap-2 text-yellow-300">
                  <LegendaryIcon className="h-6 w-6" /> Legendary
                </CardTitle>
                <p className="text-3xl font-bold text-foreground">
                  от 199₽<span className="text-sm text-muted-foreground font-normal">/мес</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Полная подготовка к турнирной сетке</p>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-2 mb-6">
                  {LEGENDARY_FEATURES.map((f) => (
                    <li
                      key={f.text}
                      className={
                        f.highlight
                          ? "flex items-start gap-2 text-sm font-bold text-yellow-300 bg-yellow-400/10 border border-yellow-400/40 rounded-lg px-3 py-2"
                          : "flex items-start gap-2 text-sm text-foreground"
                      }
                    >
                      {f.highlight ? (
                        <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-yellow-300 fill-yellow-300/30" />
                      ) : (
                        <Check className="h-4 w-4 shrink-0 mt-0.5 text-yellow-400" />
                      )}
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
                {isPro ? (
                  <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-yellow-400/15 text-yellow-300 font-semibold text-sm">
                    <LegendaryIcon /> Legendary активирован
                  </div>
                ) : (
                  <Button
                    className="w-full gap-2 bg-yellow-400 text-black hover:bg-yellow-300 shadow-lg shadow-yellow-500/30"
                    onClick={() => window.open("https://t.me/tourneyhelper_bot", "_blank")}
                  >
                    <Crown className="h-4 w-4" /> Оформить Legendary <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pricing tiers */}
          <h2 className="font-display text-2xl font-bold text-foreground mb-4 text-center">
            Варианты подписки Legendary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`relative p-5 rounded-xl border ${
                  tier.popular
                    ? "border-yellow-400/60 bg-yellow-400/5 shadow-[0_0_30px_-15px_rgba(250,204,21,0.5)]"
                    : "border-border bg-card"
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Популярный
                  </span>
                )}
                <h3 className="font-display font-bold text-foreground text-lg mb-2">{tier.title}</h3>
                <p className="text-3xl font-bold text-foreground mb-1">
                  {tier.price}<span className="text-sm text-muted-foreground font-normal">{tier.per}</span>
                </p>
                <p className="text-xs text-muted-foreground">{tier.note}</p>
              </div>
            ))}
          </div>

          {/* Why Legendary highlights */}
          <h2 className="font-display text-2xl font-bold text-foreground mb-4 text-center">
            Почему Legendary окупается
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: <Brain className="h-5 w-5" />, title: "ИИ-рекомендация бана", desc: "Главное преимущество: алгоритм считает все комбинации и подсказывает самый выгодный бан в твоей ситуации." },
              { icon: <Target className="h-5 w-5" />, title: "Прогноз и оптимум", desc: "Знаешь, что забанит соперник — выбираешь правильную колоду на первый матч и выигрываешь серию." },
              { icon: <History className="h-5 w-5" />, title: "История и ручной режим", desc: "Сохраняем последний расчёт. Можешь вручную задать бан и мгновенно увидеть, как меняется стратегия." },
              { icon: <Trophy className="h-5 w-5" />, title: "Все ранги и периоды", desc: "Diamond–Legend, Top 1K, Top 5K, разные периоды — данные именно из твоего сегмента меты." },
              { icon: <Zap className="h-5 w-5" />, title: "Ранний доступ", desc: "Новые функции и данные приходят к Legendary-игрокам первыми." },
              { icon: <Star className="h-5 w-5" />, title: "Поддержка проекта", desc: "Подписка позволяет нам обновлять данные ежедневно и развивать сервис без рекламы." },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-card border border-border">
                <div className="text-yellow-400 mb-2">{item.icon}</div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Оплата через Telegram-бот. Подписку можно отменить в любой момент.
          </p>

        </motion.div>
      </main>
    </div>
  );
};

export default Upgrade;
