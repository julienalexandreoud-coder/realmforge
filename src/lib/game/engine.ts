// REALMFORGE — pure engine calculations (infinite pixel city builder)
import type { UpgradeId, SaveState, BiomeId } from "./types";
import { UPGRADES, buildingForPlot, buildingIncomeAt, buildingCompleteBonusAt, BIOMES as BS, ASCENSION_THRESHOLD, OFFLINE_CAP_MS } from "./config";

// ---------- Number formatting ----------
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

// ---------- Tap / build ----------
export function surgeActive(s: SaveState, now = Date.now()): boolean {
  return s.surgeEndsAt > now;
}
export function surgeRemainingMs(s: SaveState, now = Date.now()): number {
  return Math.max(0, s.surgeEndsAt - now);
}
export function surgeEndsAtFromNow(now = Date.now()): number {
  return now + 60_000;
}

export function relicMultiplier(s: SaveState): number {
  return 1 + s.relics * 0.05; // each relic +5% global
}

export function hammerPower(s: SaveState): number {
  const base = UPGRADES.hammer.effect(s.upgrades.hammer);
  const permBoost = s.perm.tapBoostPerm ? 1.5 : 1;
  return base * permBoost;
}

export function critChance(s: SaveState): number {
  return UPGRADES.crit.effect(s.upgrades.crit);
}
export function critPower(s: SaveState): number {
  return UPGRADES.critPower.effect(s.upgrades.critPower);
}
export function coinMult(s: SaveState): number {
  return UPGRADES.coins.effect(s.upgrades.coins);
}
export function incomeMult(s: SaveState): number {
  const base = UPGRADES.income.effect(s.upgrades.income);
  const permBoost = s.perm.incomeBoostPerm ? 1.5 : 1;
  return base * permBoost;
}
export function autoBuildRate(s: SaveState): number {
  const base = UPGRADES.autoBuilder.effect(s.upgrades.autoBuilder);
  return base * relicMultiplier(s) * (s.perm.autoBoostPerm ? 1.5 : 1);
}
export function comboWindowMs(s: SaveState): number {
  return UPGRADES.combo.effect(s.upgrades.combo);
}
export function comboMultiplier(combo: number): number {
  const c = Math.min(combo, 75);
  return 1 + c * 0.08; // up to 7x at combo 75
}

// coins earned per tap (immediate feedback)
export function tapCoins(s: SaveState, combo: number, crit: boolean): number {
  const base = 1 + s.builtCount * 0.5; // scales with city size
  const cMult = comboMultiplier(combo);
  const critM = crit ? critPower(s) : 1;
  const surgeM = surgeActive(s) ? 3 : 1;
  return base * cMult * critM * surgeM * coinMult(s) * relicMultiplier(s);
}

// build progress added per tap (0..1 fraction)
export function tapBuild(s: SaveState, combo: number, crit: boolean): number {
  // progress = hammerPower / buildingCost, where buildingCost scales with index
  const cost = buildingProgressCost(s.builtCount);
  const cMult = comboMultiplier(combo);
  const critM = crit ? critPower(s) : 1;
  const surgeM = surgeActive(s) ? 3 : 1;
  const dmg = hammerPower(s) * cMult * critM * surgeM * relicMultiplier(s);
  return dmg / cost;
}

// "cost" in build-units to complete a building at given index
export function buildingProgressCost(index: number): number {
  return 10 * Math.pow(1.16, index);
}

// coins earned when a building completes
export function completeBonus(s: SaveState, index: number, combo: number): number {
  const base = buildingCompleteBonusAt(index);
  return base * coinMult(s) * comboMultiplier(combo) * (surgeActive(s) ? 3 : 1) * relicMultiplier(s);
}

// income added when building at index completes
export function buildingIncome(s: SaveState, index: number): number {
  const def = buildingForPlot(index);
  return def.baseIncome * buildingIncomeAt(index) / 2 * incomeMult(s) * relicMultiplier(s);
}

// total income per second right now
export function totalIncome(s: SaveState): number {
  return s.cumulativeIncome * (surgeActive(s) ? 3 : 1);
}

// ---------- Ascension (prestige) ----------
export function ascensionRelicsGained(s: SaveState): number {
  if (s.runCoinsEarned < ASCENSION_THRESHOLD) return 0;
  return Math.floor(Math.sqrt(s.runCoinsEarned / ASCENSION_THRESHOLD));
}
export function canAscend(s: SaveState): boolean {
  return ascensionRelicsGained(s) > 0;
}
export function nextRelicProgress(s: SaveState): { current: number; needed: number; pct: number } {
  const gained = ascensionRelicsGained(s);
  const target = gained + 1;
  const needed = target * target * ASCENSION_THRESHOLD;
  const prev = gained * gained * ASCENSION_THRESHOLD;
  const current = s.runCoinsEarned - prev;
  const span = needed - prev;
  return { current, needed: span, pct: Math.min(1, current / span) };
}

// ---------- Offline earnings ----------
export function offlineEarnings(s: SaveState, now = Date.now()): { coins: number; seconds: number } {
  const elapsed = Math.min(now - s.lastSeen, OFFLINE_CAP_MS);
  if (elapsed <= 0 || s.cumulativeIncome <= 0) return { coins: 0, seconds: 0 };
  const seconds = elapsed / 1000;
  const earned = totalIncome(s) * seconds * 0.5; // 50% efficiency offline
  return { coins: earned, seconds };
}

// ---------- Biome helpers ----------
export function biomeIndexOf(index: number): number {
  return index % BS.length;
}
export function biomeIdFor(index: number): BiomeId {
  return BS[index % BS.length].id;
}
