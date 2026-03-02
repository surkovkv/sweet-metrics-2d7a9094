import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Eye, Swords, Trophy, Sparkles, ArrowRight, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ManaLensNavbar from "@/components/ManaLensNavbar";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <ManaLensNavbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-16 md:py-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Hearthstone турнирный помощник
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Побеждай в турнирах<br />
            с <span className="text-primary">TourneyHelper</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Инструменты для подготовки к турнирам: анализ колод, расчёт банов и отслеживание меты
          </p>
        </motion.div>

        {/* Tools Grid — 3 clickable cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-20"
        >
          {/* Tournament Strategist — PRIMARY */}
          <Link to="/tournament" className="group">
            <div className="h-full p-6 rounded-xl bg-primary/10 border-2 border-primary hover:bg-primary/15 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <Swords className="h-8 w-8 text-primary" />
                <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                Турнирный стратег
              </h3>
              <p className="text-sm text-muted-foreground">
                Формат Conquest: 3–4 колоды, матрица винрейтов, оптимальный бан, пошаговая стратегия и расчёт шансов на победу в серии
              </p>
            </div>
          </Link>

          {/* Deck Analyzer — SECONDARY */}
          <Link to="/analyzer" className="group">
            <div className="h-full p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <Eye className="h-8 w-8 text-primary" />
                <span />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                Анализатор колод
              </h3>
              <p className="text-sm text-muted-foreground">
                Вставь deck code — получи мана-кривую, распределение по типам и редкостям, стоимость в пыли и оценку силы архетипа
              </p>
            </div>
          </Link>

          {/* Meta Tracker — SECONDARY */}
          <Link to="/meta" className="group">
            <div className="h-full p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
                <span />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                Live Meta-трекер
              </h3>
              <p className="text-sm text-muted-foreground">
                Популярность колод на Legend-рангах, кто кого контрит и какие архетипы сейчас на подъёме — всё на одной интерактивной диаграмме
              </p>
            </div>
          </Link>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-8 mb-16 text-center"
        >
          {[
            { value: "22+", label: "архетипа в базе" },
            { value: "200K+", label: "игр проанализировано" },
            { value: "Legend", label: "данные рангов" },
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
              <Link to="/contact" className="hover:text-foreground transition-colors">Контакты</Link>
              <a href="https://hearthstone.blizzard.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Hearthstone®</a>
            </div>
            <div className="text-xs text-muted-foreground text-center md:text-right">
              <p>© 2024 TourneyHelper. Все права защищены.</p>
              <p className="mt-1 text-[10px]">Не связан с Blizzard Entertainment. Все торговые марки принадлежат их владельцам.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Landing;
