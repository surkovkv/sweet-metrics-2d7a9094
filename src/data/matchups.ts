// Данные с HSGuru.com (Legend, min 500 games) — актуальные винрейты текущего патча
// Источник: https://www.hsguru.com/matchups?min_archetype_sample=500&min_matchup_sample=500&rank=legend

export interface ArchetypeInfo {
  name: string;
  winrate: number; // Общий винрейт
  popularity: number; // Популярность в %
}

// Все архетипы с общим винрейтом и популярностью
export const archetypeList: ArchetypeInfo[] = [
  { name: "Control DK", winrate: 51.5, popularity: 12.5 },
  { name: "Elise DH", winrate: 55.2, popularity: 11.9 },
  { name: "Control Warrior", winrate: 49.1, popularity: 11.5 },
  { name: "Arkwing Mage", winrate: 53.5, popularity: 11.0 },
  { name: "Maestra Rogue", winrate: 46.1, popularity: 6.7 },
  { name: "Elise Rogue", winrate: 47.2, popularity: 6.7 },
  { name: "Dragon Warrior", winrate: 54.2, popularity: 3.2 },
  { name: "Discover Hunter", winrate: 50.7, popularity: 2.9 },
  { name: "Herenn DK", winrate: 51.6, popularity: 2.8 },
  { name: "Wallow Warlock", winrate: 48.0, popularity: 2.6 },
  { name: "Copy Druid", winrate: 50.2, popularity: 2.5 },
  { name: "Aura Paladin", winrate: 54.0, popularity: 2.0 },
  { name: "Libram Paladin", winrate: 50.9, popularity: 1.6 },
  { name: "Aviana Priest", winrate: 41.9, popularity: 1.2 },
  { name: "Hagatha Shaman", winrate: 49.9, popularity: 1.2 },
  { name: "Protoss Mage", winrate: 44.6, popularity: 1.0 },
  { name: "Protoss Rogue", winrate: 50.5, popularity: 0.8 },
  { name: "Spell Mage", winrate: 45.9, popularity: 0.8 },
  { name: "Toki Mage", winrate: 37.9, popularity: 0.7 },
  { name: "Protoss Priest", winrate: 50.1, popularity: 0.7 },
  { name: "Aggro Warlock", winrate: 49.3, popularity: 0.7 },
  { name: "Quest Mage", winrate: 47.8, popularity: 0.6 },
];

// Матрица матчапов: архетип -> архетип противника -> процент побед
// Данные из таблицы HSGuru (только ячейки с данными, min 500 игр в матчапе)
export const matchupDB: Record<string, Record<string, number>> = {
  "Control DK": {
    "Control DK": 50.0, "Elise DH": 40.3, "Control Warrior": 50.9, "Arkwing Mage": 54.2,
    "Maestra Rogue": 57.9, "Elise Rogue": 52.2, "Dragon Warrior": 56.8, "Discover Hunter": 52.0,
    "Herenn DK": 47.0, "Wallow Warlock": 51.1, "Copy Druid": 50.6, "Aura Paladin": 44.4,
    "Libram Paladin": 52.7, "Aviana Priest": 52.2, "Hagatha Shaman": 53.3, "Protoss Mage": 59.2,
    "Protoss Rogue": 54.2, "Spell Mage": 51.6, "Toki Mage": 64.7, "Protoss Priest": 45.5,
    "Aggro Warlock": 57.7, "Quest Mage": 47.7,
  },
  "Elise DH": {
    "Control DK": 59.7, "Elise DH": 50.0, "Control Warrior": 54.8, "Arkwing Mage": 45.9,
    "Maestra Rogue": 56.9, "Elise Rogue": 62.6, "Dragon Warrior": 58.4, "Discover Hunter": 42.5,
    "Herenn DK": 69.2, "Wallow Warlock": 67.3, "Copy Druid": 48.7, "Aura Paladin": 53.8,
    "Libram Paladin": 53.0, "Aviana Priest": 62.7, "Hagatha Shaman": 57.4, "Protoss Mage": 55.7,
    "Spell Mage": 51.3, "Toki Mage": 52.7, "Aggro Warlock": 64.3, "Quest Mage": 53.4,
  },
  "Control Warrior": {
    "Control DK": 49.1, "Elise DH": 45.2, "Control Warrior": 50.0, "Arkwing Mage": 51.8,
    "Maestra Rogue": 44.0, "Elise Rogue": 44.5, "Dragon Warrior": 43.6, "Discover Hunter": 60.2,
    "Herenn DK": 37.5, "Wallow Warlock": 41.4, "Copy Druid": 32.6, "Aura Paladin": 43.4,
    "Libram Paladin": 45.4, "Aviana Priest": 46.7, "Hagatha Shaman": 49.3, "Protoss Mage": 49.9,
    "Spell Mage": 42.1, "Toki Mage": 72.4, "Protoss Priest": 41.1, "Quest Mage": 64.9,
  },
  "Arkwing Mage": {
    "Control DK": 45.8, "Elise DH": 54.1, "Control Warrior": 48.2, "Arkwing Mage": 50.0,
    "Maestra Rogue": 70.7, "Elise Rogue": 60.1, "Dragon Warrior": 44.8, "Discover Hunter": 51.0,
    "Herenn DK": 55.7, "Wallow Warlock": 54.6, "Copy Druid": 64.0, "Aura Paladin": 43.4,
    "Libram Paladin": 60.5, "Aviana Priest": 68.7, "Hagatha Shaman": 60.6, "Protoss Mage": 66.6,
    "Spell Mage": 55.3, "Toki Mage": 45.9, "Protoss Priest": 66.8, "Quest Mage": 43.6,
  },
  "Maestra Rogue": {
    "Control DK": 42.1, "Elise DH": 43.1, "Control Warrior": 56.0, "Arkwing Mage": 29.3,
    "Maestra Rogue": 50.0, "Elise Rogue": 56.0, "Dragon Warrior": 32.3, "Discover Hunter": 46.4,
    "Herenn DK": 40.8, "Wallow Warlock": 48.3, "Copy Druid": 43.5, "Aura Paladin": 58.5,
    "Libram Paladin": 46.3, "Aviana Priest": 62.0, "Hagatha Shaman": 41.5, "Protoss Mage": 63.7,
  },
  "Elise Rogue": {
    "Control DK": 47.8, "Elise DH": 37.4, "Control Warrior": 55.5, "Arkwing Mage": 39.9,
    "Maestra Rogue": 44.0, "Elise Rogue": 50.0, "Dragon Warrior": 43.8, "Discover Hunter": 48.3,
    "Herenn DK": 46.8, "Wallow Warlock": 51.7, "Copy Druid": 54.0, "Aura Paladin": 46.8,
    "Libram Paladin": 41.4, "Aviana Priest": 63.0, "Hagatha Shaman": 51.8, "Protoss Mage": 50.3,
  },
  "Dragon Warrior": {
    "Control DK": 43.2, "Elise DH": 41.6, "Control Warrior": 56.4, "Arkwing Mage": 55.2,
    "Maestra Rogue": 67.7, "Elise Rogue": 56.2, "Dragon Warrior": 50.0, "Discover Hunter": 58.9,
    "Copy Druid": 60.8, "Aura Paladin": 52.6,
  },
  "Discover Hunter": {
    "Control DK": 48.0, "Elise DH": 57.5, "Control Warrior": 39.8, "Arkwing Mage": 49.0,
    "Maestra Rogue": 53.6, "Elise Rogue": 51.7, "Dragon Warrior": 41.1, "Discover Hunter": 50.0,
    "Copy Druid": 55.0,
  },
  "Herenn DK": {
    "Control DK": 53.0, "Elise DH": 30.8, "Control Warrior": 62.5, "Arkwing Mage": 44.3,
    "Maestra Rogue": 59.2, "Elise Rogue": 53.2, "Herenn DK": 50.0, "Wallow Warlock": 57.3,
    "Copy Druid": 45.8,
  },
  "Wallow Warlock": {
    "Control DK": 48.9, "Elise DH": 32.7, "Control Warrior": 58.6, "Arkwing Mage": 45.4,
    "Maestra Rogue": 51.7, "Elise Rogue": 48.3, "Herenn DK": 42.7, "Wallow Warlock": 50.0,
  },
  "Copy Druid": {
    "Control DK": 49.4, "Elise DH": 51.3, "Control Warrior": 67.4, "Arkwing Mage": 36.0,
    "Maestra Rogue": 56.5, "Elise Rogue": 46.0, "Dragon Warrior": 39.2, "Discover Hunter": 45.0,
    "Herenn DK": 54.2,
  },
  "Aura Paladin": {
    "Control DK": 55.6, "Elise DH": 46.2, "Control Warrior": 56.6, "Arkwing Mage": 56.6,
    "Maestra Rogue": 41.5, "Elise Rogue": 53.2, "Dragon Warrior": 47.4,
  },
  "Libram Paladin": {
    "Control DK": 47.3, "Elise DH": 47.0, "Control Warrior": 54.6, "Arkwing Mage": 39.5,
    "Maestra Rogue": 53.7, "Elise Rogue": 58.6,
  },
  "Aviana Priest": {
    "Control DK": 47.8, "Elise DH": 37.3, "Control Warrior": 53.3, "Arkwing Mage": 31.3,
    "Maestra Rogue": 38.0, "Elise Rogue": 37.0,
  },
  "Hagatha Shaman": {
    "Control DK": 46.7, "Elise DH": 42.6, "Control Warrior": 50.7, "Arkwing Mage": 39.4,
    "Maestra Rogue": 58.5, "Elise Rogue": 48.2,
  },
  "Protoss Mage": {
    "Control DK": 40.8, "Elise DH": 44.3, "Control Warrior": 50.1, "Arkwing Mage": 33.4,
    "Maestra Rogue": 36.3, "Elise Rogue": 49.7,
  },
  "Protoss Rogue": {
    "Control DK": 45.8, "Elise DH": 48.7, "Control Warrior": 57.9, "Arkwing Mage": 44.7,
  },
  "Spell Mage": {
    "Control DK": 48.4, "Elise DH": 47.3, "Control Warrior": 27.6, "Arkwing Mage": 54.1,
  },
  "Toki Mage": {
    "Control DK": 35.3, "Arkwing Mage": 33.2,
  },
  "Protoss Priest": {
    "Control DK": 54.5, "Control Warrior": 58.9,
  },
  "Aggro Warlock": {
    "Control DK": 42.3, "Elise DH": 35.7,
  },
  "Quest Mage": {
    "Control DK": 52.3, "Elise DH": 46.6, "Control Warrior": 35.1, "Arkwing Mage": 56.4,
  },
};

// Все доступные архетипы (отсортированы по популярности)
export const allArchetypes = archetypeList.map((a) => a.name);

// Получить информацию об архетипе
export function getArchetypeInfo(name: string): ArchetypeInfo | undefined {
  return archetypeList.find((a) => a.name === name);
}

// Получить винрейт матчапа (null если нет данных)
export function getWinrate(myArchetype: string, opponentArchetype: string): number | null {
  return matchupDB[myArchetype]?.[opponentArchetype] ?? null;
}

// Рассчитать стратегию бана
export interface BanOption {
  bannedIndex: number;
  bannedArchetype: string;
  avgWinrate: number;
  winrates: (number | null)[];
}

export function calculateBanStrategy(
  myArchetype: string,
  opponentArchetypes: string[]
): BanOption[] {
  const options: BanOption[] = opponentArchetypes.map((_, banIdx) => {
    const remaining = opponentArchetypes.filter((_, i) => i !== banIdx);
    const winrates = remaining.map((opp) => getWinrate(myArchetype, opp));
    const known = winrates.filter((w): w is number => w !== null);
    const avg = known.length > 0 ? known.reduce((sum, w) => sum + w, 0) / known.length : 50;
    return {
      bannedIndex: banIdx,
      bannedArchetype: opponentArchetypes[banIdx],
      avgWinrate: Math.round(avg * 10) / 10,
      winrates,
    };
  });
  return options.sort((a, b) => b.avgWinrate - a.avgWinrate);
}
