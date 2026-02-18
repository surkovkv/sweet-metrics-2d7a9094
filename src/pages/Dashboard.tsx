import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BarChart3, Swords, Layers, Radar, User, Settings, Trophy, Shield,
  ChevronLeft, ChevronRight, TrendingUp, Target, Flame, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Layers, label: "My Decks" },
  { icon: Swords, label: "Match History" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Radar, label: "Meta Radar" },
  { icon: User, label: "Personal Meta" },
  { icon: Trophy, label: "Arena Stats" },
  { icon: Shield, label: "BG Stats" },
  { icon: Settings, label: "Settings" },
];

// Mock data
const recentMatches = [
  { opponent: "Aggro Paladin", result: "WIN", turns: 8, date: "2 min ago", winProb: 62 },
  { opponent: "Control Warrior", result: "LOSS", turns: 14, date: "18 min ago", winProb: 38 },
  { opponent: "Tempo Mage", result: "WIN", turns: 11, date: "45 min ago", winProb: 55 },
  { opponent: "Ramp Druid", result: "WIN", turns: 9, date: "1h ago", winProb: 71 },
  { opponent: "Zoo Warlock", result: "LOSS", turns: 7, date: "2h ago", winProb: 44 },
];

const statCards = [
  { icon: TrendingUp, label: "Win Rate", value: "58.3%", change: "+2.1%" },
  { icon: Target, label: "Games Today", value: "12", change: "5W 7L" },
  { icon: Flame, label: "Win Streak", value: "3", change: "Best: 7" },
  { icon: Clock, label: "Avg Duration", value: "9.2m", change: "-0.8m" },
];

const metaArchetypes = [
  { name: "Aggro Paladin", playRate: 18, winRate: 54 },
  { name: "Control Warrior", playRate: 14, winRate: 51 },
  { name: "Tempo Mage", playRate: 12, winRate: 52 },
  { name: "Ramp Druid", playRate: 11, winRate: 49 },
  { name: "Zoo Warlock", playRate: 10, winRate: 50 },
  { name: "Combo Priest", playRate: 8, winRate: 53 },
];

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("Match History");

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full border-r border-border bg-card z-50 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-56"
      )}>
        <div className="h-16 flex items-center px-4 border-b border-border gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="font-display text-xs font-bold text-primary-foreground">DT</span>
          </div>
          {!collapsed && (
            <span className="font-display text-sm font-bold text-foreground">
              Deck<span className="text-primary">Forge</span>
            </span>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                activeNav === item.label
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-4 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Main content */}
      <main className={cn("flex-1 transition-all duration-300", collapsed ? "ml-16" : "ml-56")}>
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <h1 className="font-display text-lg font-semibold text-foreground">{activeNav}</h1>
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            ← Back to Home
          </Link>
        </header>

        <div className="p-8 space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-primary mt-1">{stat.change}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent matches */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
              <h3 className="font-display text-sm font-semibold text-foreground mb-4">Recent Matches</h3>
              <div className="space-y-2">
                {recentMatches.map((match, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        match.result === "WIN" ? "bg-emerald-500" : "bg-destructive"
                      )} />
                      <div>
                        <div className="text-sm font-medium text-foreground">{match.opponent}</div>
                        <div className="text-xs text-muted-foreground">{match.turns} turns · {match.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-muted-foreground">{match.winProb}% predicted</div>
                      <span className={cn(
                        "font-display text-xs font-semibold px-2 py-0.5 rounded",
                        match.result === "WIN"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-destructive/10 text-destructive"
                      )}>
                        {match.result}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Meta sidebar */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display text-sm font-semibold text-foreground mb-4">Meta Snapshot</h3>
              <div className="space-y-3">
                {metaArchetypes.map((arch, i) => (
                  <motion.div
                    key={arch.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-foreground">{arch.name}</span>
                      <span className="text-xs text-muted-foreground">{arch.winRate}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${arch.playRate * 4}%` }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                        className="h-full rounded-full bg-primary/60"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
