import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Swords, ArrowRight, Crown, MessageCircle, Star,
  BarChart2, Shield, Zap, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n/useTranslation";

const Landing = () => {
  const { user, profile } = useAuth();
  const isPro = profile?.is_pro ?? false;
  const t = useT();

  const proFeatures = [
    { text: t("landing.proFeature1"), highlight: true },
    { text: t("landing.proFeature2"), highlight: false },
    { text: t("landing.proFeature3"), highlight: false },
    { text: t("landing.proFeature4"), highlight: false },
    { text: t("landing.proFeature5"), highlight: false },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <ManaLensNavbar />

      <main className="flex-1 flex flex-col justify-center container mx-auto px-4 pt-24 pb-12 max-w-5xl">

        {/* spacer top */}
        <div className="flex-1 min-h-[2vh]" />

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center pb-8 md:pb-10 relative"
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
              {t("landing.heroTitle")}<br className="hidden md:block" />{" "}
              <span className="text-primary">{t("landing.heroTitleHS")}</span>
            </h1>

            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-2 leading-relaxed">
              {t("landing.heroDesc")}
            </p>

            {!user && (
              <div className="flex items-center justify-center gap-3 flex-wrap mt-4">
                <Link to="/auth">
                  <Button variant="outline" size="lg" className="h-11 px-6 text-base">
                    {t("landing.loginSignup")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Features — единые карточки: описание + переход в одну */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          <Link to="/matchups" className="group">
            <div className="h-full p-6 rounded-2xl bg-primary/10 border border-primary/30 hover:bg-primary/15 hover:border-primary/60 transition-all duration-300 hover:-translate-y-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-primary/20">
                  <BarChart2 className="h-6 w-6 text-primary" />
                </div>
                <ChevronRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {t("landing.matchupsTitle")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                {t("landing.matchupsDesc")}
              </p>
              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                {t("landing.matchupsTitle")} <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          <Link to="/tournament" className="group">
            <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all duration-300 hover:-translate-y-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-secondary">
                  <Swords className="h-6 w-6 text-primary" />
                </div>
                <ChevronRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {t("landing.strategistTitle")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                {t("landing.strategistDesc")}
              </p>
              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                {t("landing.openStrategist")} <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative rounded-2xl overflow-hidden border-2 border-yellow-400/60 bg-gradient-to-br from-yellow-400/15 via-yellow-500/10 to-amber-500/5 p-7 shadow-[0_0_40px_-10px_rgba(250,204,21,0.4)]">
            <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-yellow-300/20 to-transparent" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/25 text-yellow-200 text-xs font-bold mb-3">
                  <Crown className="h-3.5 w-3.5" /> {t("landing.proPlan")}
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-yellow-100 mb-3 tracking-tight">
                  {t("landing.proUnlock")}
                </h2>
                <ul className="space-y-2">
                  {proFeatures.map((item, i) => (
                    <li
                      key={i}
                      className={
                        item.highlight
                          ? "flex items-start gap-2 text-sm font-bold text-yellow-300 bg-yellow-400/10 border border-yellow-400/40 rounded-lg px-3 py-2"
                          : "flex items-start gap-2 text-sm text-foreground/85"
                      }
                    >
                      <Star className={`h-4 w-4 mt-0.5 shrink-0 ${item.highlight ? "text-yellow-300 fill-yellow-300" : "text-yellow-300/60"}`} />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-center gap-3 shrink-0">
                {isPro ? (
                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-400/25 text-yellow-100 font-semibold">
                    <Crown className="h-5 w-5" /> {t("landing.proActive")}
                  </div>
                ) : (
                  <>
                    <Link to="/upgrade">
                      <Button size="lg" className="px-8 gap-2 bg-yellow-400 text-black hover:bg-yellow-300 shadow-lg shadow-yellow-500/40">
                        <Crown className="h-4 w-4" /> {t("landing.tryPro")}
                      </Button>
                    </Link>
                    <p className="text-xs text-yellow-100/80 text-center">{t("landing.freeTrial")}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex-1 min-h-[2vh]" />


      </main>

      <Footer />
    </div>
  );
};

export default Landing;

