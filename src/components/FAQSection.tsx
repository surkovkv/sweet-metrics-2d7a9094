import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Is DeckForge free?",
    a: "Basic tracking and match history are completely free. Pro features like AI analytics, Meta Radar, and cloud sync are available with a subscription.",
  },
  {
    q: "Does it work with Hearthstone?",
    a: "Yes! Hearthstone is our primary supported game. We parse game logs in real-time with zero performance impact.",
  },
  {
    q: "Is my data private?",
    a: "Absolutely. DeckForge works fully offline. Cloud sync is optional with E2E encryption and zero-knowledge storage. No ads, no crypto, no spyware.",
  },
  {
    q: "How is it faster than HDT?",
    a: "Our Rust backend and native overlay run at <0.5% CPU idle. No Overwolf dependency means instant startup and minimal resource usage.",
  },
  {
    q: "What games are supported?",
    a: "Currently Hearthstone, with KARDS and Legends of Runeterra coming in Phase 3. Our multi-game architecture makes adding new games straightforward.",
  },
];

const FAQSection = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-32">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-display text-xs tracking-[0.3em] uppercase text-primary mb-4 block">FAQ</span>
          <h2 className="font-display text-4xl font-bold text-foreground">Common Questions</h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-card transition-colors"
              >
                <span className="font-display text-sm font-medium text-foreground">{faq.q}</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open === i && "rotate-180")} />
              </button>
              <div className={cn("overflow-hidden transition-all duration-300", open === i ? "max-h-40 pb-5 px-5" : "max-h-0")}>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
