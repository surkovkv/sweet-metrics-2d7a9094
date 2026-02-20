import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Eye, Swords, Trophy, Sparkles, ArrowRight } from "lucide-react";
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
          className="text-center py-16 md:py-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Стратегический анализатор для Hearthstone
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Побеждай в турнирах<br />
            с <span className="text-primary">TourneyHelper</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Анализируй колоды, рассчитывай оптимальные баны и получай преимущество над соперниками
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/analyzer">
              <Button size="lg" className="gap-2 w-full sm:w-auto text-base px-8">
                <Eye className="h-5 w-5" />
                Анализатор колод
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/tournament">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto text-base px-8">
                <Swords className="h-5 w-5" />
                Турнирный стратег
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {[
            {
              icon: Eye,
              title: "Анализ колоды",
              desc: "Мана-кривая, типы карт, стоимость в пыли — всё за секунду",
            },
            {
              icon: Swords,
              title: "Оптимальный бан",
              desc: "Матрица винрейтов и рекомендация — какую колоду забанить",
            },
            {
              icon: Trophy,
              title: "Турнирный режим",
              desc: "3 или 4 колоды, детальная стратегия с расчётом последствий",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <feature.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Footer */}
        <footer className="text-center border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            © 2024 TourneyHelper. Все права защищены.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Landing;
