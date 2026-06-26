// PRISM SMASH — pure engine calculations (no side effects)
import type { UpgradeId, SaveState } from "./types";
import {
  UPGRADES,
  CRYSTAL_BASE_HP,
  CRYSTAL_HP_GROWTH,
  CRYSTAL_SHARD_BASE,
  PRESTIGE_THRESHOLD,
  COMBO_MAX,
  SURGE_MULT,
  SURGE_DURATION_MS,
} from "./config";

// ---------- Formatting ----------
export function formatNumber(n: number): string {
  if (n < 1000) return Math.floor(n).toString();
  const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  const tier = Math.floor(Math.log10(n) / 3);
  if (tier >= units.length) return n.toExponential(2);
  const scaled = n / Math.pow(1000, tier);
  return `${scaled.toFixed(scaled < 10 ? 2 : scaled < 100 ? 1 : 0)}${units[tier]}`;
}

// ---------- Upgrade costs ----------
export function upgradeCost(id: UpgradeId, level: number): number {
  const def = UPGRADES[id];
  return Math.ceil(def.baseCost * Math.pow(def.costGrowth, level));
}

export function canAffordUpgrade(s: SaveState, id: UpgradeId): boolean {
  const lvl = s.upgrades[id];
  if (lvl >= UPGRADES[id].maxLevel) return false;
  return s.shards >= upgradeCost(id, lvl);
}

// ---------- Crystal ----------
export function crystalMaxHp(level: number): number {
  return Math.ceil(CRYSTAL_BASE_HP * Math.pow(CRYSTAL_HP_GROWTH, level - 1));
}

// Shards earned when a crystal of `level` is fully smashed (base, before multipliers)
export function crystalShardReward(level: number): number {
  return CRYSTAL_SHARD_BASE * level * Math.pow(1.4, level - 1);
}

// ---------- Damage & earnings ----------
export interface TapResult {
  damage: number;
  shards: number;
  crit: boolean;
  comboMult: number;
  surgeActive: boolean;
}

export function surgeActive(s: SaveState, now = Date.now()): boolean {
  return s.surgeEndsAt > now;
}

export function surgeRemainingMs(s: SaveState, now = Date.now()): number {
  return Math.max(0, s.surgeEndsAt - now);
}

// global multiplier from prestige prisms (each prism = +2% globally)
export function prismMultiplier(s: SaveState): number {
  return 1 + s.prisms * 0.02;
}

export function tapPower(s: SaveState): number {
  const base = UPGRADES.tapPower.effect(s.upgrades.tapPower);
  const permBoost = s.unlockedAchievements.length ? 1 : 1; // placeholder
  return base * permBoost;
}

export function critChance(s: SaveState): number {
  return UPGRADES.critChance.effect(s.upgrades.critChance);
}

export function critPower(s: SaveState): number {
  return UPGRADES.critPower.effect(s.upgrades.critPower);
}

export function shardValueMult(s: SaveState): number {
  return UPGRADES.shardValue.effect(s.upgrades.shardValue);
}

export function autoDamage(s: SaveState): number {
  return UPGRADES.autoTapper.effect(s.upgrades.autoTapper);
}

export function autoSpeedMult(s: SaveState): number {
  return UPGRADES.autoSpeed.effect(s.upgrades.autoSpeed);
}

export function comboWindowMs(s: SaveState): number {
  return UPGRADES.comboDuration.effect(s.upgrades.comboDuration);
}

// combo multiplier: 1 + combo*0.1, capped at COMBO_MAX
export function comboMultiplier(combo: number): number {
  const c = Math.min(combo, COMBO_MAX);
  return 1 + c * 0.1; // up to 6x at combo 50
}

// Compute a single tap's damage + shards awarded (shards only on over-damage / kills)
export function computeTap(s: SaveState, combo: number, rng = Math.random): TapResult {
  const baseDmg = tapPower(s);
  const crit = rng() < critChance(s);
  const dmg = baseDmg * (crit ? critPower(s) : 1);
  const cMult = comboMultiplier(combo);
  const surge = surgeActive(s);
  const surgeM = surge ? SURGE_MULT : 1;
  const totalDamage = dmg * cMult * surgeM * prismMultiplier(s);
  // shards earned per tap = a fraction of damage dealt, scaled by shard value
  const shards = totalDamage * 0.25 * shardValueMult(s);
  return {
    damage: totalDamage,
    shards,
    crit,
    comboMult: cMult,
    surgeActive: surge,
  };
}

// Shards awarded for smashing a whole crystal of `level`
export function crystalKillShards(s: SaveState, level: number, combo: number): number {
  const base = crystalShardReward(level);
  const surge = surgeActive(s) ? SURGE_MULT : 1;
  return base * shardValueMult(s) * comboMultiplier(combo) * surge * prismMultiplier(s);
}

// Auto-tap damage per second
export function autoDps(s: SaveState): number {
  return autoDamage(s) * autoSpeedMult(s) * prismMultiplier(s);
}

// ---------- Prestige ----------
export function prestigePrismsGained(s: SaveState): number {
  // prisms = floor(sqrt(runShardsEarned / threshold))
  if (s.runShardsEarned < PRESTIGE_THRESHOLD) return 0;
  return Math.floor(Math.sqrt(s.runShardsEarned / PRESTIGE_THRESHOLD));
}

export function canPrestige(s: SaveState): boolean {
  return prestigePrismsGained(s) > 0;
}

export function nextPrismProgress(s: SaveState): { current: number; needed: number; pct: number } {
  const gained = prestigePrismsGained(s);
  // find the runShards needed for gained+1 prisms
  const target = gained + 1;
  const needed = target * target * PRESTIGE_THRESHOLD;
  const prev = gained * gained * PRESTIGE_THRESHOLD;
  const current = s.runShardsEarned - prev;
  const span = needed - prev;
  return { current, needed: span, pct: Math.min(1, current / span) };
}

// ---------- Offline earnings ----------
export function offlineEarnings(s: SaveState, now = Date.now()): { shards: number; seconds: number } {
  const elapsed = Math.min(now - s.lastSeen, 8 * 60 * 60 * 1000);
  if (elapsed <= 0 || autoDamage(s) <= 0) return { shards: 0, seconds: 0 };
  const seconds = elapsed / 1000;
  // auto earns at 40% efficiency while offline
  const earned = autoDps(s) * seconds * 0.4;
  return { shards: earned, seconds };
}

// ---------- Rewarded ad helpers ----------
export function surgeEndsAtFromNow(now = Date.now()): number {
  return now + SURGE_DURATION_MS;
}
