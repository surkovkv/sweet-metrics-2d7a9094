import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Swords, Trophy, Sparkles, ArrowRight, TrendingUp,
  Crown, MessageCircle, Newspaper, Star, ChevronRight,
  BarChart2, Shield, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n/useTranslation";

const Landing = () => {
  const { user, profile } = useAuth();
  const isPro = profile?.is_pro ?? false;
  const t = useT();

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
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              {t("landing.heroTitle")}<br className="hidden md:block" />{" "}
              <span className="text-primary">{t("landing.heroTitleHS")}</span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              {t("landing.heroDesc")}
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link to="/tournament">
                <Button size="lg" className="gap-2 h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25">
                  <Swords className="h-5 w-5" />
                  {t("landing.openStrategist")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              {!user && (
                <Link to="/auth">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("landing.loginSignup")}
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
          <Link to="/tournament" className="group">
            <div className="h-full p-6 rounded-2xl bg-primary/10 border border-primary/30 hover:bg-primary/15 hover:border-primary/60 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-primary/20">
                  <Swords className="h-6 w-6 text-primary" />
                </div>
                <ChevronRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                {t("landing.strategistTitle")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("landing.strategistDesc")}
              </p>
            </div>
          </Link>

          <Link to="/meta" className="group">
            <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:bg-card/80 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-secondary">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <ChevronRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                {t("landing.metaTitle")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("landing.metaDesc")}
              </p>
            </div>
          </Link>

          <Link to="/news" className="group">
            <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:bg-card/80 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-secondary">
                  <Newspaper className="h-6 w-6 text-primary" />
                </div>
                <ChevronRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                {t("landing.newsTitle")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("landing.newsDesc")}
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
                  <Crown className="h-3.5 w-3.5" /> {t("landing.proPlan")}
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                  {t("landing.proUnlock")}
                </h2>
                <ul className="space-y-2">
                  {[
                    { icon: <BarChart2 className="h-4 w-4" />, text: t("landing.proFeature1") },
                    { icon: <Star className="h-4 w-4" />, text: t("landing.proFeature2") },
                    { icon: <Shield className="h-4 w-4" />, text: t("landing.proFeature3") },
                    { icon: <Zap className="h-4 w-4" />, text: t("landing.proFeature4") },
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
                    <Crown className="h-5 w-5" /> {t("landing.proActive")}
                  </div>
                ) : (
                  <>
                    <Link to="/upgrade">
                      <Button size="lg" className="px-8 gap-2 shadow-lg shadow-primary/25">
                        <Crown className="h-4 w-4" /> {t("landing.tryPro")}
                      </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground text-center">{t("landing.freeTrial")}</p>
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
            { value: "22+", label: t("landing.stat1") },
            { value: "200K+", label: t("landing.stat2") },
            { value: "Legend", label: t("landing.stat3") },
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
              <Link to="/news" className="hover:text-foreground transition-colors">{t("nav.news")}</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> {t("nav.contact")}
              </Link>
              <a href="https://hearthstone.blizzard.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                Hearthstone®
              </a>
            </div>
            <div className="text-xs text-muted-foreground text-center md:text-right">
              <p>{t("landing.copyright")}</p>
              <p className="mt-1 text-[10px]">{t("landing.notAffiliated")}</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Landing;
