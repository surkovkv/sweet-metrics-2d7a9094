import { motion } from "framer-motion";
import { Brain, Shield, Zap, Gamepad2, Eye, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Native Performance",
    description: "No Overwolf. No Electron bloat. Pure native speed with Rust backend and lightweight overlay.",
  },
  {
    icon: Brain,
    title: "AI Analytics",
    description: "Bayesian opponent prediction, archetype detection, mulligan analysis, and live win probability.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "E2E encryption, zero-knowledge sync, full offline mode. Your data stays yours.",
  },
  {
    icon: Gamepad2,
    title: "Multi-Game",
    description: "Hearthstone, KARDS, Legends of Runeterra — one tracker for all your card games.",
  },
  {
    icon: Eye,
    title: "Smart Overlay",
    description: "Remaining cards, draw probability, threat heatmap, lethal indicator — all in a non-intrusive overlay.",
  },
  {
    icon: BarChart3,
    title: "Meta Radar",
    description: "Global archetype frequency, regional meta, trending decks, and personal exploit analysis.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-display text-xs tracking-[0.3em] uppercase text-primary mb-4 block">
            Why DeckForge
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Built Different
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group relative p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_30px_hsl(var(--neon)/0.08)]"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
