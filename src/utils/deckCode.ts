// Утилиты для работы с deck codes Hearthstone
// Для MVP: предустановленные колоды + определение архетипа по хешу

export interface DeckInfo {
  heroClass: string;
  archetype: string;
  cards: CardInfo[];
}

export interface CardInfo {
  name: string;
  manaCost: number;
  count: number;
  type: "minion" | "spell" | "weapon";
  rarity: "common" | "rare" | "epic" | "legendary";
}

// Предустановленные колоды для демо
const presetDecks: Record<string, DeckInfo> = {
  "AAECAQcG": {
    heroClass: "Warrior",
    archetype: "Control Warrior",
    cards: [
      { name: "Shield Slam", manaCost: 1, count: 2, type: "spell", rarity: "epic" },
      { name: "Execute", manaCost: 1, count: 2, type: "spell", rarity: "common" },
      { name: "Slam", manaCost: 2, count: 2, type: "spell", rarity: "common" },
      { name: "Shield Block", manaCost: 3, count: 2, type: "spell", rarity: "common" },
      { name: "Brawl", manaCost: 5, count: 2, type: "spell", rarity: "epic" },
      { name: "Armorsmith", manaCost: 2, count: 2, type: "minion", rarity: "rare" },
      { name: "Acolyte of Pain", manaCost: 3, count: 2, type: "minion", rarity: "common" },
      { name: "Justicar Trueheart", manaCost: 6, count: 1, type: "minion", rarity: "legendary" },
      { name: "Grommash Hellscream", manaCost: 8, count: 1, type: "minion", rarity: "legendary" },
      { name: "Dr. Boom", manaCost: 7, count: 1, type: "minion", rarity: "legendary" },
      { name: "Sylvanas Windrunner", manaCost: 6, count: 1, type: "minion", rarity: "legendary" },
      { name: "Cruel Taskmaster", manaCost: 2, count: 2, type: "minion", rarity: "common" },
      { name: "Fiery War Axe", manaCost: 3, count: 2, type: "weapon", rarity: "common" },
      { name: "Death's Bite", manaCost: 4, count: 2, type: "weapon", rarity: "common" },
      { name: "Bash", manaCost: 3, count: 2, type: "spell", rarity: "common" },
      { name: "Revenge", manaCost: 2, count: 2, type: "spell", rarity: "rare" },
      { name: "Geddon", manaCost: 7, count: 1, type: "minion", rarity: "legendary" },
      { name: "Ysera", manaCost: 9, count: 1, type: "minion", rarity: "legendary" },
    ],
  },
  "AAECAR8G": {
    heroClass: "Hunter",
    archetype: "Face Hunter",
    cards: [
      { name: "Arcane Shot", manaCost: 1, count: 2, type: "spell", rarity: "common" },
      { name: "Leper Gnome", manaCost: 1, count: 2, type: "minion", rarity: "common" },
      { name: "Worgen Infiltrator", manaCost: 1, count: 2, type: "minion", rarity: "common" },
      { name: "Knife Juggler", manaCost: 2, count: 2, type: "minion", rarity: "rare" },
      { name: "Quick Shot", manaCost: 2, count: 2, type: "spell", rarity: "common" },
      { name: "Animal Companion", manaCost: 3, count: 2, type: "spell", rarity: "common" },
      { name: "Kill Command", manaCost: 3, count: 2, type: "spell", rarity: "common" },
      { name: "Unleash the Hounds", manaCost: 3, count: 2, type: "spell", rarity: "common" },
      { name: "Eaglehorn Bow", manaCost: 3, count: 2, type: "weapon", rarity: "rare" },
      { name: "Wolfrider", manaCost: 3, count: 2, type: "minion", rarity: "common" },
      { name: "Abusive Sergeant", manaCost: 1, count: 2, type: "minion", rarity: "common" },
      { name: "Explosive Trap", manaCost: 2, count: 2, type: "spell", rarity: "common" },
      { name: "Glaivezooka", manaCost: 2, count: 2, type: "weapon", rarity: "common" },
      { name: "Ironbeak Owl", manaCost: 3, count: 1, type: "minion", rarity: "common" },
      { name: "Leeroy Jenkins", manaCost: 5, count: 1, type: "minion", rarity: "legendary" },
    ],
  },
  "AAECAZ8FBg": {
    heroClass: "Paladin",
    archetype: "Aggro Paladin",
    cards: [
      { name: "Blessing of Might", manaCost: 1, count: 2, type: "spell", rarity: "common" },
      { name: "Argent Squire", manaCost: 1, count: 2, type: "minion", rarity: "common" },
      { name: "Shielded Minibot", manaCost: 2, count: 2, type: "minion", rarity: "common" },
      { name: "Knife Juggler", manaCost: 2, count: 2, type: "minion", rarity: "rare" },
      { name: "Muster for Battle", manaCost: 3, count: 2, type: "spell", rarity: "rare" },
      { name: "Divine Favor", manaCost: 3, count: 2, type: "spell", rarity: "rare" },
      { name: "Consecration", manaCost: 4, count: 1, type: "spell", rarity: "common" },
      { name: "Truesilver Champion", manaCost: 4, count: 2, type: "weapon", rarity: "common" },
      { name: "Tirion Fordring", manaCost: 8, count: 1, type: "minion", rarity: "legendary" },
      { name: "Aldor Peacekeeper", manaCost: 3, count: 2, type: "minion", rarity: "rare" },
      { name: "Keeper of Uldaman", manaCost: 4, count: 2, type: "minion", rarity: "common" },
      { name: "Piloted Shredder", manaCost: 4, count: 2, type: "minion", rarity: "common" },
      { name: "Loatheb", manaCost: 5, count: 1, type: "minion", rarity: "legendary" },
      { name: "Dr. Boom", manaCost: 7, count: 1, type: "minion", rarity: "legendary" },
      { name: "Coghammer", manaCost: 3, count: 1, type: "weapon", rarity: "epic" },
      { name: "Equality", manaCost: 4, count: 1, type: "spell", rarity: "rare" },
    ],
  },
};

// Генерация колоды по хешу deck code (для неизвестных кодов)
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

const classes = ["Warrior", "Hunter", "Mage", "Rogue", "Priest", "Warlock", "Shaman", "Druid", "Paladin", "Demon Hunter"];

const archetypesByClass: Record<string, string[]> = {
  "Warrior": ["Control Warrior", "Aggro Warrior"],
  "Hunter": ["Face Hunter", "Midrange Hunter"],
  "Mage": ["Quest Mage", "Tempo Mage"],
  "Rogue": ["Miracle Rogue", "Aggro Rogue"],
  "Priest": ["Control Priest"],
  "Warlock": ["Control Warlock", "Zoo Warlock"],
  "Shaman": ["Aggro Shaman", "Control Shaman"],
  "Druid": ["Token Druid", "Ramp Druid"],
  "Paladin": ["Aggro Paladin"],
  "Demon Hunter": ["Aggro Demon Hunter"],
};

const cardNames: Record<string, string[]> = {
  "Warrior": ["Shield Slam", "Execute", "Brawl", "Armorsmith", "Fiery War Axe", "Mortal Strike", "Whirlwind", "Slam", "Shield Block", "Kor'kron Elite"],
  "Hunter": ["Kill Command", "Animal Companion", "Explosive Trap", "Quick Shot", "Eaglehorn Bow", "Unleash the Hounds", "Savannah Highmane", "Tracking", "Arcane Shot", "Freezing Trap"],
  "Mage": ["Fireball", "Frostbolt", "Arcane Intellect", "Flamestrike", "Polymorph", "Ice Block", "Sorcerer's Apprentice", "Mana Wyrm", "Mirror Image", "Blizzard"],
  "Rogue": ["Backstab", "Eviscerate", "Sap", "Fan of Knives", "Preparation", "SI:7 Agent", "Edwin VanCleef", "Deadly Poison", "Sprint", "Blade Flurry"],
  "Priest": ["Shadow Word: Pain", "Shadow Word: Death", "Holy Nova", "Northshire Cleric", "Power Word: Shield", "Circle of Healing", "Auchenai Soulpriest", "Lightbomb", "Cabal Shadow Priest", "Entomb"],
  "Warlock": ["Hellfire", "Shadowflame", "Doomguard", "Flame Imp", "Voidwalker", "Imp Gang Boss", "Power Overwhelming", "Soulfire", "Mortal Coil", "Dark Bomb"],
  "Shaman": ["Lightning Bolt", "Lava Burst", "Feral Spirit", "Hex", "Totem Golem", "Tunnel Trogg", "Earth Shock", "Crackle", "Flametongue Totem", "Lightning Storm"],
  "Druid": ["Innervate", "Wild Growth", "Swipe", "Wrath", "Savage Roar", "Force of Nature", "Druid of the Claw", "Keeper of the Grove", "Ancient of Lore", "Nourish"],
  "Paladin": ["Equality", "Consecration", "Truesilver Champion", "Aldor Peacekeeper", "Tirion Fordring", "Muster for Battle", "Shielded Minibot", "Blessing of Might", "Divine Favor", "Avenge"],
  "Demon Hunter": ["Twin Slice", "Chaos Strike", "Aldrachi Warblades", "Eye Beam", "Skull of Gul'dan", "Battlefiend", "Satyr Overseer", "Spectral Sight", "Metamorphosis", "Inner Demon"],
};

const spellNames = ["Arcane Missiles", "Polymorph", "Fireball", "Execute", "Backstab", "Eviscerate", "Innervate", "Wild Growth"];

function generateDeck(code: string): DeckInfo {
  const hash = hashCode(code);
  const heroClass = classes[hash % classes.length];
  const archetypes = archetypesByClass[heroClass];
  const archetype = archetypes[hash % archetypes.length];

  const classCards = cardNames[heroClass] || cardNames["Warrior"];
  const cards: CardInfo[] = [];
  const rarities: CardInfo["rarity"][] = ["common", "rare", "epic", "legendary"];

  for (let i = 0; i < 15; i++) {
    const cardHash = hashCode(code + i);
    const isSpell = cardHash % 3 === 0;
    const name = i < classCards.length ? classCards[i] : spellNames[i % spellNames.length];
    const manaCost = (cardHash % 8) + 1;
    const count = i < 12 ? 2 : 1;
    cards.push({
      name,
      manaCost,
      count,
      type: isSpell ? "spell" : (cardHash % 5 === 0 ? "weapon" : "minion"),
      rarity: rarities[i % 4],
    });
  }

  return { heroClass, archetype, cards };
}

// Основная функция декодирования
export function decodeDeck(code: string): DeckInfo {
  const trimmed = code.trim();
  
  // Проверить предустановленные колоды
  for (const [prefix, deck] of Object.entries(presetDecks)) {
    if (trimmed.startsWith(prefix)) return deck;
  }

  // Генерация по хешу для любого другого кода
  return generateDeck(trimmed);
}

// Подсчёт маны-кривой
export function getManaCurve(cards: CardInfo[]): Record<string, number> {
  const curve: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7+": 0 };
  cards.forEach((card) => {
    const key = card.manaCost >= 7 ? "7+" : String(card.manaCost);
    curve[key] += card.count;
  });
  return curve;
}

// Подсчёт стоимости в пыли
export function getDustCost(cards: CardInfo[]): number {
  const dustMap = { common: 40, rare: 100, epic: 400, legendary: 1600 };
  return cards.reduce((total, card) => total + dustMap[card.rarity] * card.count, 0);
}

// Подсчёт по типам
export function getTypeCounts(cards: CardInfo[]): Record<string, number> {
  const counts: Record<string, number> = { minion: 0, spell: 0, weapon: 0 };
  cards.forEach((card) => {
    counts[card.type] += card.count;
  });
  return counts;
}
