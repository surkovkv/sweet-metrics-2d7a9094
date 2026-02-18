import { motion } from "framer-motion";

const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
            <span className="font-display text-[10px] font-bold text-primary-foreground">DT</span>
          </div>
          <span className="font-display text-sm font-semibold text-foreground">
            Deck<span className="text-primary">Forge</span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          No ads · No crypto · No spyware · Privacy by default
        </p>
        <p className="text-xs text-muted-foreground">
          © 2026 DeckForge. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
