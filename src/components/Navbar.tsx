import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { NeonButton, GhostNeonButton } from "./NeonButtons";

const Navbar = () => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="font-display text-sm font-bold text-primary-foreground">DT</span>
          </div>
          <span className="font-display text-lg font-bold text-foreground">
            Deck<span className="text-primary">Forge</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</a>
          <a href="#analytics" className="text-sm text-muted-foreground hover:text-primary transition-colors">Analytics</a>
          <a href="#faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</a>
          <Link to="/dashboard">
            <GhostNeonButton size="sm">Dashboard</GhostNeonButton>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
