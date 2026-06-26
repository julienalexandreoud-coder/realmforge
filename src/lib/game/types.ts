// PRISM SMASH — core type definitions

export type UpgradeId =
  | "tapPower"
  | "autoTapper"
  | "critChance"
  | "critPower"
  | "comboDuration"
  | "shardValue"
  | "autoSpeed";

export type ShopItemId =
  | "prismPack"
  | "megaPrismPack"
  | "tapBoostPerm"
  | "autoBoostPerm"
  | "startCombo"
  | "skinDefault"
  | "skinEmber"
  | "skinToxic"
  | "skinCosmic"
  | "skinRainbow";

export type AchievementId =
  | "firstTap"
  | "taps100"
  | "taps1000"
  | "taps10000"
  | "reachLevel5"
  | "reachLevel10"
  | "reachLevel25"
  | "firstPrestige"
  | "prestige5"
  | "combo50"
  | "combo100"
  | "earn10k"
  | "earn1m"
  | "earn1b"
  | "daily7"
  | "critMaster";

export type SkinId =
  | "default"
  | "ember"
  | "toxic"
  | "cosmic"
  | "rainbow";

export interface SaveState {
  shards: number;
  prisms: number;
  crystalLevel: number;
  crystalHp: number;
  upgrades: Record<UpgradeId, number>;
  totalShardsEarned: number;
  runShardsEarned: number;
  totalTaps: number;
  maxCombo: number;
  prestigeCount: number;
  ownedSkins: SkinId[];
  activeSkin: SkinId;
  unlockedAchievements: AchievementId[];
  lastClaimDay: string | null;
  streak: number;
  playerName: string | null;
  lastSeen: number;
  surgeEndsAt: number;
  createdAt: number;
}

export interface AchievementContext {
  currentCombo: number;
  currentLevel: number;
}

export interface AchievementDef {
  id: AchievementId;
  name: string;
  desc: string;
  icon: string;
  reward: number;
  check: (s: SaveState, ctx: AchievementContext) => boolean;
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
  category: "tap" | "auto" | "crit" | "combo" | "value";
}

export interface ShopItemDef {
  id: ShopItemId;
  name: string;
  desc: string;
  icon: string;
  cost: number;
  oneTime: boolean;
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
