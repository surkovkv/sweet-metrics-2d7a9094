import { getWinrate } from "./matchups";

/** Результат расчёта бана для одного кандидата */
export interface BanResult {
  bannedIndex: number;
  bannedArchetype: string;
  /** Минимальный лучший винрейт среди оставшихся матчапов */
  minWinrate: number;
  /** Средний лучший винрейт среди оставшихся матчапов */
  avgWinrate: number;
  /** Винрейты против каждой оставшейся колоды (лучший из моих) */
  remainingWinrates: { opponent: string; bestWr: number | null }[];
}

/**
 * Рассчитать оптимальный бан колоды противника.
 * Для каждой колоды-кандидата на бан:
 *   1. Убираем её, остаются N-1 колод.
 *   2. Для каждой оставшейся берём лучший винрейт из всех моих колод.
 *   3. Считаем min и avg этих лучших винрейтов.
 * Сортировка: max(min), при равенстве — max(avg).
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
  return results.sort((a, b) => {
    if (b.minWinrate !== a.minWinrate) return b.minWinrate - a.minWinrate;
    return b.avgWinrate - a.avgWinrate;
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
  // Для каждой моей колоды как кандидата на бан противником
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
