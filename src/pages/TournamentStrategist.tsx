import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Trophy, ShieldAlert, Target, Info, Gamepad2,
  Lock, Crown, Ban, ArrowLeftRight, HelpCircle, Star, ChevronDown, ChevronUp, RotateCcw, Clock,
  Layers, AlertTriangle, ChevronsUpDown, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import {
  getArchetypeInfo as staticGetArchetypeInfo,
  getEstimatedGames as staticGetEstimatedGames,
  getWinrate as staticGetWinrate,
  archetypeList as staticArchetypeList,
  type ArchetypeInfo,
} from "@/data/matchups";
import {
  calculateOptimalBan, calculateOpponentBan, calculateOptimalFirstDeck, type BanResult,
} from "@/data/banStrategy";
import { useAuth } from "@/hooks/useAuth";
import { useMatchupData } from "@/hooks/useMatchupData";
import { useT } from "@/i18n/useTranslation";
import { useTrialCounter } from "@/hooks/useTrialCounter";

type DeckMode = 2 | 3 | 4;
type GetWinrateFn = (my: string, opp: string) => number | null;
type GetArchetypeInfoFn = (name: string) => ArchetypeInfo | undefined;
type GetEstimatedGamesFn = (a: string, b: string) => number | null;

/* Ban History */
const BAN_HISTORY_KEY = "manalens_ban_history";
const MAX_HISTORY = 1;

interface BanHistoryEntry {
  myDecks: string[];
  oppDecks: string[];
  bannedDeck: string;
  avgWr: number;
  timestamp: number;
}

function loadBanHistory(mode: DeckMode): BanHistoryEntry[] {
  try {
    const raw = localStorage.getItem(`${BAN_HISTORY_KEY}_${mode}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveBanHistoryToStorage(mode: DeckMode, entry: BanHistoryEntry): BanHistoryEntry[] {
  try {
    const existing = loadBanHistory(mode);
    const updated = [entry, ...existing].slice(0, MAX_HISTORY);
    localStorage.setItem(`${BAN_HISTORY_KEY}_${mode}`, JSON.stringify(updated));
    return updated;
  } catch { return []; }
}

const TournamentStrategist = () => {
  const { user, profile } = useAuth();
  const IS_PRO = profile?.is_pro ?? false;
  const IS_LOGGED_IN = !!user;
  const [rank, setRank] = useState<"all" | "legend" | "top_1k">("all");
  const { archetypeList, matchupDB, gamesDB, archetypeGames, date } = useMatchupData(rank);
  const t = useT();
  const { remaining, isExhausted, consumeTrial, maxTrials } = useTrialCounter();

  // For FREE users: can they use PRO features via trial?
  const canUseProFeatures = IS_PRO || (!IS_PRO && !isExhausted);

  // Filters State
  const [minMatchupGames, setMinMatchupGames] = useState<number>(50);
  const [minArchetypeGames, setMinArchetypeGames] = useState<number>(50);

  const filteredArchetypes = useMemo(() => {
    return archetypeList.filter((a) => {
      const g = archetypeGames?.[a.name];
      if (g !== undefined) return g >= minArchetypeGames;
      return true; // Fallback
    });
  }, [archetypeList, archetypeGames, minArchetypeGames]);

  // Clear selections if they get filtered out
  useEffect(() => {
    setMyArchetypes((prev) => {
      let changed = false;
      const next = prev.map((a) => {
        if (a && !filteredArchetypes.find((f) => f.name === a)) {
          changed = true;
          return "";
        }
        return a;
      });
      return changed ? next : prev;
    });
    setOppArchetypes((prev) => {
      let changed = false;
      const next = prev.map((a) => {
        if (a && !filteredArchetypes.find((f) => f.name === a)) {
          changed = true;
          return "";
        }
        return a;
      });
      return changed ? next : prev;
    });
  }, [filteredArchetypes]);

  const getWinrate = useCallback((my: string, opp: string): number | null => {
    const games = gamesDB[my]?.[opp] ?? gamesDB[opp]?.[my] ?? null;
    if (games !== null && games < minMatchupGames) return null;
    return matchupDB[my]?.[opp] ?? null;
  }, [matchupDB, gamesDB, minMatchupGames]);

  /** Raw winrate without min-matchup-games filter — used for low-sample fallback. */
  const getWinrateRaw = useCallback((my: string, opp: string): number | null => {
    return matchupDB[my]?.[opp] ?? null;
  }, [matchupDB]);

  const getArchetypeInfo = useCallback((name: string) => {
    const found = archetypeList.find((a) => a.name === name);
    return found ?? staticGetArchetypeInfo(name);
  }, [archetypeList]);

  const getEstimatedGames = useCallback((arch1: string, arch2: string): number | null => {
    return gamesDB[arch1]?.[arch2] ?? gamesDB[arch2]?.[arch1] ?? null;
  }, [gamesDB]);

  

  const [mode, setMode] = useState<DeckMode>(3);
  const [myArchetypes, setMyArchetypes] = useState<string[]>(["", "", ""]);
  const [oppArchetypes, setOppArchetypes] = useState<string[]>(["", "", ""]);
  const [showResult, setShowResult] = useState(false);
  const [manualBanIndex, setManualBanIndex] = useState<number | null>(null);
  const [showOpponentBan, setShowOpponentBan] = useState(false);
  const [showInfoBox, setShowInfoBox] = useState(false);
  const [oppManualBanIndex, setOppManualBanIndex] = useState<number | null>(null);
  const [banHistory, setBanHistory] = useState<Record<DeckMode, BanHistoryEntry[]>>({
    2: [], 3: [], 4: [],
  });

  useEffect(() => {
    setBanHistory({ 2: loadBanHistory(2), 3: loadBanHistory(3), 4: loadBanHistory(4) });
  }, []);

  const currentHistory = banHistory[mode];

  const handleModeChange = (newMode: DeckMode) => {
    setMode(newMode);
    const resize = (arr: string[]) =>
      Array.from({ length: newMode }, (_, i) => arr[i] ?? "");
    setMyArchetypes(resize(myArchetypes));
    setOppArchetypes(resize(oppArchetypes));
    setShowResult(false);
    setManualBanIndex(null);
    setOppManualBanIndex(null);
  };

  const hasDuplicates = useMemo(() => {
    const myFiltered = myArchetypes.filter(Boolean);
    const oppFiltered = oppArchetypes.filter(Boolean);
    if (myFiltered.length !== new Set(myFiltered).size) return true;
    if (oppFiltered.length !== new Set(oppFiltered).size) return true;
    return false;
  }, [myArchetypes, oppArchetypes]);

  const updateMyArchetype = (index: number, value: string) => {
    const updated = [...myArchetypes];
    updated[index] = value;
    setMyArchetypes(updated);
    setShowResult(false);
    setManualBanIndex(null);
  };

  const updateOppArchetype = (index: number, value: string) => {
    const updated = [...oppArchetypes];
    updated[index] = value;
    setOppArchetypes(updated);
    setShowResult(false);
    setManualBanIndex(null);
  };

  const allFilled = myArchetypes.every(Boolean) && oppArchetypes.every(Boolean);

  const handleCalculate = () => {
    if (!allFilled) return;
    if (hasDuplicates) {
      toast.error(t("tournament.duplicateWarning"));
      return;
    }
    // Consume trial for FREE users
    if (!IS_PRO) {
      consumeTrial();
    }
    setShowResult(true);
    setManualBanIndex(null);
    setOppManualBanIndex(null);
    setShowOpponentBan(false);
  };

  // Save ban to history when ban result is shown
  const saveBanToHistory = useCallback((bannedDeck: string, avgWr: number) => {
    if (!IS_PRO) return;
    const entry: BanHistoryEntry = {
      myDecks: [...myArchetypes],
      oppDecks: [...oppArchetypes],
      bannedDeck,
      avgWr,
      timestamp: Date.now(),
    };
    const updated = saveBanHistoryToStorage(mode, entry);
    setBanHistory(prev => ({ ...prev, [mode]: updated }));
  }, [IS_PRO, myArchetypes, oppArchetypes, mode]);

  // Save to history when result first appears
  useEffect(() => {
    if (showResult && banOptions.length > 0 && IS_PRO) {
      const best = banOptions[0];
      saveBanToHistory(best.bannedArchetype, best.avgWinrate);
    }
  }, [showResult]);

  const banOptions = useMemo(() => {
    if (!showResult) return [];
    return calculateOptimalBan(myArchetypes, oppArchetypes, getWinrate);
  }, [showResult, myArchetypes, oppArchetypes, getWinrate]);

  const oppBanOptions = useMemo(() => {
    if (!showResult || !showOpponentBan) return [];
    return calculateOpponentBan(myArchetypes, oppArchetypes, getWinrate);
  }, [showResult, showOpponentBan, myArchetypes, oppArchetypes, getWinrate]);

  // Reset opp-ban marker when section is hidden. Don't auto-mark on open —
  // the suggested deck is shown in orange and requires explicit confirmation.
  useEffect(() => {
    if (!showOpponentBan) {
      setOppManualBanIndex(null);
    }
  }, [showOpponentBan]);

  // Suggested (top) opp-ban index — used for orange highlight before confirmation
  const suggestedOppBanIdx = oppBanOptions.length > 0 ? oppBanOptions[0].bannedIndex : null;

  const effectiveBanIdx = manualBanIndex ?? (banOptions.length > 0 ? banOptions[0].bannedIndex : null);

  // For optimal first deck, use confirmed ban if any, otherwise the suggested one.
  const oppBanForCalc = oppManualBanIndex ?? suggestedOppBanIdx;
  const optimalFirstDeck = useMemo(() => {
    if (!showResult || !IS_PRO) return null;
    return calculateOptimalFirstDeck(myArchetypes, oppArchetypes, oppBanForCalc, effectiveBanIdx, getWinrate);
  }, [showResult, IS_PRO, myArchetypes, oppArchetypes, effectiveBanIdx, oppBanForCalc, getWinrate]);

  const restoreFromHistory = (entry: BanHistoryEntry) => {
    setMyArchetypes(entry.myDecks);
    setOppArchetypes(entry.oppDecks);
    setShowResult(false);
    setManualBanIndex(null);
    setOppManualBanIndex(null);
    setTimeout(() => {
      setShowResult(true);
    }, 100);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <ManaLensNavbar />
        <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">

          {/* Header — title + inline "How it works" toggle on the right */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center">
                {t("tournament.title")} <span className="text-primary">{t("tournament.titleHighlight")}</span>
              </h1>
              <button
                onClick={() => setShowInfoBox(!showInfoBox)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors bg-secondary/60 px-3 py-1.5 rounded-full border border-border"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                {t("tournament.howItWorks")}
                {showInfoBox ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>
            <AnimatePresence>
              {showInfoBox && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-5 rounded-xl bg-secondary/60 border border-border text-sm text-muted-foreground w-full max-w-full overflow-hidden"
                >
                  <h3 className="font-semibold text-foreground mb-2">{t("tournament.conceptTitle")}</h3>
                  <p className="whitespace-pre-line leading-relaxed">{t("tournament.conceptDesc")}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Filters — grouped card (rank + deck count + min archetype + min matchup) */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="mb-8">
            <div className="rounded-2xl bg-secondary/40 border border-border p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Rank */}
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <Trophy className="h-3.5 w-3.5 text-primary" /> {t("tournament.rank")}
                </label>
                <Select value={rank} onValueChange={(v) => { setRank(v as typeof rank); setShowResult(false); }}>
                  <SelectTrigger className="h-9 bg-background border-border font-bold text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("matchups.rankAll")}</SelectItem>
                    <SelectItem value="legend">{t("matchups.rankLegend")}</SelectItem>
                    <SelectItem value="top_1k">{t("matchups.rankTop1k")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Deck count */}
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <Layers className="h-3.5 w-3.5 text-primary" /> {t("tournament.deckCount")}
                </label>
                <Select value={String(mode)} onValueChange={(v) => handleModeChange(Number(v) as DeckMode)}>
                  <SelectTrigger className="h-9 bg-background border-border font-bold text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">{t("tournament.decks2")}</SelectItem>
                    <SelectItem value="3">{t("tournament.decks3")}</SelectItem>
                    <SelectItem value="4">{t("tournament.decks4")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Min Archetype Games */}
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <Layers className="h-3.5 w-3.5 text-primary" /> {t("matchups.minArchetype")}
                </label>
                <Select value={String(minArchetypeGames)} onValueChange={(v) => { setMinArchetypeGames(Number(v)); setShowResult(false); }}>
                  <SelectTrigger className="h-9 bg-background border-border font-bold text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[50, 100, 250, 500, 1000, 2500, 5000, 10000].map(val => (
                      <SelectItem key={val} value={String(val)}>{val.toLocaleString()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Min Matchup Games */}
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <Swords className="h-3.5 w-3.5 text-primary" /> {t("matchups.minMatchup")}
                </label>
                <Select value={String(minMatchupGames)} onValueChange={(v) => { setMinMatchupGames(Number(v)); setShowResult(false); }}>
                  <SelectTrigger className="h-9 bg-background border-border font-bold text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[50, 100, 250, 500, 1000, 2500, 5000, 10000].map(val => (
                      <SelectItem key={val} value={String(val)}>{val.toLocaleString()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Duplicate warning */}
          <AnimatePresence>
            {hasDuplicates && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm text-center font-medium">
                {t("tournament.duplicateWarning")}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Deck Selection + History Grid */}
          <div className={`grid grid-cols-1 gap-6 mb-8 ${IS_LOGGED_IN && IS_PRO ? "md:grid-cols-[1fr_1fr_auto]" : "md:grid-cols-2"}`}>
            {/* My Decks */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <label className="block text-sm font-medium text-foreground mb-3">
                <Swords className="inline h-4 w-4 mr-1.5 text-primary" />
                {t("tournament.yourDecks")}
              </label>
              <div className="space-y-3">
                {myArchetypes.map((arch, i) => {
                  const isMyBanned = showResult && oppManualBanIndex === i;
                  return (
                    <div key={`my-${i}`} className="relative">
                      <ArchetypeSelect value={arch}
                        onChange={(val) => updateMyArchetype(i, val)}
                        placeholder={`${t("tournament.deck")} ${i + 1}...`}
                        excludeValues={[...myArchetypes.filter((_, j) => j !== i).filter(Boolean)]}
                        archetypeList={filteredArchetypes}
                        getWinrate={getWinrate}
                        archetypeGames={archetypeGames}
                      />
                      {isMyBanned && (
                        <div className="absolute inset-0 flex items-center pointer-events-none">
                          <div className="absolute inset-0 rounded-lg border-2 border-destructive/50" />
                          <div className="absolute left-0 right-0 top-1/2 h-[3px] bg-destructive -translate-y-1/2 mx-2" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded">
                            BAN
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Opponent Decks */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-foreground">
                    <Target className="inline h-4 w-4 mr-1.5 text-destructive" />
                    {t("tournament.oppDecks")}
                  </label>
                </div>
                {/* PRO badge removed per request */}
              </div>
              <div className="space-y-3">
                {oppArchetypes.map((arch, i) => {
                  const isBanned = showResult && effectiveBanIdx === i;
                  return (
                    <div key={`opp-${i}`} className="relative">
                      <ArchetypeSelect value={arch}
                        onChange={(val) => updateOppArchetype(i, val)}
                        placeholder={`${t("tournament.oppDeck")} ${i + 1}...`}
                        excludeValues={[...oppArchetypes.filter((_, j) => j !== i).filter(Boolean)]}
                        archetypeList={filteredArchetypes}
                        getWinrate={getWinrate}
                        archetypeGames={archetypeGames}
                      />
                      {isBanned && (
                        <div className="absolute inset-0 flex items-center pointer-events-none">
                          <div className="absolute inset-0 rounded-lg border-2 border-destructive/50" />
                          <div className="absolute left-0 right-0 top-1/2 h-[3px] bg-destructive -translate-y-1/2 mx-2" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded">
                            BAN
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {IS_LOGGED_IN && IS_PRO && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                className="hidden md:flex flex-col items-center gap-2 pt-8">
                {currentHistory.length > 0 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => restoreFromHistory(currentHistory[0])}
                        className="w-9 h-9 rounded-full border-2 border-primary bg-primary/10 text-primary flex items-center justify-center transition-all hover:scale-110"
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="text-xs font-semibold">BAN: {currentHistory[0].bannedDeck}</p>
                      <p className={`text-xs font-bold ${getWinrateColor(currentHistory[0].avgWr)}`}>{currentHistory[0].avgWr}%</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{currentHistory[0].myDecks.join(", ")} vs {currentHistory[0].oppDecks.join(", ")}</p>
                      <p className="text-[10px] text-primary mt-1">{t("tournament.restoreBan")}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-9 h-9 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p className="text-xs">{t("tournament.noBanHistory")}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </motion.div>
            )}
          </div>

          {/* Mobile Ban History — PRO only (single last entry) */}
          {IS_LOGGED_IN && IS_PRO && currentHistory.length > 0 && (
            <div className="md:hidden flex gap-2 mb-4 justify-center items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => restoreFromHistory(currentHistory[0])}
                    className="w-9 h-9 rounded-full border-2 border-primary bg-primary/10 text-primary flex items-center justify-center transition-all"
                  >
                    <Clock className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-semibold">BAN: {currentHistory[0].bannedDeck} ({currentHistory[0].avgWr}%)</p>
                  <p className="text-[10px] text-primary">{t("tournament.restoreBan")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Calculate Button */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-10">
            {!IS_LOGGED_IN ? (
              <div className="text-center p-4 rounded-xl bg-secondary border border-border">
                <Lock className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">{t("tournament.loginRequired")}</p>
                <Link to="/auth"><Button className="gap-2">{t("tournament.loginSignup")}</Button></Link>
              </div>
            ) : (
              <>
                <Button onClick={handleCalculate}
                  disabled={!allFilled || hasDuplicates}
                  className="w-full gap-2 h-12 text-base font-semibold">
                  <Ban className="h-5 w-5" />
                  {t("tournament.calculateStrategy")}
                </Button>
                {/* Trial counter for FREE users */}
                {!IS_PRO && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {isExhausted
                      ? <>{t("tournament.trialsExhausted")}. <span className="text-primary font-semibold">{t("tournament.matrixStillAvailable")}</span></>
                      : t("tournament.trialsRemaining").replace("{n}", String(remaining)).replace("{max}", String(maxTrials))}
                  </p>
                )}
              </>
            )}
          </motion.div>

          {/* Results */}
          <AnimatePresence>
            {showResult && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }} className="space-y-6">

                {/* Matchup Matrix */}
                <div className="relative">
                  <MatchupMatrix
                    myArchetypes={myArchetypes}
                    oppArchetypes={oppArchetypes}
                    bannedIndex={effectiveBanIdx}
                    oppBannedIndex={oppManualBanIndex}
                    getWinrate={getWinrate}
                    getWinrateRaw={getWinrateRaw}
                    getArchetypeInfo={getArchetypeInfo}
                    getEstimatedGames={getEstimatedGames}
                    minMatchupGames={minMatchupGames}
                    t={t}
                    archetypeGames={archetypeGames}
                  />
                  {!IS_LOGGED_IN && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl backdrop-blur-xl bg-background/80">
                      <div className="text-center p-6">
                        <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
                        <p className="text-foreground font-semibold mb-1">{t("tournament.signUpToView")}</p>
                        <Link to="/auth"><Button size="sm" className="mt-2">{t("auth.loginBtn")}</Button></Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ban Recommendation */}
                <div className="relative">
                  <Card className="bg-card border-border border-l-4 border-l-destructive">
                    <CardHeader>
                      <CardTitle className="font-display text-lg flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-destructive" />
                        {t("tournament.banRecommendation")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* PRO hint about manual ban */}
                      {IS_PRO && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary">
                          <Crown className="h-4 w-4 shrink-0" />
                          {t("tournament.manualBanProHint")}
                        </div>
                      )}

                      {banOptions.map((option, i) => (
                        <BanOptionCard key={i} option={option} index={i}
                          isActive={effectiveBanIdx === option.bannedIndex}
                          onManualBan={IS_PRO ? () => setManualBanIndex(option.bannedIndex) : undefined}
                          t={t}
                        />
                      ))}

                      {/* Reset manual ban — prominent button */}
                      {manualBanIndex !== null && IS_PRO && (
                        <Button
                          onClick={() => setManualBanIndex(null)}
                          variant="destructive"
                          size="lg"
                          className="w-full gap-2 mt-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          {t("tournament.resetManualBan")}
                        </Button>
                      )}

                      {!IS_PRO && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          {t("tournament.manualBanProOnly")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  {/* Blur ban recommendation for FREE users when trials exhausted */}
                  {!IS_PRO && isExhausted && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl backdrop-blur-xl bg-background/80">
                      <Crown className="h-6 w-6 text-primary mb-2" />
                      <p className="text-foreground font-medium text-sm">{t("tournament.banRecommendationTitle")}</p>
                      <p className="text-xs text-muted-foreground mt-1 text-center max-w-[240px]">{t("tournament.banRecommendationLockedDesc")}</p>
                      <Link to="/upgrade"><Button size="sm" className="mt-3 gap-1.5"><Crown className="h-3.5 w-3.5" />{t("landing.tryPro")}</Button></Link>
                    </div>
                  )}
                </div>

                {/* Opponent Ban + Optimal First Deck — side-by-side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Opponent Ban Section — PRO only */}
                  <div className="relative">
                    {IS_PRO ? (
                      <Card className="bg-card border-border h-full">
                        <CardHeader>
                          <CardTitle className="font-display text-base flex items-center gap-2">
                            <ArrowLeftRight className="h-5 w-5 text-primary" />
                            <span className="truncate">{t("tournament.oppBan")}</span>
                            <Button
                              onClick={() => setShowOpponentBan(!showOpponentBan)}
                              variant={showOpponentBan ? "default" : "secondary"}
                              size="sm"
                              className="ml-auto gap-1.5 font-semibold shrink-0"
                            >
                              {showOpponentBan ? t("tournament.hide") : t("tournament.show")}
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <AnimatePresence>
                          {showOpponentBan && oppBanOptions.length > 0 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}>
                              <CardContent className="space-y-3 pt-0">
                                <p className="text-xs text-muted-foreground mb-2">
                                  {t("tournament.oppBanDesc")}
                                </p>
                                {oppBanOptions.map((opt, i) => {
                                  const isConfirmed = oppManualBanIndex === opt.bannedIndex;
                                  const isSuggested = !isConfirmed && oppManualBanIndex === null && i === 0;
                                  return (
                                    <div key={i}
                                      onClick={() => setOppManualBanIndex(isConfirmed ? null : opt.bannedIndex)}
                                      className={cn(
                                        "p-3 rounded-lg cursor-pointer transition-all",
                                        isConfirmed && "bg-destructive/15 border border-destructive/40",
                                        isSuggested && "bg-orange-500/10 border border-orange-500/50 animate-pulse",
                                        !isConfirmed && !isSuggested && "bg-secondary/50 hover:bg-secondary",
                                      )}>
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                          {/* Checkbox: empty when only suggested, filled green check when confirmed */}
                                          <span className={cn(
                                            "h-4 w-4 shrink-0 rounded border flex items-center justify-center",
                                            isConfirmed
                                              ? "bg-green-500 border-green-500 text-white"
                                              : isSuggested
                                                ? "border-orange-500 bg-background"
                                                : "border-border bg-background",
                                          )}>
                                            {isConfirmed && <Check className="h-3 w-3" />}
                                          </span>
                                          <span className={cn(
                                            "font-medium text-sm truncate",
                                            isConfirmed ? "text-destructive" : isSuggested ? "text-orange-400" : "text-muted-foreground",
                                          )}>
                                            {!isConfirmed && !isSuggested && `#${i + 1} `}
                                            {opt.bannedArchetype}
                                          </span>
                                        </div>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className={`font-bold text-base shrink-0 ${getWinrateColor(opt.avgWinrate)}`}>
                                              {opt.avgWinrate}%
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-xs">{t("tournament.avgWrAfterBan")}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                      {isSuggested && (
                                        <p className="text-[11px] text-orange-300 mt-2 leading-snug bg-yellow-500/15 rounded px-2 py-1">
                                          {t("tournament.confirmSuggestedHint")}
                                        </p>
                                      )}
                                      {isConfirmed && (
                                        <p className="text-[11px] text-green-400 mt-2 leading-snug">
                                          {t("tournament.confirmedOppBan")}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    ) : (
                      <Card className="bg-card border-border overflow-hidden h-full">
                        <div className="relative p-6">
                          <div className="absolute inset-0 backdrop-blur-xl bg-background/80 z-10 flex flex-col items-center justify-center gap-2">
                            <Crown className="h-6 w-6 text-primary" />
                            <p className="text-foreground font-medium text-sm">{t("tournament.proOnly")}</p>
                            <p className="text-xs text-muted-foreground text-center">{t("tournament.oppBanProDesc")}</p>
                          </div>
                          <div className="space-y-3 opacity-30 select-none" aria-hidden>
                            <p className="font-display text-lg flex items-center gap-2">
                              <ArrowLeftRight className="h-5 w-5" /> {t("tournament.oppBan")}
                            </p>
                            <div className="h-10 bg-secondary/50 rounded" />
                            <div className="h-10 bg-secondary/50 rounded" />
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Optimal First Deck — PRO only */}
                  <div className="relative">
                    {IS_PRO ? (
                      <Card className="bg-card border-border border-l-4 border-l-primary h-full">
                        <CardHeader>
                          <CardTitle className="font-display text-base flex items-center gap-2">
                            <Star className="h-5 w-5 text-primary" />
                            <span className="truncate">{t("tournament.optimalFirstDeck")}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {optimalFirstDeck ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xl font-bold text-primary">{optimalFirstDeck.archetype}</span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={`text-base font-bold ${getWinrateColor(optimalFirstDeck.avgWr)}`}>
                                      {optimalFirstDeck.avgWr}%
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">{t("tournament.avgWrFull")}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {t("tournament.reasoningTemplate")
                                  .replace("{deck}", optimalFirstDeck.archetype)
                                  .replace("{wr}", String(optimalFirstDeck.avgWr))
                                  .replace("{opp}", optimalFirstDeck.topOpponent ?? "—")}
                              </p>
                              {(effectiveBanIdx !== null || oppBanForCalc !== null) && (
                                <div className="mt-2 p-2 bg-secondary/50 rounded text-xs text-muted-foreground flex items-start gap-2">
                                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                                  <span>
                                    {t("tournament.calculatedWithBans")}
                                    {effectiveBanIdx !== null ? ` «${oppArchetypes[effectiveBanIdx]}»` : ""}
                                    {oppBanForCalc !== null ? ` · ${t("tournament.oppBan")}: «${myArchetypes[oppBanForCalc]}»` : ""}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">{t("tournament.notEnoughData")}</p>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="bg-card border-border overflow-hidden h-full">
                        <div className="relative p-6">
                          <div className="absolute inset-0 backdrop-blur-xl bg-background/80 z-10 flex flex-col items-center justify-center gap-2">
                            <Crown className="h-6 w-6 text-primary" />
                            <p className="text-foreground font-medium text-sm">{t("tournament.proOnly")}</p>
                            <p className="text-xs text-muted-foreground text-center">{t("tournament.optimalFirstDeckProDesc")}</p>
                          </div>
                          <div className="space-y-3 opacity-30 select-none" aria-hidden>
                            <p className="font-display text-lg flex items-center gap-2">
                              <Star className="h-5 w-5" /> {t("tournament.optimalFirstDeck")}
                            </p>
                            <div className="h-12 bg-secondary/50 rounded" />
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>
    </TooltipProvider>
  );
};

/* ============================================================
   Sub-components
   ============================================================ */

function PreBanMiniMatrix({ myArchetypes, oppArchetypes, getWinrate }: {
  myArchetypes: string[]; oppArchetypes: string[]; getWinrate: GetWinrateFn;
}) {
  return (
    <table className="w-full text-[10px]">
      <thead>
        <tr>
          <th className="text-left p-1 text-muted-foreground">↓ / →</th>
          {oppArchetypes.map((o, i) => (
            <th key={i} className="p-1 text-center text-muted-foreground truncate max-w-[60px]">{o}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {myArchetypes.map((my, ri) => (
          <tr key={ri}>
            <td className="p-1 text-primary font-medium truncate max-w-[60px]">{my}</td>
            {oppArchetypes.map((opp, ci) => {
              const wr = getWinrate(my, opp);
              return (
                <td key={ci} className={`p-1 text-center font-bold ${getWinrateColor(wr)}`}>
                  {wr !== null ? `${wr}%` : "—"}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MatchupMatrix({ myArchetypes, oppArchetypes, bannedIndex, oppBannedIndex, getWinrate, getWinrateRaw, getArchetypeInfo, getEstimatedGames, minMatchupGames, t, archetypeGames }: {
  myArchetypes: string[]; oppArchetypes: string[]; bannedIndex: number | null; oppBannedIndex: number | null;
  getWinrate: GetWinrateFn; getWinrateRaw: GetWinrateFn;
  getArchetypeInfo: GetArchetypeInfoFn; getEstimatedGames: GetEstimatedGamesFn;
  minMatchupGames: number;
  t: (key: string) => string;
  archetypeGames?: Record<string, number>;
}) {
  // Detect "all-grey" case → fall back to raw winrates ignoring min filter
  const filteredHasAny = myArchetypes.some((my) =>
    oppArchetypes.some((opp) => getWinrate(my, opp) !== null)
  );
  const rawHasAny = myArchetypes.some((my) =>
    oppArchetypes.some((opp) => getWinrateRaw(my, opp) !== null)
  );
  const fallbackMode = !filteredHasAny && rawHasAny;
  const wrFn: GetWinrateFn = fallbackMode ? getWinrateRaw : getWinrate;

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          {t("tournament.matchupMatrix")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fallbackMode && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/15 border border-yellow-500/40 text-yellow-200 text-xs flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{t("tournament.fallbackWarning")}</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs border-2 border-border min-w-[110px] max-w-[140px]">
                  {t("tournament.youVsOpp")}
                </th>
                {oppArchetypes.map((opp, i) => {
                  const isBanned = bannedIndex === i;
                  const info = getArchetypeInfo(opp);
                  return (
                    <th key={i} className={cn(
                      "text-center py-2 px-3 font-medium text-xs border-2 border-border align-bottom",
                      isBanned ? "text-destructive opacity-70" : "text-foreground",
                    )}>
                      <div className="flex flex-col items-center gap-1">
                        {isBanned && (
                          <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">BAN</span>
                        )}
                        <span className={cn(
                          "inline-block",
                          isBanned && "line-through decoration-destructive decoration-[4px]",
                        )}>{opp}</span>
                        {info && archetypeGames && (
                          <span className="text-[10px] opacity-60">
                            {(archetypeGames[opp] || 0).toLocaleString('ru-RU')} игр
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {myArchetypes.map((my, rowIdx) => {
                const isMyBanned = oppBannedIndex === rowIdx;
                const info = getArchetypeInfo(my);
                return (
                  <tr key={rowIdx}>
                    <td className={cn(
                      "py-3 px-3 font-medium border-2 border-border min-w-[110px] max-w-[160px]",
                      isMyBanned ? "text-destructive opacity-70" : "text-primary",
                    )}>
                      <div className="flex flex-col items-start gap-1">
                        {isMyBanned && (
                          <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">BAN</span>
                        )}
                        <span className={cn(
                          "inline-block",
                          isMyBanned && "line-through decoration-destructive decoration-[4px]",
                        )}>{my}</span>
                        {info && archetypeGames && (
                          <span className="text-[10px] text-muted-foreground">
                            {(archetypeGames[my] || 0).toLocaleString('ru-RU')} игр
                          </span>
                        )}
                      </div>
                    </td>
                    {oppArchetypes.map((opp, colIdx) => {
                      const wr = wrFn(my, opp);
                      const games = getEstimatedGames(my, opp);
                      const isColBanned = bannedIndex === colIdx;
                      const isCellBanned = isColBanned || isMyBanned;
                      const isLowSample = wr !== null && games !== null && games < minMatchupGames;
                      return (
                        <td key={colIdx}
                          className={cn(
                            "py-3 px-3 text-center border-2 border-border relative",
                            isLowSample ? "bg-yellow-500/15" : getWinrateBg(wr),
                            isCellBanned && "opacity-60",
                          )}>
                          {isCellBanned && (
                            <svg
                              className="pointer-events-none absolute inset-0 w-full h-full z-10"
                              preserveAspectRatio="none"
                              viewBox="0 0 100 100"
                              aria-hidden
                            >
                              <line x1="0" y1="0" x2="100" y2="100" stroke="hsl(var(--destructive))" strokeWidth="6" vectorEffect="non-scaling-stroke" />
                              <line x1="100" y1="0" x2="0" y2="100" stroke="hsl(var(--destructive))" strokeWidth="6" vectorEffect="non-scaling-stroke" />
                            </svg>
                          )}
                          <div className={cn(
                            "font-bold flex items-center justify-center gap-1 relative",
                            getWinrateColor(wr),
                          )}>
                            {isLowSample && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="h-3 w-3 text-yellow-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{t("tournament.lowSampleTooltip").replace("{n}", String(minMatchupGames))}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <span className="inline-block">
                              {wr !== null ? `${wr}%` : "—"}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {games !== null ? `${games} ${t("tournament.games")}` : ""}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function BanOptionCard({ option, index, isActive, onManualBan, t }: {
  option: BanResult; index: number; isActive: boolean;
  onManualBan?: () => void; t: (key: string) => string;
}) {
  return (
    <TooltipProvider>
      <div className={`p-4 rounded-lg transition-all ${isActive
        ? "bg-destructive/10 border border-destructive/30 ring-1 ring-destructive/20"
        : "bg-secondary/50 hover:bg-secondary/70"
        } ${onManualBan && !isActive ? "cursor-pointer" : ""}`}
        onClick={!isActive && onManualBan ? onManualBan : undefined}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {isActive ? (
              <span className="text-lg">🔴</span>
            ) : (
              <span className="text-muted-foreground text-sm">#{index + 1}</span>
            )}
            <span className={`font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
              {t("tournament.banThis")}{" "}
              <span className={isActive ? "text-destructive font-bold" : ""}>{option.bannedArchetype}</span>
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-end">
                <span className={`font-bold text-lg ${getWinrateColor(option.avgWinrate)}`}>
                  {option.avgWinrate}%
                </span>
                <span className="text-[10px] text-muted-foreground">AVG WR</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{t("tournament.avgWrAfterBan")}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        {option.reasoning && (
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{option.reasoning}</p>
        )}
      </div>
    </TooltipProvider>
  );
}

function ArchetypeSelect({ value, onChange, placeholder, excludeValues = [], archetypeList, getWinrate, archetypeGames }: {
  value: string; onChange: (val: string) => void; placeholder: string;
  excludeValues?: string[]; archetypeList: ArchetypeInfo[]; getWinrate: GetWinrateFn;
  archetypeGames: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-secondary border-border text-foreground font-normal h-10"
        >
          <span className={value ? "" : "text-muted-foreground"}>{value || placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("tournament.archetypeSearchPlaceholder")} />
          <CommandList>
            <CommandEmpty>—</CommandEmpty>
            <CommandGroup>
              {archetypeList.map((arch) => {
                const disabled = excludeValues.includes(arch.name);
                const games = archetypeGames[arch.name] || 0;
                const isSelected = value === arch.name;
                return (
                  <CommandItem
                    key={arch.name}
                    value={arch.name}
                    disabled={disabled}
                    onSelect={(currentValue) => {
                      if (disabled) return;
                      onChange(currentValue);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="flex items-center gap-2">
                      <Check className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                      {arch.name}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums ml-2">
                      {games > 0 ? `${games.toLocaleString()} ${t("tournament.games")}` : "—"}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* ============================================================
   Utility
   ============================================================ */

function getWinrateColor(wr: number | null) {
  if (wr === null) return "text-muted-foreground";
  if (wr >= 55) return "text-green-400";
  if (wr >= 45) return "text-yellow-400";
  return "text-red-400";
}

function getWinrateBg(wr: number | null) {
  if (wr === null) return "bg-secondary/50";
  if (wr >= 55) return "bg-green-500/25";
  if (wr >= 45) return "bg-yellow-500/25";
  return "bg-red-500/25";
}

export default TournamentStrategist;
