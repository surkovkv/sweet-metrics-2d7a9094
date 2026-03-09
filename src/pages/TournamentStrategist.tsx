import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Trophy, ShieldAlert, Target, Info, Gamepad2,
  Lock, Crown, Ban, ArrowLeftRight, HelpCircle, Star, ChevronDown, ChevronUp, History, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
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

type DeckMode = 3 | 4;
type GetWinrateFn = (my: string, opp: string) => number | null;
type GetArchetypeInfoFn = (name: string) => ArchetypeInfo | undefined;
type GetEstimatedGamesFn = (a: string, b: string) => number | null;

/* Ban History */
const BAN_HISTORY_KEY = "manalens_ban_history";
const MAX_HISTORY = 2;

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
  const { archetypeList, matchupDB, date, isFromDB } = useMatchupData();
  const t = useT();
  const { remaining, isExhausted, consumeTrial, maxTrials } = useTrialCounter();

  // For FREE users: can they use PRO features via trial?
  const canUseProFeatures = IS_PRO || (!IS_PRO && !isExhausted);

  const getWinrate = useCallback((my: string, opp: string): number | null => {
    return matchupDB[my]?.[opp] ?? null;
  }, [matchupDB]);

  const getArchetypeInfo = useCallback((name: string) => {
    const found = archetypeList.find((a) => a.name === name);
    return found ?? staticGetArchetypeInfo(name);
  }, [archetypeList]);

  const getEstimatedGames = useCallback((arch1: string, arch2: string): number | null => {
    if (getWinrate(arch1, arch2) === null) return null;
    const info1 = getArchetypeInfo(arch1);
    const info2 = getArchetypeInfo(arch2);
    if (!info1 || !info2) return null;
    const est = Math.round(200000 * (info1.popularity / 100) * (info2.popularity / 100));
    return Math.max(est, 500);
  }, [getWinrate, getArchetypeInfo]);

  const DATA_UPDATED = date || "2026-03-03";

  const [mode, setMode] = useState<DeckMode>(3);
  const [myArchetypes, setMyArchetypes] = useState<string[]>(["", "", ""]);
  const [oppArchetypes, setOppArchetypes] = useState<string[]>(["", "", ""]);
  const [showResult, setShowResult] = useState(false);
  const [manualBanIndex, setManualBanIndex] = useState<number | null>(null);
  const [showOpponentBan, setShowOpponentBan] = useState(false);
  const [showInfoBox, setShowInfoBox] = useState(false);
  const [oppManualBanIndex, setOppManualBanIndex] = useState<number | null>(null);
  const [banHistory, setBanHistory] = useState<Record<DeckMode, BanHistoryEntry[]>>({
    3: [], 4: [],
  });

  useEffect(() => {
    setBanHistory({ 3: loadBanHistory(3), 4: loadBanHistory(4) });
  }, []);

  const currentHistory = banHistory[mode];

  const handleModeChange = (newMode: DeckMode) => {
    setMode(newMode);
    const resize = (arr: string[]) =>
      newMode === 4 && arr.length === 3 ? [...arr, ""] :
        newMode === 3 && arr.length === 4 ? arr.slice(0, 3) : arr;
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

  const effectiveBanIdx = manualBanIndex ?? (banOptions.length > 0 ? banOptions[0].bannedIndex : null);

  const optimalFirstDeck = useMemo(() => {
    if (!showResult || !IS_PRO) return null;
    return calculateOptimalFirstDeck(myArchetypes, oppArchetypes, oppManualBanIndex, effectiveBanIdx, getWinrate);
  }, [showResult, IS_PRO, myArchetypes, oppArchetypes, effectiveBanIdx, oppManualBanIndex, getWinrate]);

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

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              {t("tournament.title")} <span className="text-primary">{t("tournament.titleHighlight")}</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("tournament.updated")} {DATA_UPDATED} · {t("tournament.legendData")}
            </p>
          </motion.div>

          {/* Info / Help Box */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6">
            <button
              onClick={() => setShowInfoBox(!showInfoBox)}
              className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-primary transition-colors bg-secondary/60 px-4 py-2 rounded-full border border-border"
            >
              <HelpCircle className="h-4 w-4" />
              {t("tournament.howItWorks")}
              {showInfoBox ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            <AnimatePresence>
              {showInfoBox && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-4 rounded-xl bg-secondary/60 border border-border text-sm text-muted-foreground space-y-2"
                >
                  <h3 className="font-semibold text-foreground mb-2">{t("tournament.conceptTitle")}</h3>
                  <p className="text-center">{t("tournament.conceptDesc")}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 max-w-lg mx-auto">
                    {[
                      { abbr: t("tournament.avgWr"), desc: t("tournament.avgWrDesc") },
                      { abbr: t("tournament.minWrLabel"), desc: t("tournament.minWrDesc") },
                      { abbr: t("tournament.banLabel"), desc: t("tournament.banDesc") },
                    ].map((item) => (
                      <div key={item.abbr} className="p-2 bg-background/50 rounded-lg border border-border">
                        <p className="font-bold text-primary text-xs">{item.abbr}</p>
                        <p className="text-xs mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-center">{t("tournament.colors")} <span className="text-green-400">{t("tournament.colorGreen")}</span> · <span className="text-yellow-400">{t("tournament.colorYellow")}</span> · <span className="text-red-400">{t("tournament.colorRed")}</span></p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Mode Toggle */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex justify-center gap-3 mb-8">
            {([3, 4] as DeckMode[]).map((m) => (
              <button key={m} onClick={() => handleModeChange(m)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}>
                {t(m === 3 ? "tournament.decks3" : "tournament.decks4")}
              </button>
            ))}
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
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-6 mb-8">
            {/* My Decks */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <label className="block text-sm font-medium text-foreground mb-3">
                <Swords className="inline h-4 w-4 mr-1.5 text-primary" />
                {t("tournament.yourDecks")}
              </label>
              <div className="space-y-3">
                {myArchetypes.map((arch, i) => (
                  <ArchetypeSelect key={`my-${i}`} value={arch}
                    onChange={(val) => updateMyArchetype(i, val)}
                    placeholder={`${t("tournament.deck")} ${i + 1}...`}
                    excludeValues={[...myArchetypes.filter((_, j) => j !== i).filter(Boolean)]}
                    archetypeList={archetypeList}
                    getWinrate={getWinrate}
                  />
                ))}
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
                {/* Vertical PRO Badge above opponent decks */}
                <div
                  className="flex flex-col items-center justify-center bg-gradient-to-b from-primary/30 to-primary/10 text-primary rounded border border-primary/20 shadow-sm"
                  style={{ padding: "2px 4px", lineHeight: "1.1" }}
                >
                  <span className="text-[10px] font-black uppercase">P</span>
                  <span className="text-[10px] font-black uppercase">R</span>
                  <span className="text-[10px] font-black uppercase">O</span>
                </div>
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
                        archetypeList={archetypeList}
                        getWinrate={getWinrate}
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

            {/* Ban History — compact sidebar */}
            {IS_LOGGED_IN && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                className="hidden md:flex flex-col items-center gap-2 pt-8">
                {IS_PRO ? (
                  currentHistory.length > 0 ? (
                    <>
                      {/* Current ban (star) */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => currentHistory[0] && restoreFromHistory(currentHistory[0])}
                            className="w-9 h-9 rounded-full border-2 border-primary bg-primary/10 text-primary flex items-center justify-center transition-all hover:scale-110"
                          >
                            <Star className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="text-xs font-semibold">BAN: {currentHistory[0].bannedDeck}</p>
                          <p className={`text-xs font-bold ${getWinrateColor(currentHistory[0].avgWr)}`}>{currentHistory[0].avgWr}%</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{currentHistory[0].myDecks.join(", ")} vs {currentHistory[0].oppDecks.join(", ")}</p>
                          <p className="text-[10px] text-primary mt-1">{t("tournament.restoreBan")}</p>
                        </TooltipContent>
                      </Tooltip>
                      {/* Previous ban */}
                      {currentHistory[1] && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => restoreFromHistory(currentHistory[1])}
                              className="w-9 h-9 rounded-full border-2 border-border bg-secondary/50 text-muted-foreground flex items-center justify-center transition-all hover:scale-110 hover:border-primary/50"
                            >
                              <History className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <p className="text-xs font-semibold">BAN: {currentHistory[1].bannedDeck}</p>
                            <p className={`text-xs font-bold ${getWinrateColor(currentHistory[1].avgWr)}`}>{currentHistory[1].avgWr}%</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{currentHistory[1].myDecks.join(", ")} vs {currentHistory[1].oppDecks.join(", ")}</p>
                            <p className="text-[10px] text-primary mt-1">{t("tournament.restoreBan")}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-9 h-9 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                          <History className="h-3.5 w-3.5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-xs">{t("tournament.noBanHistory")}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                ) : (
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col items-center gap-2 p-2 rounded-lg border-2 border-dashed border-border relative">
                      <div className="w-9 h-9 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground opacity-40 blur-[2px]">
                        <Star className="h-4 w-4" />
                      </div>
                      <div className="w-9 h-9 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground opacity-40 blur-[2px]">
                        <History className="h-3.5 w-3.5" />
                      </div>
                      <span className="absolute inset-0 flex items-center justify-center text-yellow-500 font-bold text-xs [writing-mode:vertical-lr] tracking-widest z-10">PRO</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-6 w-6 text-yellow-500 cursor-help mt-1 shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="text-xs">{t("tournament.banHistoryProOnly")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Mobile Ban History */}
          {IS_LOGGED_IN && IS_PRO && currentHistory.length > 0 && (
            <div className="md:hidden flex gap-2 mb-4 justify-center items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => currentHistory[0] && restoreFromHistory(currentHistory[0])}
                    className="w-9 h-9 rounded-full border-2 border-primary bg-primary/10 text-primary flex items-center justify-center transition-all"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-semibold">BAN: {currentHistory[0].bannedDeck} ({currentHistory[0].avgWr}%)</p>
                  <p className="text-[10px] text-primary">{t("tournament.restoreBan")}</p>
                </TooltipContent>
              </Tooltip>
              {currentHistory[1] && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => restoreFromHistory(currentHistory[1])}
                      className="w-9 h-9 rounded-full border-2 border-border bg-secondary/50 text-muted-foreground flex items-center justify-center transition-all"
                    >
                      <History className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs font-semibold">BAN: {currentHistory[1].bannedDeck} ({currentHistory[1].avgWr}%)</p>
                    <p className="text-[10px] text-primary">{t("tournament.restoreBan")}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
          {IS_LOGGED_IN && !IS_PRO && (
            <div className="md:hidden flex gap-2 mb-4 justify-center items-center">
              <div className="flex gap-2 items-center p-2 rounded-lg border-2 border-dashed border-border relative">
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground opacity-40 blur-[2px]">
                  <Star className="h-4 w-4" />
                </div>
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground opacity-40 blur-[2px]">
                  <History className="h-3.5 w-3.5" />
                </div>
                <span className="absolute inset-0 flex items-center justify-center text-yellow-500 font-bold text-sm z-10">PRO</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-6 w-6 text-yellow-500 cursor-help shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{t("tournament.banHistoryProOnly")}</p>
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
                    getArchetypeInfo={getArchetypeInfo}
                    getEstimatedGames={getEstimatedGames}
                    t={t}
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

                {/* Opponent Ban Section — PRO only */}
                <div className="relative">
                  {IS_PRO ? (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="font-display text-lg flex items-center gap-2">
                          <ArrowLeftRight className="h-5 w-5 text-primary" />
                          {t("tournament.oppBan")}
                          <Button
                            onClick={() => setShowOpponentBan(!showOpponentBan)}
                            variant={showOpponentBan ? "default" : "secondary"}
                            size="default"
                            className="ml-auto gap-1.5 font-semibold"
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
                                const isOppBanned = oppManualBanIndex === opt.bannedIndex;
                                return (
                                  <div key={i}
                                    onClick={() => setOppManualBanIndex(isOppBanned ? null : opt.bannedIndex)}
                                    className={`p-3 rounded-lg cursor-pointer transition-all ${isOppBanned
                                      ? "bg-destructive/10 border border-destructive/30"
                                      : i === 0 ? "bg-destructive/10 border border-destructive/30" : "bg-secondary/50 hover:bg-secondary"
                                      }`}>
                                    <div className="flex items-center justify-between">
                                      <span className={`font-medium text-sm ${i === 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                        {i === 0 ? "🔴 " : `#${i + 1} `}
                                        {opt.bannedArchetype}
                                      </span>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className={`font-bold text-lg ${getWinrateColor(opt.avgWinrate)}`}>
                                            {opt.avgWinrate}%
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs">{t("tournament.avgWrAfterBan")}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                    {isOppBanned && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {t("tournament.markedAsBanned")}
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
                    <Card className="bg-card border-border overflow-hidden">
                      <div className="relative p-6">
                        <div className="absolute inset-0 backdrop-blur-xl bg-background/80 z-10 flex flex-col items-center justify-center gap-2">
                          <Crown className="h-6 w-6 text-primary" />
                          <p className="text-foreground font-medium text-sm">{t("tournament.proOnly")}</p>
                          <p className="text-xs text-muted-foreground">{t("tournament.oppBanProDesc")}</p>
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
                    <Card className="bg-card border-border border-l-4 border-l-primary">
                      <CardHeader>
                        <CardTitle className="font-display text-lg flex items-center gap-2">
                          <Star className="h-5 w-5 text-primary" />
                          {t("tournament.optimalFirstDeck")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {optimalFirstDeck ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-bold text-primary">{optimalFirstDeck.archetype}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className={`text-lg font-bold ${getWinrateColor(optimalFirstDeck.avgWr)}`}>
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
                            {(effectiveBanIdx !== null || oppManualBanIndex !== null) && (
                              <div className="mt-2 p-2 bg-secondary/50 rounded text-xs text-muted-foreground flex items-center gap-2">
                                <Info className="h-3 w-3" />
                                {t("tournament.calculatedWithBans")}
                                {effectiveBanIdx !== null ? ` «${oppArchetypes[effectiveBanIdx]}»` : ""}
                                {oppManualBanIndex !== null ? ` · ${t("tournament.oppBan")}: «${myArchetypes[oppManualBanIndex]}»` : ""}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">{t("tournament.notEnoughData")}</p>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-card border-border overflow-hidden">
                      <div className="relative p-6">
                        <div className="absolute inset-0 backdrop-blur-xl bg-background/80 z-10 flex flex-col items-center justify-center gap-2">
                          <Crown className="h-6 w-6 text-primary" />
                          <p className="text-foreground font-medium text-sm">{t("tournament.proOnly")}</p>
                          <p className="text-xs text-muted-foreground">{t("tournament.optimalFirstDeckProDesc")}</p>
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

function MatchupMatrix({ myArchetypes, oppArchetypes, bannedIndex, oppBannedIndex, getWinrate, getArchetypeInfo, getEstimatedGames, t }: {
  myArchetypes: string[]; oppArchetypes: string[]; bannedIndex: number | null; oppBannedIndex: number | null;
  getWinrate: GetWinrateFn; getArchetypeInfo: GetArchetypeInfoFn; getEstimatedGames: GetEstimatedGamesFn;
  t: (key: string) => string;
}) {
  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          {t("tournament.matchupMatrix")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs border-2 border-border">
                  {t("tournament.youVsOpp")}
                </th>
                {oppArchetypes.map((opp, i) => {
                  const isBanned = bannedIndex === i;
                  const info = getArchetypeInfo(opp);
                  return (
                    <th key={i} className={`text-center py-2 px-3 font-medium text-xs border-2 border-border ${isBanned ? "text-destructive" : "text-muted-foreground"
                      }`}>
                      {isBanned && (
                        <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded mb-1 inline-block">
                          BAN
                        </span>
                      )}
                      <div className={isBanned ? "line-through decoration-destructive decoration-[3px]" : ""}>{opp}</div>
                      {info && (
                        <div className="text-[10px] opacity-60 space-y-0.5">
                          <div>AVG WR {Number(info.winrate).toFixed(1)}%</div>
                        </div>
                      )}
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
                  <tr key={rowIdx} className={isMyBanned ? "opacity-40" : ""}>
                    <td className="py-3 px-3 font-medium text-primary border-2 border-border">
                      <div className={isMyBanned ? "line-through" : ""}>{my}</div>
                      {info && (
                        <div className="text-[10px] text-muted-foreground">
                          <span>AVG WR {Number(info.winrate).toFixed(1)}%</span>
                        </div>
                      )}
                      {isMyBanned && (
                        <span className="text-[9px] bg-destructive/20 text-destructive px-1 py-0.5 rounded">{t("tournament.banned")}</span>
                      )}
                    </td>
                    {oppArchetypes.map((opp, colIdx) => {
                      const wr = getWinrate(my, opp);
                      const games = getEstimatedGames(my, opp);
                      const isBanned = bannedIndex === colIdx;
                      return (
                        <td key={colIdx}
                          className={`py-3 px-3 text-center border-2 border-border ${isBanned ? "opacity-40" : ""
                            } ${getWinrateBg(wr)}`}>
                          <div className={`font-bold ${getWinrateColor(wr)}`}>
                            {wr !== null ? `${wr}%` : "—"}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {games !== null ? `~${games} ${t("tournament.games")}` : t("tournament.lessGames")}
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
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <Info className="h-3 w-3" />
          {t("tournament.matrixNote")}
        </p>
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

function ArchetypeSelect({ value, onChange, placeholder, excludeValues = [], archetypeList, getWinrate }: {
  value: string; onChange: (val: string) => void; placeholder: string;
  excludeValues?: string[]; archetypeList: ArchetypeInfo[]; getWinrate: GetWinrateFn;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-secondary border-border text-foreground">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {archetypeList.map((arch) => {
          let safeWr = arch.winrate;
          if (safeWr < 45 && safeWr > 0) {
            const wrs = archetypeList.map(opp => getWinrate(arch.name, opp.name)).filter(w => w !== null) as number[];
            if (wrs.length > 0) safeWr = wrs.reduce((sum, w) => sum + w, 0) / wrs.length;
          }
          return (
            <SelectItem key={arch.name} value={arch.name}
              disabled={excludeValues.includes(arch.name)}>
              <span className="flex items-center justify-between gap-3 w-full">
                <span>{arch.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  AVG WR {Number(safeWr).toFixed(1)}%
                </span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
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
  if (wr >= 55) return "bg-green-500/10";
  if (wr >= 45) return "bg-yellow-500/10";
  return "bg-red-500/10";
}

export default TournamentStrategist;
