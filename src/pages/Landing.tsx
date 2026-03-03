import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Swords, Trophy, Sparkles, ArrowRight, TrendingUp,
  Crown, MessageCircle, Newspaper, Lock, Star, ChevronRight,
  BarChart2, Shield, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import { useAuth } from "@/hooks/useAuth";

const Landing = () => {
  const { user, profile } = useAuth();
  const isPro = profile?.is_pro ?? false;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <ManaLensNavbar />

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-16 md:py-24 relative"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Hearthstone турнирный помощник
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Побеждай<br className="hidden md:block" /> в{" "}
              <span className="text-primary relative">
                турнирах
                <svg className="absolute -bottom-2 left-0 right-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M1 5.5 C40 2, 80 7, 120 4.5 C155 2.5, 180 6, 199 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Инструменты для подготовки к турнирам: матрица матчапов, расчёт банов,
              трекинг меты и оптимальная стратегия — всё в одном месте
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link to="/tournament">
                <Button size="lg" className="gap-2 h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25">
                  <Swords className="h-5 w-5" />
                  Открыть стратег
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              {!user && (
                <Link to="/auth">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    Войти / Регистрация
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20"
        >

          {/* Стратег */}
          <Link to="/tournament" className="group">
            <div className="h-full p-6 rounded-2xl bg-primary/10 border border-primary/30 hover:bg-primary/15 hover:border-primary/60 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-primary/20">
                  <Swords className="h-6 w-6 text-primary" />
                </div>
                <ChevronRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                Турнирный стратег
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Conquest-формат: матрица матчапов, оптимальный бан, оптимальная первая колода, стратегия на серию
              </p>
            </div>
          </Link>

          {/* Мета */}
          <Link to="/meta" className="group">
            <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:bg-card/80 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-secondary">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <ChevronRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                Live Meta-трекер
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Популярность и винрейты на Legend-рангах — кто кого контрит, что сейчас в топе меты
              </p>
            </div>
          </Link>

          {/* Новости */}
          <Link to="/news" className="group">
            <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:bg-card/80 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-secondary">
                  <Newspaper className="h-6 w-6 text-primary" />
                </div>
                <ChevronRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                Новости
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Гайды, патч-ноты, статьи от игроков — будь в курсе изменений и трендов
              </p>
            </div>
          </Link>
        </motion.div>

        {/* PRO features block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mb-20"
        >
          <div className="relative rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold mb-4">
                  <Crown className="h-3.5 w-3.5" /> PRO ПЛАН
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                  Разблокируй полный потенциал
                </h2>
                <ul className="space-y-2">
                  {[
                    { icon: <BarChart2 className="h-4 w-4" />, text: "Прогноз бана соперника на основе твоих колод" },
                    { icon: <Star className="h-4 w-4" />, text: "Оптимальная колода для первого матча с учётом банов" },
                    { icon: <Shield className="h-4 w-4" />, text: "Ручной выбор своего бана — влияет на стратегию" },
                    { icon: <Zap className="h-4 w-4" />, text: "Ранний доступ к новым функциям и данным" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">{item.icon}</span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-center gap-3 shrink-0">
                {isPro ? (
                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/20 text-primary font-semibold">
                    <Crown className="h-5 w-5" /> PRO активен
                  </div>
                ) : (
                  <>
                    <Link to="/upgrade">
                      <Button size="lg" className="px-8 gap-2 shadow-lg shadow-primary/25">
                        <Crown className="h-4 w-4" /> Попробовать PRO
                      </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground text-center">Бесплатная пробная версия доступна</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-8 mb-16 text-center"
        >
          {[
            { value: "22+", label: "архетипа в базе" },
            { value: "200K+", label: "игр проанализировано" },
            { value: "Legend", label: "данные ранга" },
            { value: "FREE", label: "основной доступ" },
          ].map((stat, i) => (
            <div key={i} className="px-6">
              <div className="font-display text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Footer */}
        <footer className="border-t border-border pt-8 pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <span className="font-display text-[10px] font-bold text-primary-foreground">TH</span>
              </div>
              <span className="font-display text-sm font-semibold text-foreground">
                Tourney<span className="text-primary">Helper</span>
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <Link to="/news" className="hover:text-foreground transition-colors">Новости</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> Связаться
              </Link>
              <a href="https://hearthstone.blizzard.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                Hearthstone®
              </a>
            </div>
            <div className="text-xs text-muted-foreground text-center md:text-right">
              <p>© 2026 TourneyHelper.</p>
              <p className="mt-1 text-[10px]">Не связан с Blizzard Entertainment.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Landing;
