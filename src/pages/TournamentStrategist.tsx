import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Trophy, ShieldAlert, Target, Info, Gamepad2,
  Eye, Lock, Crown, Ban, ArrowLeftRight, HelpCircle, Star, ChevronDown, ChevronUp,
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
} from "@/data/matchups";
import {
  calculateOptimalBan, calculateOpponentBan, calculateOptimalFirstDeck, type BanResult,
} from "@/data/banStrategy";
import { useAuth } from "@/hooks/useAuth";
import { useMatchupData } from "@/hooks/useMatchupData";

type DeckMode = 3 | 4;


const TournamentStrategist = () => {
  const { user, profile } = useAuth();
  const IS_PRO = profile?.is_pro ?? false;
  const IS_LOGGED_IN = !!user;
  const { archetypeList, matchupDB, date, isFromDB } = useMatchupData();

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

  // --- Mode toggle ---
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
      toast.error("Нельзя выбрать одну и ту же колоду дважды на одной стороне");
      return;
    }
    setShowResult(true);
    setManualBanIndex(null);
    setOppManualBanIndex(null);
    setShowOpponentBan(false);
  };

  const banOptions = useMemo(() => {
    if (!showResult) return [];
    return calculateOptimalBan(myArchetypes, oppArchetypes);
  }, [showResult, myArchetypes, oppArchetypes]);

  const oppBanOptions = useMemo(() => {
    if (!showResult || !showOpponentBan) return [];
    return calculateOpponentBan(myArchetypes, oppArchetypes);
  }, [showResult, showOpponentBan, myArchetypes, oppArchetypes]);

  const effectiveBanIdx = manualBanIndex ?? (banOptions.length > 0 ? banOptions[0].bannedIndex : null);

  // Optimal first deck calculation (PRO)
  const optimalFirstDeck = useMemo(() => {
    if (!showResult || !IS_PRO) return null;
    const oppBanned = oppBanOptions.length > 0 ? oppBanOptions[0].bannedIndex : null;
    return calculateOptimalFirstDeck(myArchetypes, oppArchetypes, oppManualBanIndex, effectiveBanIdx);
  }, [showResult, IS_PRO, myArchetypes, oppArchetypes, effectiveBanIdx, oppManualBanIndex, oppBanOptions]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <ManaLensNavbar />
        <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Турнирный <span className="text-primary">стратег</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Обновлено {DATA_UPDATED} · данные с ранга Legend
            </p>
          </motion.div>

          {/* Info / Help Box */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6">
            <button
              onClick={() => setShowInfoBox(!showInfoBox)}
              className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-primary transition-colors bg-secondary/60 px-4 py-2 rounded-full border border-border"
            >
              <HelpCircle className="h-4 w-4" />
              Как это работает? (аббревиатуры и концепция)
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
                  <h3 className="font-semibold text-foreground mb-2">Концепция турнирного бана</h3>
                  <p>В турнирном формате оба игрока берут <strong>3–4 колоды</strong>. До начала серии каждый <strong>банит (запрещает)</strong> одну колоду противника.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {[
                      { abbr: "AVG WR", desc: "Средний винрейт колоды против всех других в мете" },
                      { abbr: "Pop.", desc: "Популярность архетипа на ранге Legend (% от всех игр)" },
                      { abbr: "min WR", desc: "Худший матчап среди оставшихся после бана" },
                      { abbr: "BAN", desc: "Рекомендуемая колода на бан (убирается из серии)" },
                    ].map((item) => (
                      <div key={item.abbr} className="p-2 bg-background/50 rounded-lg border border-border">
                        <p className="font-bold text-primary text-xs">{item.abbr}</p>
                        <p className="text-xs mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs">Цвета: <span className="text-green-400">зелёный ≥55%</span> · <span className="text-yellow-400">жёлтый 45–55%</span> · <span className="text-red-400">красный &lt;45%</span></p>
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
                {m} колоды
              </button>
            ))}
          </motion.div>

          {/* Duplicate warning */}
          <AnimatePresence>
            {hasDuplicates && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm text-center font-medium">
                ⚠️ Нельзя выбрать одну и ту же колоду дважды на одной стороне
              </motion.div>
            )}
          </AnimatePresence>

          {/* Deck Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* My Decks */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <label className="block text-sm font-medium text-foreground mb-3">
                <Swords className="inline h-4 w-4 mr-1.5 text-primary" />
                Твои колоды
              </label>
              <div className="space-y-3">
                {myArchetypes.map((arch, i) => (
                  <ArchetypeSelect key={`my-${i}`} value={arch}
                    onChange={(val) => updateMyArchetype(i, val)}
                    placeholder={`Колода ${i + 1}...`}
                    excludeValues={[...myArchetypes.filter((_, j) => j !== i).filter(Boolean)]}
                  />
                ))}
              </div>
            </motion.div>

            {/* Opponent Decks */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-2 mb-3">
                <label className="block text-sm font-medium text-foreground">
                  <Target className="inline h-4 w-4 mr-1.5 text-destructive" />
                  Колоды противника
                </label>
                {showResult && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-sm p-3">
                      <p className="text-xs font-semibold mb-2">Матрица до бана:</p>
                      <PreBanMiniMatrix myArchetypes={myArchetypes} oppArchetypes={oppArchetypes} />
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="space-y-3">
                {oppArchetypes.map((arch, i) => {
                  const isBanned = showResult && effectiveBanIdx === i;
                  return (
                    <div key={`opp-${i}`} className="relative">
                      <ArchetypeSelect value={arch}
                        onChange={(val) => updateOppArchetype(i, val)}
                        placeholder={`Колода ${i + 1} противника...`}
                        excludeValues={[...oppArchetypes.filter((_, j) => j !== i).filter(Boolean)]}
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
                      {/* Manual ban — PRO only */}
                      {showResult && IS_PRO && !isBanned && (
                        <button
                          onClick={() => setManualBanIndex(i)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors text-xs opacity-60 hover:opacity-100"
                          title="Назначить бан вручную"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Calculate Button */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-10">
            {!IS_LOGGED_IN ? (
              <div className="text-center p-4 rounded-xl bg-secondary border border-border">
                <Lock className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">Для использования стратега необходимо войти в аккаунт</p>
                <Link to="/auth"><Button className="gap-2">Войти / Зарегистрироваться</Button></Link>
              </div>
            ) : (
              <Button onClick={handleCalculate}
                disabled={!allFilled || hasDuplicates}
                className="w-full gap-2 h-12 text-base font-semibold">
                <Trophy className="h-5 w-5" />
                Рассчитать стратегию
              </Button>
            )}
          </motion.div>

          {/* Results */}
          <AnimatePresence>
            {showResult && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }} className="space-y-6">

                {/* Matchup Matrix — with blur for non-logged */}
                <div className="relative">
                  <MatchupMatrix
                    myArchetypes={myArchetypes}
                    oppArchetypes={oppArchetypes}
                    bannedIndex={effectiveBanIdx}
                    oppBannedIndex={oppManualBanIndex}
                  />
                  {!IS_LOGGED_IN && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl backdrop-blur-xl bg-background/80">
                      <div className="text-center p-6">
                        <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
                        <p className="text-foreground font-semibold mb-1">Зарегистрируйтесь для просмотра таблицы</p>
                        <Link to="/auth"><Button size="sm" className="mt-2">Войти</Button></Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ban Recommendation */}
                <Card className="bg-card border-border border-l-4 border-l-destructive">
                  <CardHeader>
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-destructive" />
                      Рекомендация по бану
                      {manualBanIndex !== null && IS_PRO && (
                        <button onClick={() => setManualBanIndex(null)}
                          className="ml-auto text-xs text-muted-foreground hover:text-foreground underline">
                          Сбросить ручной бан
                        </button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {banOptions.map((option, i) => (
                      <BanOptionCard key={i} option={option} index={i}
                        isActive={effectiveBanIdx === option.bannedIndex}
                        onManualBan={IS_PRO ? () => setManualBanIndex(option.bannedIndex) : undefined}
                      />
                    ))}
                    {!IS_PRO && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        🔒 Ручной выбор бана доступен только в PRO
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Opponent Ban Section — PRO only */}
                <div className="relative">
                  {IS_PRO ? (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="font-display text-lg flex items-center gap-2">
                          <ArrowLeftRight className="h-5 w-5 text-primary" />
                          Бан противника
                          <button
                            onClick={() => setShowOpponentBan(!showOpponentBan)}
                            className={`ml-auto text-xs px-3 py-1 rounded-md transition-colors ${showOpponentBan
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                              }`}>
                            {showOpponentBan ? "Скрыть" : "Показать"}
                          </button>
                        </CardTitle>
                      </CardHeader>
                      <AnimatePresence>
                        {showOpponentBan && oppBanOptions.length > 0 && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}>
                            <CardContent className="space-y-3 pt-0">
                              <p className="text-xs text-muted-foreground mb-2">
                                Какую из ваших колод, скорее всего, забанит противник:
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
                                      <span className="text-xs text-muted-foreground">
                                        min {opt.minWinrate}% · avg {opt.avgWinrate}%
                                      </span>
                                    </div>
                                    {isOppBanned && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        ✅ Отмечено как забаненное противником — учтено в оптимальной колоде
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
                          <p className="text-foreground font-medium text-sm">🔒 Доступно на PRO</p>
                          <p className="text-xs text-muted-foreground">Прогноз бана противника</p>
                        </div>
                        <div className="space-y-3 opacity-30 select-none" aria-hidden>
                          <p className="font-display text-lg flex items-center gap-2">
                            <ArrowLeftRight className="h-5 w-5" /> Бан противника
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
                          Оптимальная колода для первого матча
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {optimalFirstDeck ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-bold text-primary">{optimalFirstDeck.archetype}</span>
                              <span className={`text-lg font-bold ${getWinrateColor(optimalFirstDeck.avgWr)}`}>
                                AVG WR {optimalFirstDeck.avgWr}%
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{optimalFirstDeck.reasoning}</p>
                            {(effectiveBanIdx !== null || oppManualBanIndex !== null) && (
                              <div className="mt-2 p-2 bg-secondary/50 rounded text-xs text-muted-foreground flex items-center gap-2">
                                <Info className="h-3 w-3" />
                                Рассчитано с учётом банов
                                {effectiveBanIdx !== null ? ` (бан: ${oppArchetypes[effectiveBanIdx]})` : ""}
                                {oppManualBanIndex !== null ? ` (их бан: ${myArchetypes[oppManualBanIndex]})` : ""}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">Недостаточно данных для расчёта.</p>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-card border-border overflow-hidden">
                      <div className="relative p-6">
                        <div className="absolute inset-0 backdrop-blur-xl bg-background/80 z-10 flex flex-col items-center justify-center gap-2">
                          <Crown className="h-6 w-6 text-primary" />
                          <p className="text-foreground font-medium text-sm">🔒 Доступно на PRO</p>
                          <p className="text-xs text-muted-foreground">Оптимальная колода для первого матча</p>
                        </div>
                        <div className="space-y-3 opacity-30 select-none" aria-hidden>
                          <p className="font-display text-lg flex items-center gap-2">
                            <Star className="h-5 w-5" /> Оптимальная колода
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

function PreBanMiniMatrix({ myArchetypes, oppArchetypes }: {
  myArchetypes: string[]; oppArchetypes: string[];
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

function MatchupMatrix({ myArchetypes, oppArchetypes, bannedIndex, oppBannedIndex }: {
  myArchetypes: string[]; oppArchetypes: string[]; bannedIndex: number | null; oppBannedIndex: number | null;
}) {
  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          Матрица матчапов
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">
                  Ты ↓ / Противник →
                </th>
                {oppArchetypes.map((opp, i) => {
                  const isBanned = bannedIndex === i;
                  const info = getArchetypeInfo(opp);
                  return (
                    <th key={i} className={`text-center py-2 px-3 font-medium text-xs ${isBanned ? "text-destructive" : "text-muted-foreground"
                      }`}>
                      <div className={isBanned ? "line-through decoration-destructive decoration-[3px]" : ""}>{opp}</div>
                      {isBanned && (
                        <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          BAN
                        </span>
                      )}
                      {info && (
                        <div className="text-[10px] opacity-60 space-y-0.5">
                          <div>AVG WR {info.winrate}%</div>
                          <div>Pop. {info.popularity}%</div>
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
                  <tr key={rowIdx} className={`border-t border-border ${isMyBanned ? "opacity-40" : ""}`}>
                    <td className="py-3 px-3 font-medium text-primary">
                      <div className={isMyBanned ? "line-through" : ""}>{my}</div>
                      {info && (
                        <div className="text-[10px] text-muted-foreground space-x-1">
                          <span>AVG WR {info.winrate}%</span>
                          <span>·</span>
                          <span>Pop. {info.popularity}%</span>
                        </div>
                      )}
                      {isMyBanned && (
                        <span className="text-[9px] bg-destructive/20 text-destructive px-1 py-0.5 rounded">Забанена</span>
                      )}
                    </td>
                    {oppArchetypes.map((opp, colIdx) => {
                      const wr = getWinrate(my, opp);
                      const games = getEstimatedGames(my, opp);
                      const isBanned = bannedIndex === colIdx;
                      return (
                        <td key={colIdx}
                          className={`py-3 px-3 text-center rounded ${isBanned ? "opacity-40" : ""
                            } ${getWinrateBg(wr)}`}>
                          <div className={`font-bold ${getWinrateColor(wr)}`}>
                            {wr !== null ? `${wr}%` : "—"}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {games !== null ? `~${games} игр` : "< 500"}
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
          «—» — менее 500 игр · Pop. = популярность колоды в мете Legend
        </p>
      </CardContent>
    </Card>
  );
}

function BanOptionCard({ option, index, isActive, onManualBan }: {
  option: BanResult; index: number; isActive: boolean;
  onManualBan?: () => void;
}) {
  return (
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
            Забанить{" "}
            <span className={isActive ? "text-destructive font-bold" : ""}>{option.bannedArchetype}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            min <span className={`font-bold ${getWinrateColor(option.minWinrate)}`}>{option.minWinrate}%</span>
          </span>
          <span className={`font-bold text-lg ${getWinrateColor(option.avgWinrate)}`}>
            {option.avgWinrate}%
          </span>
        </div>
      </div>
      {/* Reasoning */}
      {option.reasoning && (
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{option.reasoning}</p>
      )}
      {isActive && !option.reasoning && (
        <p className="text-sm text-muted-foreground mt-2">
          Минимальный винрейт: {option.minWinrate}% · Средний: {option.avgWinrate}%
        </p>
      )}
    </div>
  );
}

function ArchetypeSelect({ value, onChange, placeholder, excludeValues = [] }: {
  value: string; onChange: (val: string) => void; placeholder: string;
  excludeValues?: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-secondary border-border text-foreground">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {archetypeList.map((arch) => (
          <SelectItem key={arch.name} value={arch.name}
            disabled={excludeValues.includes(arch.name)}>
            <span className="flex items-center justify-between gap-3 w-full">
              <span>{arch.name}</span>
              <span className="text-xs text-muted-foreground ml-2">
                AVG WR {arch.winrate}% · Pop. {arch.popularity}%
              </span>
            </span>
          </SelectItem>
        ))}
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
