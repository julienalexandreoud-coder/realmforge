// REALMFORGE — core type definitions (infinite pixel-art city builder)

export type BiomeId =
  | "plains"
  | "forest"
  | "desert"
  | "snow"
  | "volcano"
  | "sky"
  | "space"
  | "void";

export type UpgradeId =
  | "hammer" // build progress per tap
  | "coins" // coin gain multiplier
  | "combo" // combo window duration
  | "crit" // crit chance
  | "critPower" // crit multiplier
  | "autoBuilder" // auto build per sec
  | "income"; // building income multiplier

export type ThemeId =
  | "classic"
  | "dawn"
  | "dusk"
  | "midnight"
  | "neon";

export type AchievementId =
  | "firstBuild"
  | "build10"
  | "build50"
  | "build100"
  | "build500"
  | "build1000"
  | "combo30"
  | "combo75"
  | "firstAscend"
  | "ascend3"
  | "earn10k"
  | "earn1m"
  | "earn1b"
  | "daily7"
  | "allBiomes"
  | "critMaster";

export interface BuildingDef {
  id: string;
  name: string;
  biome: BiomeId;
  w: number; // sprite width in tiles
  h: number; // sprite height in tiles
  sprite: string[]; // rows of palette keys, '.' = transparent
  palette: Record<string, string>; // key -> hex color
  baseIncome: number; // coins/sec when complete (before scaling)
}

export interface BiomeDef {
  id: BiomeId;
  name: string;
  sky: string[]; // gradient stops (top to bottom)
  ground: string; // ground fill
  groundDark: string; // ground shadow line
  accent: string; // biome accent (HUD/borders)
  decoration: string[]; // pixel decoration sprite (trees, cacti...) — drawn between buildings
  decPalette: Record<string, string>;
  buildings: string[]; // building ids available
}

export interface SaveState {
  coins: number;
  relics: number;
  builtCount: number; // total completed buildings (infinite counter)
  activeProgress: number; // 0..1 progress of current build
  cumulativeIncome: number; // total coins/sec from all completed buildings
  upgrades: Record<UpgradeId, number>;
  totalCoinsEarned: number; // lifetime (leaderboard)
  runCoinsEarned: number; // this ascension (relic calc)
  totalTaps: number;
  maxCombo: number;
  ascensionCount: number;
  ownedThemes: ThemeId[];
  activeTheme: ThemeId;
  unlockedAchievements: AchievementId[];
  lastClaimDay: string | null;
  streak: number;
  playerName: string | null;
  lastSeen: number;
  surgeEndsAt: number;
  createdAt: number;
  cameraX: number; // world camera offset
  perm: Record<string, boolean>; // permanent boost flags
  maxBiomeReached: number; // highest biome index reached
}

export interface FloatingNumber {
  id: number;
  x: number;
  y: number;
  value: number;
  crit: boolean;
  born: number;
  vy: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface AchievementDef {
  id: AchievementId;
  name: string;
  desc: string;
  icon: string;
  reward: number;
  check: (s: SaveState, ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  currentCombo: number;
  biomesReached: number;
}

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  desc: string;
  icon: string;
  baseCost: number;
  costGrowth: number;
  maxLevel: number;
  effect: (level: number) => number;
  effectLabel: (level: number) => string;
  category: "tap" | "auto" | "crit" | "combo" | "income";
}
