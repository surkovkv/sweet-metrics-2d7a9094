import { getWinrate } from "./matchups";

/** Результат расчёта бана для одного кандидата */
export interface BanResult {
  bannedIndex: number;
  bannedArchetype: string;
  /** Минимальный лучший винрейт среди оставшихся матчапов */
  minWinrate: number;
  /** Средний лучший винрейт среди оставшихся матчапов */
  avgWinrate: number;
  /** Объяснение различий бана (если баны не очевидны) */
  reasoning?: string;
  /** Винрейты против каждой оставшейся колоды (лучший из моих) */
  remainingWinrates: { opponent: string; bestWr: number | null }[];
}

/**
 * Порог "очевидности" бана.
 * Если лучший вариант превышает остальные по avgWR на >= 3%, бан считается очевидным.
 */
const OBVIOUS_THRESHOLD = 3.0;

/**
 * Рассчитать оптимальный бан колоды противника.
 * Для каждой колоды-кандидата на бан:
 *   1. Убираем её, остаются N-1 колод.
 *   2. Для каждой оставшейся берём лучший винрейт из всех моих колод.
 *   3. Считаем min и avg этих лучших винрейтов.
 * Сортировка: max(min), при равенстве — max(avg).
 * Если бан очевиден — возвращаем только лучший вариант.
 * Если не очевиден — добавляем поле reasoning с описанием различий.
 */
export function calculateOptimalBan(
  myArchetypes: string[],
  oppArchetypes: string[]
): BanResult[] {
  const results: BanResult[] = oppArchetypes.map((banned, banIdx) => {
    const remaining = oppArchetypes.filter((_, i) => i !== banIdx);

    const remainingWinrates = remaining.map((opp) => {
      const wrs = myArchetypes
        .map((my) => getWinrate(my, opp))
        .filter((w): w is number => w !== null);
      const bestWr = wrs.length > 0 ? Math.max(...wrs) : null;
      return { opponent: opp, bestWr };
    });

    const known = remainingWinrates
      .map((r) => r.bestWr)
      .filter((w): w is number => w !== null);

    const minWr = known.length > 0 ? Math.min(...known) : 50;
    const avgWr =
      known.length > 0 ? known.reduce((s, w) => s + w, 0) / known.length : 50;

    return {
      bannedIndex: banIdx,
      bannedArchetype: banned,
      minWinrate: Math.round(minWr * 10) / 10,
      avgWinrate: Math.round(avgWr * 10) / 10,
      remainingWinrates,
    };
  });

  // Сортировка: max min, затем max avg
  results.sort((a, b) => {
    if (b.minWinrate !== a.minWinrate) return b.minWinrate - a.minWinrate;
    return b.avgWinrate - a.avgWinrate;
  });

  const best = results[0];
  const isObvious = results.length <= 1 ||
    (best.avgWinrate - results[1].avgWinrate >= OBVIOUS_THRESHOLD);

  if (isObvious) {
    // Возвращаем только один — очевидный выбор
    return [best];
  }

  // Неочевидный бан: добавляем reasoning
  return results.map((opt, idx) => {
    // Найти самую проблемную колоду, которую мы оставляем (с худшим WR)
    const worstMatchup = [...opt.remainingWinrates]
      .filter((r) => r.bestWr !== null)
      .sort((a, b) => (a.bestWr ?? 999) - (b.bestWr ?? 999))[0];

    const bestMatchup = [...opt.remainingWinrates]
      .filter((r) => r.bestWr !== null)
      .sort((a, b) => (b.bestWr ?? 0) - (a.bestWr ?? 0))[0];

    const reasoning = idx === 0
      ? `Общий лучший вариант. Оставляет нам сильные матчапы против ${bestMatchup?.opponent ?? "противников"}.`
      : `Выбери этот бан, если хочешь избежать игры против ${opt.bannedArchetype}` +
      (worstMatchup ? `, но придётся иметь дело с ${worstMatchup.opponent} (WR ${worstMatchup.bestWr}%).` : ".");

    return { ...opt, reasoning };
  });
}

/**
 * Рассчитать бан противника (какую из МОИХ колод противник скорее всего забанит).
 * Логика зеркальная: противник хочет минимизировать наш лучший винрейт.
 */
export function calculateOpponentBan(
  myArchetypes: string[],
  oppArchetypes: string[]
): BanResult[] {
  const results: BanResult[] = myArchetypes.map((banned, banIdx) => {
    const remainingMy = myArchetypes.filter((_, i) => i !== banIdx);

    const remainingWinrates = oppArchetypes.map((opp) => {
      const wrs = remainingMy
        .map((my) => getWinrate(my, opp))
        .filter((w): w is number => w !== null);
      const bestWr = wrs.length > 0 ? Math.max(...wrs) : null;
      return { opponent: opp, bestWr };
    });

    const known = remainingWinrates
      .map((r) => r.bestWr)
      .filter((w): w is number => w !== null);

    const minWr = known.length > 0 ? Math.min(...known) : 50;
    const avgWr =
      known.length > 0 ? known.reduce((s, w) => s + w, 0) / known.length : 50;

    return {
      bannedIndex: banIdx,
      bannedArchetype: banned,
      minWinrate: Math.round(minWr * 10) / 10,
      avgWinrate: Math.round(avgWr * 10) / 10,
      remainingWinrates,
    };
  });

  // Противник хочет МИНИМИЗИРОВАТЬ наш винрейт → сортировка по возрастанию
  return results.sort((a, b) => {
    if (a.minWinrate !== b.minWinrate) return a.minWinrate - b.minWinrate;
    return a.avgWinrate - b.avgWinrate;
  });
}

/**
 * Вычислить оптимальную колоду для первого матча.
 * С учётом бана нашей колоды и бана колоды противника.
 * @param myArchetypes - все наши архетипы
 * @param oppArchetypes - все архетипы противника (уже без забаненного)
 * @param myBannedIndex - какую нашу колоду забанил противник (null если неизвестно)
 */
export function calculateOptimalFirstDeck(
  myArchetypes: string[],
  oppArchetypes: string[],
  myBannedIndex: number | null = null,
  oppBannedIndex: number | null = null
): { archetype: string; avgWr: number; reasoning: string } | null {
  const effectiveMyDecks = myArchetypes.filter((_, i) => i !== myBannedIndex);
  const effectiveOppDecks = oppArchetypes.filter((_, i) => i !== oppBannedIndex);

  if (effectiveMyDecks.length === 0 || effectiveOppDecks.length === 0) return null;

  const candidates = effectiveMyDecks.map((my) => {
    const wrs = effectiveOppDecks
      .map((opp) => getWinrate(my, opp))
      .filter((w): w is number => w !== null);
    const avgWr = wrs.length > 0
      ? wrs.reduce((s, w) => s + w, 0) / wrs.length
      : 50;
    return { archetype: my, avgWr: Math.round(avgWr * 10) / 10 };
  });

  candidates.sort((a, b) => b.avgWr - a.avgWr);
  const best = candidates[0];

  const topOpp = [...effectiveOppDecks]
    .map((opp) => ({ opp, wr: getWinrate(best.archetype, opp) ?? 50 }))
    .sort((a, b) => b.wr - a.wr)[0];

  return {
    ...best,
    reasoning: `${best.archetype} показывает AVG WR ${best.avgWr}% против оставшихся колод соперника. Особенно силён против ${topOpp?.opp ?? "большинства противников"}.`,
  };
}
