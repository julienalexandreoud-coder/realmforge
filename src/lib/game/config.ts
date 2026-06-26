// REALMFORGE — pixel-art buildings, biomes, palettes, balance
import type {
  BuildingDef,
  BiomeDef,
  BiomeId,
  UpgradeDef,
  UpgradeId,
  AchievementDef,
  ThemeId,
  SaveState,
} from "./types";

// ---------- Balance (HARD MODE — tuned for ~hours of progression, not minutes) ----------
export const COMBO_WINDOW_MS = 1000; // tighter combo window = harder to sustain
export const COMBO_MAX = 60;
export const CRIT_BASE = 0.03;
export const SURGE_DURATION_MS = 45_000; // shorter surge
export const SURGE_MULT = 2.5; // weaker surge
export const ASCENSION_THRESHOLD = 20_000_000; // first ascension is a long-term goal
export const OFFLINE_CAP_MS = 6 * 3600 * 1000;
export const PLOT_W = 64;
export const GROUND_H = 40;
export const MAX_DAILY_STREAK = 7;

// income/coin scaling per building index (era) — slow compounding
export function buildingIncomeAt(index: number): number {
  return 0.5 * Math.pow(1.08, index);
}
// completion bonus — LINEAR (no exponential explosion); main reward is ongoing income
export function buildingCompleteBonusAt(index: number): number {
  return 5 + index * 0.5;
}
// build-units required to complete a building at given index — very steep (bites early)
export function buildingProgressCost(index: number): number {
  return 25 * Math.pow(1.55, index);
}

// ---------- Biomes (cycle infinitely) ----------
export const BIOMES: BiomeDef[] = [
  {
    id: "plains",
    name: "Dusk Plains",
    sky: ["#0b1430", "#15203f", "#1e2a4a"],
    ground: "#1a2b1e",
    groundDark: "#0f1a12",
    accent: "#22d3ee",
    decoration: ["..T..", ".TTT.", "TTTTT", "..|.."],
    decPalette: { T: "#14532d", "|:": "#3a2410" },
    buildings: ["cottage", "windmill", "barn"],
  },
  {
    id: "forest",
    name: "Shadow Wood",
    sky: ["#0a1a16", "#102820", "#16332a"],
    ground: "#0f2418",
    groundDark: "#08160e",
    accent: "#10b981",
    decoration: ["..F..", ".FFF.", "FFFFF", "FFFFF", "..#.."],
    decPalette: { F: "#064e3b", "#": "#3a2410" },
    buildings: ["treehouse", "lodge"],
  },
  {
    id: "desert",
    name: "Amber Wastes",
    sky: ["#1a1208", "#2a1d0e", "#3a2814"],
    ground: "#3a2a14",
    groundDark: "#241a0c",
    accent: "#f59e0b",
    decoration: ["..c..", ".ccc.", "ccccc", "..|.."],
    decPalette: { c: "#3f7a2a", "|:": "#7a5a2a" },
    buildings: ["pyramid", "oasis"],
  },
  {
    id: "snow",
    name: "Frost Reach",
    sky: ["#0a1420", "#101e2e", "#162838"],
    ground: "#1a2a36",
    groundDark: "#101a24",
    accent: "#67e8f9",
    decoration: ["..*..", ".*P*.", "*PPP*", "..#.."],
    decPalette: { P: "#155e75", "*": "#e0f2fe", "#": "#3a2410" },
    buildings: ["igloo", "icecastle"],
  },
  {
    id: "volcano",
    name: "Emberlands",
    sky: ["#1a0808", "#2a0e0e", "#3a1414"],
    ground: "#2a1414",
    groundDark: "#1a0a0a",
    accent: "#fb7185",
    decoration: ["..R..", ".RRR.", "RRRRR", "..^.."],
    decPalette: { R: "#0a0a0a", "^": "#f97316" },
    buildings: ["forge", "obsidian"],
  },
  {
    id: "sky",
    name: "Sky Reach",
    sky: ["#0a1830", "#102240", "#162c50"],
    ground: "#1a2c48",
    groundDark: "#101c34",
    accent: "#38bdf8",
    decoration: ["ooooo", ".....", ".....", "ooooo"],
    decPalette: { o: "#cbd5e1" },
    buildings: ["cloudhall", "balloon"],
  },
  {
    id: "space",
    name: "Star Void",
    sky: ["#050514", "#0a0a24", "#101034"],
    ground: "#10102a",
    groundDark: "#08081a",
    accent: "#a855f7",
    decoration: ["*.*.*", ".....", ".*.*.", "....."],
    decPalette: { "*": "#e9d5ff", ".": "transparent" },
    buildings: ["rocket", "dome"],
  },
  {
    id: "void",
    name: "Crystal Rift",
    sky: ["#0a0518", "#150a28", "#1f1038"],
    ground: "#1a1030",
    groundDark: "#10081f",
    accent: "#e879f9",
    decoration: ["..V..", ".VVV.", "VVVVV", "..V.."],
    decPalette: { V: "#a21caf" },
    buildings: ["crystaltower", "riftgate"],
  },
];

export function biomeForIndex(index: number): BiomeDef {
  return BIOMES[index % BIOMES.length];
}

// deterministic pseudo-random per plot index
export function seededRand(index: number, salt: number): number {
  let x = (index + 1) * 2654435761 + salt * 40503;
  x = Math.imul(x ^ (x >>> 15), 2246822507);
  x = Math.imul(x ^ (x >>> 13), 3266489909);
  x ^= x >>> 16;
  return ((x >>> 0) % 100000) / 100000;
}

export function buildingForPlot(index: number): BuildingDef {
  const biome = biomeForIndex(index);
  const pick = Math.floor(seededRand(index, 7) * biome.buildings.length);
  return BUILDINGS[biome.buildings[pick]];
}

// ---------- Buildings (hand-crafted pixel sprites) ----------
export const BUILDINGS: Record<string, BuildingDef> = {
  // ---- Plains ----
  cottage: {
    id: "cottage",
    name: "Cottage",
    biome: "plains",
    w: 9,
    h: 9,
    baseIncome: 2,
    palette: { R: "#b5443a", r: "#8a2f28", W: "#e8d5a8", w: "#c4ab7e", D: "#6b4423", W2: "#4a8ad9", g: "#ffffff" },
    sprite: [
      "....g....",
      "...RRR...",
      "..RRRRR..",
      ".RRRRRRR.",
      "WWWWWWWWW",
      "WWDWWWWW2",
      "WWDWWWWW2",
      "WWWWWWWWW",
      "WWWWWWWWW",
    ],
  },
  windmill: {
    id: "windmill",
    name: "Windmill",
    biome: "plains",
    w: 9,
    h: 10,
    baseIncome: 3,
    palette: { W: "#e8d5a8", w: "#c4ab7e", S: "#6b4423", M: "#5a3a2a", B: "#d9c08a" },
    sprite: [
      "....X....",
      "...X.X...",
      "..X...X..",
      ".X.MMM.X.",
      "...MSM...",
      "...MSM...",
      "..WMXMW..",
      "..WMMM W.",
      "..WMMMW..",
      "..WWWWW..",
    ].map((r) => r.replace(/X/g, "B")),
  },
  barn: {
    id: "barn",
    name: "Barn",
    biome: "plains",
    w: 10,
    h: 8,
    baseIncome: 2.5,
    palette: { R: "#a83232", r: "#7a1f1f", W: "#e8d5a8", D: "#3a2010", B: "#5a3a2a" },
    sprite: [
      "...RRRR...",
      "..RRRRRR..",
      ".RRRRRRRR.",
      "RRRRRRRRRR",
      "RWWRDDRRRR",
      "RWWRDDRRRR",
      "RWWRDDRRRR",
      "RRRRRRRRRR",
    ],
  },
  // ---- Forest ----
  treehouse: {
    id: "treehouse",
    name: "Treehouse",
    biome: "forest",
    w: 9,
    h: 10,
    baseIncome: 4,
    palette: { T: "#1f5e1f", t: "#144014", W: "#a87f4a", D: "#5a3a1a", g: "#ffffff" },
    sprite: [
      "....g....",
      "...TTT...",
      "..TTTTT..",
      ".TTTTTTT.",
      "TTTTTTTTT",
      "T.WWDWW T",
      "T.WWDWW T",
      "TtWWWWWt T".replace(" ", "."),
      ".tWWTWWt.",
      "..tWWt...",
    ],
  },
  lodge: {
    id: "lodge",
    name: "Lodge",
    biome: "forest",
    w: 10,
    h: 8,
    baseIncome: 4.5,
    palette: { W: "#7a5a3a", w: "#5a3f24", R: "#3a5a2a", D: "#2a1a0a", L: "#a87f4a" },
    sprite: [
      "...RRRR...",
      "..RRRRRR..",
      ".RRRRRRRR.",
      "WWWWWWWWWW",
      "WLWDWWWLWW",
      "WLWDWWWLWW",
      "WWWWWWWWWW",
      "wwwwwwwwww",
    ],
  },
  // ---- Desert ----
  pyramid: {
    id: "pyramid",
    name: "Pyramid",
    biome: "desert",
    w: 9,
    h: 7,
    baseIncome: 5,
    palette: { S: "#d4a64a", s: "#b8862a", D: "#5a3a1a", g: "#ffd700" },
    sprite: [
      "....g....",
      "...SSS...",
      "..SSSSS..",
      ".SSSSSSS.",
      "SSSSSSSSS",
      "SsSsSsSsS",
      "SSSSSSSSS",
    ],
  },
  oasis: {
    id: "oasis",
    name: "Oasis",
    biome: "desert",
    w: 9,
    h: 6,
    baseIncome: 4,
    palette: { W: "#3aa0d9", w: "#2a7fb0", P: "#3f7a2a", S: "#e0a83e" },
    sprite: [
      "..PPP....",
      ".PWWWP..",
      "PWWWWWP.",
      "PWWWWWP.",
      "SSSSSSSS",
      "SsSsSsSs",
    ].map((r) => r.padEnd(9, ".")),
  },
  // ---- Snow ----
  igloo: {
    id: "igloo",
    name: "Igloo",
    biome: "snow",
    w: 9,
    h: 6,
    baseIncome: 6,
    palette: { I: "#dfeef7", i: "#a8c8d8", D: "#3a5a7a", S: "#ffffff" },
    sprite: [
      "..SSSSS..",
      ".IIIIIII.",
      "IIIIIIIII",
      "IIIDIIIII",
      "IIIDIIIII",
      "iiiiiiiii",
    ],
  },
  icecastle: {
    id: "icecastle",
    name: "Ice Castle",
    biome: "snow",
    w: 10,
    h: 9,
    baseIncome: 7,
    palette: { I: "#bfe3f5", i: "#7fb8d8", D: "#3a5a7a", S: "#ffffff", g: "#e8f6ff" },
    sprite: [
      "I..I..I..I",
      "Ig.Ig.Ig.I".replace(/g/g, "I"),
      "IIIIIIIIII",
      "IIiIIiIIiI",
      "IIIDDIIDII",
      "IIIDDIIDII",
      "IIIIIIIIII",
      "iiiiiiiiii",
      "..........",
    ],
  },
  // ---- Volcano ----
  forge: {
    id: "forge",
    name: "Forge",
    biome: "volcano",
    w: 9,
    h: 8,
    baseIncome: 9,
    palette: { B: "#3a2424", b: "#1f1414", M: "#5a2a2a", F: "#ff6a00", D: "#2a1010" },
    sprite: [
      "...F.F...",
      "..MMMMM..",
      ".BBBBBBB.",
      "BBBDDDBBB",
      "BBBDFDBBB",
      "BBBDDDBBB",
      "BBBBBBBBB",
      "bbbbbbbbb",
    ],
  },
  obsidian: {
    id: "obsidian",
    name: "Obsidian Spire",
    biome: "volcano",
    w: 9,
    h: 10,
    baseIncome: 10,
    palette: { O: "#1a1a1a", o: "#0a0a0a", F: "#ff3a00", g: "#ffaa00" },
    sprite: [
      "....g....",
      "...OOO...",
      "..OOOOO..",
      ".OOFOOO..",
      "OOOFOOOO.",
      "OOOOOOOO.",
      "oOOOOOOo.",
      "ooOOOOoo.",
      ".ooOOoo..",
      "..oooo...",
    ],
  },
  // ---- Sky ----
  cloudhall: {
    id: "cloudhall",
    name: "Cloud Hall",
    biome: "sky",
    w: 10,
    h: 7,
    baseIncome: 13,
    palette: { C: "#ffffff", c: "#dfeeff", W: "#bfe0ff", g: "#ffe06a" },
    sprite: [
      "..g.....g.",
      ".CCWCCWCC.",
      "CCCWWWWCCC",
      "CCCCCCCCCC",
      "CcCCCCCCcC",
      "CCCCCCCCCC",
      ".cc.cccc.c",
    ],
  },
  balloon: {
    id: "balloon",
    name: "Sky Balloon",
    biome: "sky",
    w: 9,
    h: 9,
    baseIncome: 12,
    palette: { B: "#e84a4a", b: "#a82a2a", R: "#5a3a2a", W: "#e8d5a8", g: "#ffe06a" },
    sprite: [
      "...g.g...",
      "..BBBBB..",
      ".BBBBBBB.",
      "BBBbBbBBB",
      "BBBBBBBBB",
      ".bB.B.Bb.",
      "...RRR...",
      "..WWWWW..",
      "..WWWWW..",
    ],
  },
  // ---- Space ----
  rocket: {
    id: "rocket",
    name: "Rocket",
    biome: "space",
    w: 9,
    h: 11,
    baseIncome: 18,
    palette: { W: "#e8e8e8", w: "#9a9a9a", R: "#d93232", F: "#ff7a00", g: "#ffe06a", W2: "#3a6ad9" },
    sprite: [
      "....g....",
      "...WWW...",
      "..WWWWW..",
      ".WWWWWWW.",
      "WWWWWWWWW",
      "WWWwWwWWW",
      "WWWWWWWWW",
      "WWRWWWRWW",
      "WWWWWWWWW",
      ".F.F.F.F.",
      ".F.F.F.F.",
    ],
  },
  dome: {
    id: "dome",
    name: "Biodome",
    biome: "space",
    w: 10,
    h: 7,
    baseIncome: 16,
    palette: { G: "#5fd9a0", g: "#3aa070", W: "#dfeeff", S: "#3a6ad9", P: "#2f7d32" },
    sprite: [
      "..WWWWW..",
      ".WGGGGGW.",
      "WGGgGgGGW",
      "WGPGGGPGW",
      "WGGGGGGGW",
      "SSSSSSSSS",
      "SSSSSSSSS".padEnd(10, "S"),
    ],
  },
  // ---- Void ----
  crystaltower: {
    id: "crystaltower",
    name: "Crystal Tower",
    biome: "void",
    w: 9,
    h: 11,
    baseIncome: 24,
    palette: { C: "#c026d3", c: "#7a189a", g: "#f0abfc", P: "#e879f9", W: "#2a1a3a" },
    sprite: [
      "....g....",
      "...CgC...",
      "..CCPCC..",
      ".CCCPPCC.",
      "CCCPPPCCc",
      "CCCPPPCCc",
      "CCCPPPCCc",
      "CCCPPPCCc",
      "WCCCCCCCW",
      "WWWCWWCWW",
      "WWWWWWWWW",
    ],
  },
  riftgate: {
    id: "riftgate",
    name: "Rift Gate",
    biome: "void",
    w: 9,
    h: 9,
    baseIncome: 22,
    palette: { P: "#a855f7", p: "#7a189a", G: "#f0abfc", S: "#3a1a5a", g: "#ffffff" },
    sprite: [
      "....g....",
      "...PGP...",
      "..PGGGP..",
      ".PGGGGGP.",
      "PGGgggGGP",
      "PGGgggGGP",
      "PGGgggGGP",
      ".PGGGGGP.",
      "..SSSSS..",
    ],
  },
};

// ---------- Themes (palette swaps) ----------
export const THEMES: Record<ThemeId, { id: ThemeId; name: string; cost: number; tint: string }> = {
  classic: { id: "classic", name: "Classic", cost: 0, tint: "#7dd3fc" },
  dawn: { id: "dawn", name: "Dawn", cost: 15, tint: "#fb923c" },
  dusk: { id: "dusk", name: "Dusk", cost: 25, tint: "#f472b6" },
  midnight: { id: "midnight", name: "Midnight", cost: 40, tint: "#818cf8" },
  neon: { id: "neon", name: "Neon", cost: 80, tint: "#22d3ee" },
};

// ---------- Upgrades ----------
export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  hammer: {
    id: "hammer",
    name: "Hammer Power",
    desc: "Each tap builds more of the current structure.",
    icon: "🔨",
    baseCost: 20,
    costGrowth: 1.22,
    maxLevel: 250,
    category: "tap",
    effect: (l) => 1 + l * 0.6,
    effectLabel: (l) => `+${(1 + l * 0.6).toFixed(1)} build`,
  },
  coins: {
    id: "coins",
    name: "Coin Polish",
    desc: "Earn more coins from every tap and completion.",
    icon: "🪙",
    baseCost: 60,
    costGrowth: 1.25,
    maxLevel: 200,
    category: "tap",
    effect: (l) => 1 + l * 0.08,
    effectLabel: (l) => `×${(1 + l * 0.08).toFixed(2)}`,
  },
  combo: {
    id: "combo",
    name: "Builder's Rhythm",
    desc: "Combos last longer, so you can stack bigger multipliers.",
    icon: "🔗",
    baseCost: 120,
    costGrowth: 1.26,
    maxLevel: 60,
    category: "combo",
    effect: (l) => COMBO_WINDOW_MS + l * 80,
    effectLabel: (l) => `${((COMBO_WINDOW_MS + l * 80) / 1000).toFixed(1)}s`,
  },
  crit: {
    id: "crit",
    name: "Master Stroke",
    desc: "Chance to land a critical strike that builds 5× more.",
    icon: "🎯",
    baseCost: 100,
    costGrowth: 1.27,
    maxLevel: 70,
    category: "crit",
    effect: (l) => Math.min(0.6, CRIT_BASE + l * 0.008),
    effectLabel: (l) => `${(Math.min(0.6, CRIT_BASE + l * 0.008) * 100).toFixed(1)}%`,
  },
  critPower: {
    id: "critPower",
    name: "Critical Force",
    desc: "Critical strikes build even more.",
    icon: "💥",
    baseCost: 150,
    costGrowth: 1.26,
    maxLevel: 80,
    category: "crit",
    effect: (l) => 5 + l * 0.35,
    effectLabel: (l) => `×${(5 + l * 0.35).toFixed(1)}`,
  },
  autoBuilder: {
    id: "autoBuilder",
    name: "Auto Builder",
    desc: "An apprentice auto-builds the current structure.",
    icon: "🤖",
    baseCost: 250,
    costGrowth: 1.30,
    maxLevel: 150,
    category: "auto",
    effect: (l) => l * 0.35,
    effectLabel: (l) => `${(l * 0.35).toFixed(1)}/s`,
  },
  income: {
    id: "income",
    name: "Town Treasury",
    desc: "Completed buildings produce more coins.",
    icon: "🏛️",
    baseCost: 90,
    costGrowth: 1.25,
    maxLevel: 200,
    category: "income",
    effect: (l) => 1 + l * 0.07,
    effectLabel: (l) => `×${(1 + l * 0.07).toFixed(2)}`,
  },
};

export const UPGRADE_ORDER: UpgradeId[] = [
  "hammer",
  "coins",
  "income",
  "crit",
  "critPower",
  "combo",
  "autoBuilder",
];

// ---------- Achievements ----------
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "firstBuild", name: "Foundation", desc: "Complete your first building.", icon: "🏠", reward: 50, check: (s) => s.builtCount >= 1 },
  { id: "build10", name: "Hamlet", desc: "Complete 10 buildings.", icon: "🏘️", reward: 200, check: (s) => s.builtCount >= 10 },
  { id: "build50", name: "Village", desc: "Complete 50 buildings.", icon: "🏙️", reward: 1500, check: (s) => s.builtCount >= 50 },
  { id: "build100", name: "Town", desc: "Complete 100 buildings.", icon: "🌆", reward: 8000, check: (s) => s.builtCount >= 100 },
  { id: "build500", name: "Metropolis", desc: "Complete 500 buildings.", icon: "🌃", reward: 80000, check: (s) => s.builtCount >= 500 },
  { id: "build1000", name: "Empire", desc: "Complete 1000 buildings.", icon: "🏯", reward: 1_000_000, check: (s) => s.builtCount >= 1000 },
  { id: "combo30", name: "In The Zone", desc: "Reach a 30 combo.", icon: "⚡", reward: 600, check: (_, c) => c.currentCombo >= 30 },
  { id: "combo75", name: "Unstoppable", desc: "Reach a 75 combo.", icon: "🌟", reward: 4000, check: (_, c) => c.currentCombo >= 75 },
  { id: "firstAscend", name: "Reborn", desc: "Ascend for the first time.", icon: "♾️", reward: 2000, check: (s) => s.ascensionCount >= 1 },
  { id: "ascend3", name: "Eternal", desc: "Ascend 3 times.", icon: "🌌", reward: 50000, check: (s) => s.ascensionCount >= 3 },
  { id: "earn10k", name: "Pocket Change", desc: "Earn 10,000 lifetime coins.", icon: "💰", reward: 1000, check: (s) => s.totalCoinsEarned >= 10000 },
  { id: "earn1m", name: "Tycoon", desc: "Earn 1,000,000 lifetime coins.", icon: "💎", reward: 50000, check: (s) => s.totalCoinsEarned >= 1_000_000 },
  { id: "earn1b", name: "Realm Emperor", desc: "Earn 1,000,000,000 lifetime coins.", icon: "👑", reward: 5_000_000, check: (s) => s.totalCoinsEarned >= 1_000_000_000 },
  { id: "daily7", name: "Devoted", desc: "Reach a 7-day streak.", icon: "📅", reward: 10000, check: (s) => s.streak >= 7 },
  { id: "allBiomes", name: "Explorer", desc: "Complete 3 full biome cycles (24 buildings).", icon: "🗺️", reward: 3000, check: (s) => s.builtCount >= 24 },
  { id: "critMaster", name: "Critical Master", desc: "Own level 30+ Master Stroke.", icon: "🎯", reward: 25000, check: (s) => (s.upgrades.crit || 0) >= 30 },
];

// ---------- Default save ----------
export function defaultSave(): SaveState {
  return {
    coins: 0,
    relics: 0,
    builtCount: 0,
    activeProgress: 0,
    cumulativeIncome: 0,
    upgrades: {
      hammer: 0,
      coins: 0,
      combo: 0,
      crit: 0,
      critPower: 0,
      autoBuilder: 0,
      income: 0,
    },
    totalCoinsEarned: 0,
    runCoinsEarned: 0,
    totalTaps: 0,
    maxCombo: 0,
    ascensionCount: 0,
    ownedThemes: ["classic"],
    activeTheme: "classic",
    unlockedAchievements: [],
    lastClaimDay: null,
    streak: 0,
    playerName: null,
    lastSeen: Date.now(),
    surgeEndsAt: 0,
    createdAt: Date.now(),
    cameraX: 0,
    perm: {},
    maxBiomeReached: 0,
  };
}
