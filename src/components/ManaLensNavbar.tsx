import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Eye, Swords, Newspaper, Mail, TrendingUp } from "lucide-react";
import UserMenu from "@/components/UserMenu";

const ManaLensNavbar = () => {
  const location = useLocation();

  const links = [
    { to: "/analyzer", label: "Анализатор", icon: Eye },
    { to: "/tournament", label: "Турнирный стратег", icon: Swords },
    { to: "/meta", label: "Мета", icon: TrendingUp },
    { to: "/news", label: "Новости", icon: Newspaper },
    { to: "/contact", label: "Контакты", icon: Mail },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="font-display text-xs font-bold text-primary-foreground">TH</span>
          </div>
          <span className="font-display text-lg font-bold text-foreground">
            Tourney<span className="text-primary">Helper</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 md:gap-4">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors ${isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <UserMenu />
        </div>
      </div>
    </motion.nav>
  );
};

export default ManaLensNavbar;
