import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Trophy, ShieldAlert, Target, Info, Gamepad2,
  Eye, Lock, Crown, Ban, ArrowLeftRight,
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
import ManaLensNavbar from "@/components/ManaLensNavbar";
import {
  getWinrate, getEstimatedGames, allArchetypes,
  archetypeList, getArchetypeInfo,
} from "@/data/matchups";
import {
  calculateOptimalBan, calculateOpponentBan, type BanResult,
} from "@/data/banStrategy";
import { useTrialCounter } from "@/hooks/useTrialCounter";

type DeckMode = 3 | 4;

// Временно: PRO-статус. Заменить на реальную проверку позже.
const IS_PRO = false;

const TournamentStrategist = () => {
  const [mode, setMode] = useState<DeckMode>(3);
  const [myArchetypes, setMyArchetypes] = useState<string[]>(["", "", ""]);
  const [oppArchetypes, setOppArchetypes] = useState<string[]>(["", "", ""]);
  const [showResult, setShowResult] = useState(false);
  const [manualBanIndex, setManualBanIndex] = useState<number | null>(null);
  const [showOpponentBan, setShowOpponentBan] = useState(false);

  const { remaining, isExhausted, consumeTrial, maxTrials } = useTrialCounter();

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
  };

  // --- Duplicate check ---
  const hasDuplicates = useMemo(() => {
    const mySet = new Set(myArchetypes.filter(Boolean));
    const oppSet = new Set(oppArchetypes.filter(Boolean));
    for (const a of mySet) if (oppSet.has(a)) return true;
    // Also check duplicates within same side
    if (myArchetypes.filter(Boolean).length !== mySet.size) return true;
    if (oppArchetypes.filter(Boolean).length !== oppSet.size) return true;
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

  // --- Calculate ---
  const handleCalculate = () => {
    if (!allFilled) return;
    if (hasDuplicates) {
      toast.error("Ваша колода и колода противника не могут быть одинаковыми");
      return;
    }

    if (!IS_PRO) {
      if (isExhausted) {
        toast.error("Лимит исчерпан. Купите PRO для безлимитного доступа.");
        return;
      }
      consumeTrial();
    }

    setShowResult(true);
    setManualBanIndex(null);
    setShowOpponentBan(false);
  };

  // --- Ban results ---
  const banOptions = useMemo(() => {
    if (!showResult) return [];
    return calculateOptimalBan(myArchetypes, oppArchetypes);
  }, [showResult, myArchetypes, oppArchetypes]);

  const oppBanOptions = useMemo(() => {
    if (!showResult || !showOpponentBan) return [];
    return calculateOpponentBan(myArchetypes, oppArchetypes);
  }, [showResult, showOpponentBan, myArchetypes, oppArchetypes]);

  // Determine effective ban
  const effectiveBanIdx = manualBanIndex ?? (banOptions.length > 0 ? banOptions[0].bannedIndex : null);

  // --- Button text ---
  const calcButtonText = !IS_PRO && isExhausted
    ? "Лимит исчерпан. Купите PRO"
    : "Рассчитать стратегию";

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <ManaLensNavbar />
        <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Турнирный <span className="text-primary">стратег</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Данные с HSGuru · Legend · Текущий патч
            </p>
          </motion.div>

          {/* Mode Toggle */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex justify-center gap-3 mb-8">
            {([3, 4] as DeckMode[]).map((m) => (
              <button key={m} onClick={() => handleModeChange(m)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === m ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
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
                ⚠️ Ваша колода и колода противника не могут быть одинаковыми
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
                {/* Eye icon — pre-ban matrix tooltip */}
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
                      {/* Ban overlay */}
                      {isBanned && (
                        <div className="absolute inset-0 flex items-center pointer-events-none">
                          <div className="absolute inset-0 rounded-lg border-2 border-destructive/50" />
                          <div className="absolute left-0 right-0 top-1/2 h-[3px] bg-destructive -translate-y-1/2 mx-2" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded">
                            BAN
                          </span>
                        </div>
                      )}
                      {/* Manual ban click (PRO only) */}
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

          {/* Trial counter (FREE only) */}
          {!IS_PRO && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center mb-4">
              <span className="text-xs text-muted-foreground">
                Осталось бесплатных расчётов: <span className="text-primary font-bold">{remaining}/{maxTrials}</span>
              </span>
            </motion.div>
          )}

          {/* Calculate Button */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-10">
            <Button onClick={handleCalculate}
              disabled={!allFilled || hasDuplicates || (!IS_PRO && isExhausted)}
              className="w-full gap-2 h-12 text-base font-semibold">
              <Trophy className="h-5 w-5" />
              {calcButtonText}
            </Button>
          </motion.div>

          {/* Results */}
          <AnimatePresence>
            {showResult && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }} className="space-y-6">

                {/* Matchup Matrix — blurred for FREE */}
                <div className="relative">
                  <MatchupMatrix myArchetypes={myArchetypes} oppArchetypes={oppArchetypes}
                    bannedIndex={effectiveBanIdx} />
                  {!IS_PRO && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl backdrop-blur-md bg-background/70">
                      <div className="text-center p-6">
                        <Crown className="h-8 w-8 text-primary mx-auto mb-3" />
                        <p className="text-foreground font-semibold mb-1">⭐ Детальная статистика матчапов в PRO</p>
                        <p className="text-muted-foreground text-sm">Оформите подписку для доступа к полной таблице</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ban Recommendation */}
                {IS_PRO ? (
                  <Card className="bg-card border-border border-l-4 border-l-destructive">
                    <CardHeader>
                      <CardTitle className="font-display text-lg flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-destructive" />
                        Рекомендация по бану
                        {manualBanIndex !== null && (
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
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card border-border border-l-4 border-l-primary">
                    <CardContent className="p-6 text-center">
                      <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
                      <p className="text-foreground font-semibold mb-1">
                        Стратегия бана доступна в PRO-версии
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Оформите подписку, чтобы увидеть, какую колоду выгоднее забанить
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Opponent Ban Section */}
                <div className="relative">
                  {IS_PRO ? (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="font-display text-lg flex items-center gap-2">
                          <ArrowLeftRight className="h-5 w-5 text-primary" />
                          Бан противника
                          <button
                            onClick={() => setShowOpponentBan(!showOpponentBan)}
                            className={`ml-auto text-xs px-3 py-1 rounded-md transition-colors ${
                              showOpponentBan
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
                              {oppBanOptions.map((opt, i) => (
                                <div key={i} className={`p-3 rounded-lg ${
                                  i === 0 ? "bg-destructive/10 border border-destructive/30" : "bg-secondary/50"
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
                                </div>
                              ))}
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  ) : (
                    <Card className="bg-card border-border overflow-hidden">
                      <div className="relative p-6">
                        <div className="absolute inset-0 backdrop-blur-md bg-background/70 z-10 flex items-center justify-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-center cursor-help">
                                <p className="text-foreground font-medium">🤫 Секретная тактика для PRO</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs max-w-[200px]">
                                Узнай, какую колоду, скорее всего, запретит твой соперник
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {/* Blurred content placeholder */}
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

/** Мини-матрица для тултипа «Глаз» */
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

/** Полная матрица матчапов */
function MatchupMatrix({ myArchetypes, oppArchetypes, bannedIndex }: {
  myArchetypes: string[]; oppArchetypes: string[]; bannedIndex: number | null;
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
                  return (
                    <th key={i} className={`text-center py-2 px-3 font-medium text-xs ${
                      isBanned ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      <div className={isBanned ? "line-through decoration-destructive decoration-[3px]" : ""}>
                        {opp}
                      </div>
                      {isBanned && (
                        <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          BAN
                        </span>
                      )}
                      <div className="text-[10px] opacity-60">
                        {getArchetypeInfo(opp)?.popularity}% meta
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {myArchetypes.map((my, rowIdx) => (
                <tr key={rowIdx} className="border-t border-border">
                  <td className="py-3 px-3 font-medium text-primary">
                    <div>{my}</div>
                    <div className="text-[10px] text-muted-foreground">
                      WR: {getArchetypeInfo(my)?.winrate}%
                    </div>
                  </td>
                  {oppArchetypes.map((opp, colIdx) => {
                    const wr = getWinrate(my, opp);
                    const games = getEstimatedGames(my, opp);
                    const isBanned = bannedIndex === colIdx;
                    return (
                      <td key={colIdx}
                        className={`py-3 px-3 text-center rounded ${
                          isBanned ? "opacity-40" : ""
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
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <Info className="h-3 w-3" />
          «—» — менее 500 игр · Кол-во игр — оценка на основе популярности
        </p>
      </CardContent>
    </Card>
  );
}

/** Карточка варианта бана */
function BanOptionCard({ option, index, isActive, onManualBan }: {
  option: BanResult; index: number; isActive: boolean;
  onManualBan?: () => void;
}) {
  return (
    <div className={`p-4 rounded-lg transition-all ${
      isActive
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
            <span className={isActive ? "text-destructive font-bold" : ""}>
              {option.bannedArchetype}
            </span>
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
      {isActive && (
        <p className="text-sm text-muted-foreground mt-2">
          Минимальный винрейт: {option.minWinrate}% · Средний: {option.avgWinrate}%
        </p>
      )}
    </div>
  );
}

/** Селект архетипа с фильтрацией уже выбранных */
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
                WR {arch.winrate}% · {arch.popularity}%
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
  if (wr >= 55) return "text-winrate-good";
  if (wr >= 45) return "text-winrate-neutral";
  return "text-winrate-bad";
}

function getWinrateBg(wr: number | null) {
  if (wr === null) return "bg-secondary/50";
  if (wr >= 55) return "bg-winrate-good/15";
  if (wr >= 45) return "bg-winrate-neutral/15";
  return "bg-winrate-bad/15";
}

export default TournamentStrategist;
