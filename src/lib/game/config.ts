// PRISM SMASH — game balance, upgrades, achievements, shop, skins
import type {
  UpgradeDef,
  UpgradeId,
  AchievementDef,
  ShopItemDef,
  SkinId,
  SaveState,
} from "./types";

// ---------- Balance constants ----------
export const COMBO_WINDOW_MS = 1100; // time to keep combo alive between taps
export const COMBO_MAX = 50; // combo cap (multiplier scales off this)
export const CRIT_BASE_CHANCE = 0.03; // base crit chance even without upgrades
export const CRYSTAL_BASE_HP = 12;
export const CRYSTAL_HP_GROWTH = 1.55; // hp multiplier per level
export const CRYSTAL_SHARD_BASE = 8; // shards dropped when a level-N crystal is fully smashed (per full crystal)
export const PRESTIGE_THRESHOLD = 50000; // run shards needed to prestige once
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000; // 8h offline earnings cap
export const SURGE_DURATION_MS = 60 * 1000; // 60s power surge
export const SURGE_MULT = 3; // 3x during surge
export const MAX_DAILY_STREAK = 7;

// ---------- Skins ----------
export interface SkinDef {
  id: SkinId;
  name: string;
  core: string; // center color
  glow: string; // outer glow color
  facet: string; // facet highlight
  cost: number; // prisms (0 = default free)
}

export const SKINS: Record<SkinId, SkinDef> = {
  default: { id: "default", name: "Aurora", core: "#7dd3fc", glow: "#38bdf8", facet: "#e0f2fe", cost: 0 },
  ember: { id: "ember", name: "Ember", core: "#fb923c", glow: "#f97316", facet: "#fed7aa", cost: 25 },
  toxic: { id: "toxic", name: "Toxic", core: "#a3e635", glow: "#84cc16", facet: "#ecfccb", cost: 40 },
  cosmic: { id: "cosmic", name: "Cosmic", core: "#c084fc", glow: "#a855f7", facet: "#f3e8ff", cost: 60 },
  rainbow: { id: "rainbow", name: "Prism", core: "rainbow", glow: "rainbow", facet: "#ffffff", cost: 120 },
};

// ---------- Upgrades ----------
export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  tapPower: {
    id: "tapPower",
    name: "Tap Power",
    desc: "Each tap deals more damage to the crystal.",
    icon: "⛏️",
    baseCost: 15,
    costGrowth: 1.18,
    maxLevel: 200,
    category: "tap",
    effect: (lvl) => 1 + lvl * 1.5, // base tap damage
    effectLabel: (lvl) => `+${(lvl * 1.5).toFixed(1)} dmg`,
  },
  shardValue: {
    id: "shardValue",
    name: "Shard Polish",
    desc: "Shards you earn are worth more.",
    icon: "💎",
    baseCost: 50,
    costGrowth: 1.22,
    maxLevel: 150,
    category: "value",
    effect: (lvl) => 1 + lvl * 0.15, // multiplier to all shard gains
    effectLabel: (lvl) => `×${(1 + lvl * 0.15).toFixed(2)}`,
  },
  critChance: {
    id: "critChance",
    name: "Critical Edge",
    desc: "Chance to land a critical smash (huge burst).",
    icon: "🎯",
    baseCost: 80,
    costGrowth: 1.25,
    maxLevel: 60,
    category: "crit",
    effect: (lvl) => Math.min(0.75, CRIT_BASE_CHANCE + lvl * 0.012),
    effectLabel: (lvl) => `${(Math.min(0.75, CRIT_BASE_CHANCE + lvl * 0.012) * 100).toFixed(1)}%`,
  },
  critPower: {
    id: "critPower",
    name: "Critical Power",
    desc: "Critical smashes deal more damage.",
    icon: "💥",
    baseCost: 120,
    costGrowth: 1.24,
    maxLevel: 80,
    category: "crit",
    effect: (lvl) => 5 + lvl * 0.6, // crit multiplier
    effectLabel: (lvl) => `×${(5 + lvl * 0.6).toFixed(1)}`,
  },
  comboDuration: {
    id: "comboDuration",
    name: "Combo Flow",
    desc: "Combos decay slower, letting you stack higher multipliers.",
    icon: "🔗",
    baseCost: 100,
    costGrowth: 1.23,
    maxLevel: 50,
    category: "combo",
    effect: (lvl) => COMBO_WINDOW_MS + lvl * 120,
    effectLabel: (lvl) => `${((COMBO_WINDOW_MS + lvl * 120) / 1000).toFixed(1)}s`,
  },
  autoTapper: {
    id: "autoTapper",
    name: "Auto Drill",
    desc: "A drill auto-taps the crystal for you.",
    icon: "🤖",
    baseCost: 200,
    costGrowth: 1.28,
    maxLevel: 120,
    category: "auto",
    effect: (lvl) => lvl * 0.8, // damage per auto tick
    effectLabel: (lvl) => `${(lvl * 0.8).toFixed(1)} dmg/tick`,
  },
  autoSpeed: {
    id: "autoSpeed",
    name: "Drill Speed",
    desc: "Auto Drill fires faster.",
    icon: "⚙️",
    baseCost: 350,
    costGrowth: 1.3,
    maxLevel: 40,
    category: "auto",
    effect: (lvl) => 1 + lvl * 0.15, // ticks per second multiplier
    effectLabel: (lvl) => `×${(1 + lvl * 0.15).toFixed(2)}`,
  },
};

export const UPGRADE_ORDER: UpgradeId[] = [
  "tapPower",
  "shardValue",
  "critChance",
  "critPower",
  "comboDuration",
  "autoTapper",
  "autoSpeed",
];

// ---------- Shop (Prisms = premium currency earned via prestige + rewarded ads) ----------
export const SHOP_ITEMS: ShopItemDef[] = [
  { id: "tapBoostPerm", name: "Tempered Edge", desc: "Permanent +50% tap power.", icon: "🗡️", cost: 30, oneTime: true },
  { id: "autoBoostPerm", name: "Overclocked Drill", desc: "Permanent +50% auto damage.", icon: "🔧", cost: 30, oneTime: true },
  { id: "startCombo", name: "Warm-Up Routine", desc: "Start every run with a 10x combo.", icon: "🔥", cost: 45, oneTime: true },
  { id: "prismPack", name: "Prism Cache", desc: "Instantly gain +5 Prisms.", icon: "📦", cost: 0, oneTime: false },
  { id: "megaPrismPack", name: "Prism Vault", desc: "Instantly gain +30 Prisms.", icon: "🏦", cost: 0, oneTime: false },
  { id: "skinEmber", name: "Ember Skin", desc: "Unlock the Ember crystal skin.", icon: "🟠", cost: 25, oneTime: true },
  { id: "skinToxic", name: "Toxic Skin", desc: "Unlock the Toxic crystal skin.", icon: "🟢", cost: 40, oneTime: true },
  { id: "skinCosmic", name: "Cosmic Skin", desc: "Unlock the Cosmic crystal skin.", icon: "🟣", cost: 60, oneTime: true },
  { id: "skinRainbow", name: "Prism Skin", desc: "Unlock the rainbow Prism skin.", icon: "🌈", cost: 120, oneTime: true },
];

// ---------- Achievements ----------
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "firstTap", name: "First Strike", desc: "Smash the crystal for the first time.", icon: "👆", reward: 50, check: (s) => s.totalTaps >= 1 },
  { id: "taps100", name: "Warming Up", desc: "Tap 100 times.", icon: "✋", reward: 150, check: (s) => s.totalTaps >= 100 },
  { id: "taps1000", name: "Tap Machine", desc: "Tap 1,000 times.", icon: "🖐️", reward: 1000, check: (s) => s.totalTaps >= 1000 },
  { id: "taps10000", name: "Carpal Tunnel", desc: "Tap 10,000 times.", icon: "🦾", reward: 10000, check: (s) => s.totalTaps >= 10000 },
  { id: "reachLevel5", name: "Getting Bigger", desc: "Reach crystal level 5.", icon: "🔺", reward: 500, check: (s) => s.crystalLevel >= 5 },
  { id: "reachLevel10", name: "Deep Core", desc: "Reach crystal level 10.", icon: "🔻", reward: 5000, check: (s) => s.crystalLevel >= 10 },
  { id: "reachLevel25", name: "Abyssal", desc: "Reach crystal level 25.", icon: "🏜️", reward: 100000, check: (s) => s.crystalLevel >= 25 },
  { id: "combo50", name: "Combo King", desc: "Reach a 50 combo.", icon: "⚡", reward: 800, check: (_, ctx) => ctx.currentCombo >= 50 },
  { id: "combo100", name: "Untouchable", desc: "Reach a 100 combo (with Warm-Up).", icon: "🌟", reward: 5000, check: (_, ctx) => ctx.currentCombo >= 100 },
  { id: "earn10k", name: "Pocket Change", desc: "Earn 10,000 lifetime shards.", icon: "🪙", reward: 1000, check: (s) => s.totalShardsEarned >= 10000 },
  { id: "earn1m", name: "Shard Tycoon", desc: "Earn 1,000,000 lifetime shards.", icon: "💰", reward: 50000, check: (s) => s.totalShardsEarned >= 1_000_000 },
  { id: "earn1b", name: "Crystal Empire", desc: "Earn 1,000,000,000 lifetime shards.", icon: "👑", reward: 5_000_000, check: (s) => s.totalShardsEarned >= 1_000_000_000 },
  { id: "firstPrestige", name: "Reborn", desc: "Reforge (prestige) for the first time.", icon: "♻️", reward: 2000, check: (s) => s.prestigeCount >= 1 },
  { id: "prestige5", name: "Eternal", desc: "Reforge 5 times.", icon: "♾️", reward: 50000, check: (s) => s.prestigeCount >= 5 },
  { id: "daily7", name: "Devoted", desc: "Reach a 7-day streak.", icon: "📅", reward: 10000, check: (s) => s.streak >= 7 },
  { id: "critMaster", name: "Critical Master", desc: "Own level 30+ Critical Edge.", icon: "🎯", reward: 25000, check: (s) => (s.upgrades.critChance || 0) >= 30 },
];

// ---------- Default save ----------
export function defaultSave(): SaveState {
  return {
    shards: 0,
    prisms: 0,
    crystalLevel: 1,
    crystalHp: CRYSTAL_BASE_HP,
    upgrades: {
      tapPower: 0,
      shardValue: 0,
      critChance: 0,
      critPower: 0,
      comboDuration: 0,
      autoTapper: 0,
      autoSpeed: 0,
    },
    totalShardsEarned: 0,
    runShardsEarned: 0,
    totalTaps: 0,
    maxCombo: 0,
    prestigeCount: 0,
    ownedSkins: ["default"],
    activeSkin: "default",
    unlockedAchievements: [],
    lastClaimDay: null,
    streak: 0,
    playerName: null,
    lastSeen: Date.now(),
    surgeEndsAt: 0,
    createdAt: Date.now(),
  };
}
