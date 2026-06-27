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
    buildings: ["plainsA", "plainsB"],
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
    buildings: ["forestA", "forestB"],
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
    buildings: ["desertA", "desertB"],
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
    buildings: ["snowA", "snowB"],
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
    buildings: ["volcanoA", "volcanoB"],
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
    buildings: ["skyA", "skyB"],
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
    buildings: ["spaceA", "spaceB"],
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
    buildings: ["voidA", "voidB"],
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

// ---------- Buildings: procedurally-generated tall city towers with lit windows ----------
// Each tower = roof + N floors (window row + wall band) + base/door. Wall-to-wall when
// rendered (12 cells wide @ 5px = 60px in a 64px plot) → reads as a continuous city skyline.
type Roof = "flat" | "spire" | "pyramid" | "antenna" | "dome";
interface TowerSpec {
  id: string;
  name: string;
  biome: BiomeId;
  baseIncome: number;
  floors: number;
  roof: Roof;
  width?: number;
  wall: string; // W
  wallDark: string; // w (edges)
  win: string; // L (lit window — glow accent)
  winOff: string; // l (unlit window)
  roofC: string; // R
  door: string; // D
}

function buildTower(s: TowerSpec): BuildingDef {
  const W = s.width ?? 12;
  const mid = Math.floor(W / 2);
  const rows: string[] = [];
  const pad = (n: number) => ".".repeat(Math.max(0, n));

  // ---- roof section ----
  if (s.roof === "spire") {
    for (let i = 0; i < 4; i++) rows.push(pad(i) + "R".repeat(W - i * 2) + pad(i));
  } else if (s.roof === "pyramid") {
    for (let i = 0; i < 3; i++) rows.push(pad(i * 2) + "R".repeat(Math.max(1, W - i * 4)) + pad(i * 2));
  } else if (s.roof === "antenna") {
    rows.push(pad(mid) + "R" + pad(W - mid - 1));
    rows.push(pad(mid) + "R" + pad(W - mid - 1));
    rows.push(pad(mid - 1) + "RRR" + pad(W - mid - 2));
  } else if (s.roof === "dome") {
    rows.push(pad(2) + "R".repeat(W - 4) + pad(2));
    rows.push(pad(1) + "R".repeat(W - 2) + pad(1));
  } else {
    rows.push("R".repeat(W));
  }

  // ---- floors: window row + wall band (2 rows per floor) ----
  const winCols = [2, 3, 5, 6, 8, 9];
  for (let f = 0; f < s.floors; f++) {
    // window row
    let row = "";
    for (let c = 0; c < W; c++) {
      if (c === 0 || c === W - 1) row += "w";
      else if (winCols.includes(c)) row += (f * 5 + c * 3) % 7 < 3 ? "L" : "l";
      else row += "W";
    }
    rows.push(row);
    // wall band (floor separator)
    let band = "";
    for (let c = 0; c < W; c++) band += (c === 0 || c === W - 1) ? "w" : "W";
    rows.push(band);
  }

  // ---- base with door ----
  let base = "";
  for (let c = 0; c < W; c++) {
    if (c >= mid - 1 && c <= mid + 1) base += "D";
    else if (c === 0 || c === W - 1) base += "w";
    else base += "W";
  }
  rows.push(base);

  return {
    id: s.id,
    name: s.name,
    biome: s.biome,
    w: W,
    h: rows.length,
    baseIncome: s.baseIncome,
    palette: { W: s.wall, w: s.wallDark, L: s.win, l: s.winOff, R: s.roofC, D: s.door },
    sprite: rows,
  };
}

// Tower specs — dark navy walls + glowing windows per biome. Heights vary for a jagged skyline.
const TOWER_SPECS: TowerSpec[] = [
  // Dusk Plains — amber-lit slate towers
  { id: "plainsA", name: "Amber Keep", biome: "plains", baseIncome: 2, floors: 6, roof: "flat", wall: "#2a3550", wallDark: "#1a2440", win: "#fbbf24", winOff: "#3a3520", roofC: "#4a5570", door: "#0e1424" },
  { id: "plainsB", name: "Lantern Spire", biome: "plains", baseIncome: 2.4, floors: 8, roof: "antenna", wall: "#243049", wallDark: "#161f38", win: "#fbbf24", winOff: "#322e1c", roofC: "#3e4866", door: "#0c1220" },
  // Shadow Wood — emerald-lit forest towers
  { id: "forestA", name: "Moss Tower", biome: "forest", baseIncome: 4, floors: 5, roof: "spire", wall: "#1a2a22", wallDark: "#0f1a14", win: "#34d399", winOff: "#1f3a2a", roofC: "#2a4a36", door: "#0a1410" },
  { id: "forestB", name: "Verdant Block", biome: "forest", baseIncome: 4.5, floors: 7, roof: "flat", wall: "#162620", wallDark: "#0c1812", win: "#34d399", winOff: "#1b3527", roofC: "#24402f", door: "#08120c" },
  // Amber Wastes — golden-lit sandstone towers
  { id: "desertA", name: "Sun Pagoda", biome: "desert", baseIncome: 5, floors: 6, roof: "dome", wall: "#3a2a18", wallDark: "#241a0c", win: "#fbbf24", winOff: "#3a2a10", roofC: "#5a3a1a", door: "#1a1008" },
  { id: "desertB", name: "Dune Hall", biome: "desert", baseIncome: 5.5, floors: 8, roof: "flat", wall: "#322614", wallDark: "#1f1608", win: "#fbbf24", winOff: "#35280f", roofC: "#4e3416", door: "#160d06" },
  // Frost Reach — cyan-lit ice towers
  { id: "snowA", name: "Glacier Tower", biome: "snow", baseIncome: 6, floors: 7, roof: "spire", wall: "#1a2a3a", wallDark: "#101a24", win: "#67e8f9", winOff: "#2a3a44", roofC: "#2a4a5a", door: "#0a1018" },
  { id: "snowB", name: "Frost Block", biome: "snow", baseIncome: 6.5, floors: 5, roof: "flat", wall: "#162634", wallDark: "#0c161e", win: "#67e8f9", winOff: "#263640", roofC: "#224050", door: "#080c12" },
  // Emberlands — orange-lit volcanic towers
  { id: "volcanoA", name: "Ember Forge", biome: "volcano", baseIncome: 9, floors: 6, roof: "pyramid", wall: "#2a1414", wallDark: "#1a0a0a", win: "#fb923c", winOff: "#3a1a08", roofC: "#4a1a1a", door: "#0a0404" },
  { id: "volcanoB", name: "Cinder Block", biome: "volcano", baseIncome: 10, floors: 8, roof: "flat", wall: "#241010", wallDark: "#160808", win: "#fb923c", winOff: "#341608", roofC: "#3e1616", door: "#080202" },
  // Sky Reach — white-lit cloud towers
  { id: "skyA", name: "Cloud Spire", biome: "sky", baseIncome: 13, floors: 7, roof: "antenna", wall: "#1a2c48", wallDark: "#101c34", win: "#e0f2fe", winOff: "#2a3a50", roofC: "#3868a8", door: "#0a1424" },
  { id: "skyB", name: "Sky Rise", biome: "sky", baseIncome: 14, floors: 9, roof: "flat", wall: "#162842", wallDark: "#0c1828", win: "#e0f2fe", winOff: "#263648", roofC: "#305e98", door: "#08101e" },
  // Star Void — magenta-lit void towers
  { id: "spaceA", name: "Nebula Tower", biome: "space", baseIncome: 18, floors: 8, roof: "antenna", wall: "#14142a", wallDark: "#08081a", win: "#c084fc", winOff: "#2a2a44", roofC: "#3a3a6a", door: "#050514" },
  { id: "spaceB", name: "Cosmo Dome", biome: "space", baseIncome: 16, floors: 6, roof: "dome", wall: "#101024", wallDark: "#060614", win: "#c084fc", winOff: "#24243e", roofC: "#32325e", door: "#040410" },
  // Crystal Rift — bright magenta-lit crystal towers
  { id: "voidA", name: "Rift Spire", biome: "void", baseIncome: 24, floors: 9, roof: "spire", wall: "#1a1030", wallDark: "#10081f", win: "#e879f9", winOff: "#2a1a3a", roofC: "#4a2a6a", door: "#0a0518" },
  { id: "voidB", name: "Void Gate", biome: "void", baseIncome: 22, floors: 7, roof: "pyramid", wall: "#160c2a", wallDark: "#0c0618", win: "#e879f9", winOff: "#261634", roofC: "#3e2460", door: "#080414" },
];

export const BUILDINGS: Record<string, BuildingDef> = Object.fromEntries(
  TOWER_SPECS.map((s) => [s.id, buildTower(s)])
);

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
    desc: "An apprentice auto-builds the current structure (% per second).",
    icon: "🤖",
    baseCost: 300,
    costGrowth: 1.35,
    maxLevel: 100,
    category: "auto",
    effect: (l) => l * 0.008,
    effectLabel: (l) => `${(l * 0.008 * 100).toFixed(1)}%/s`,
  },
  income: {
    id: "income",
    name: "Town Treasury",
    desc: "Completing buildings awards more bonus coins.",
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
