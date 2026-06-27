// REALMFORGE — localStorage persistence
import type { SaveState } from "./types";
import { defaultSave } from "./config";

const SAVE_KEY = "realmforge-save-v7";
const NAME_KEY = "realmforge-name-v1";

export function loadSave(): SaveState {
  if (typeof window === "undefined") return defaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveState>;
    const base = defaultSave();
    const merged: SaveState = {
      ...base,
      ...parsed,
      upgrades: { ...base.upgrades, ...(parsed.upgrades || {}) },
      ownedThemes: parsed.ownedThemes && parsed.ownedThemes.length ? parsed.ownedThemes : base.ownedThemes,
      unlockedAchievements: parsed.unlockedAchievements || [],
      perm: parsed.perm || {},
    };
    if (!isFinite(merged.coins) || merged.coins < 0) merged.coins = 0;
    if (!isFinite(merged.relics) || merged.relics < 0) merged.relics = 0;
    if (!isFinite(merged.builtCount) || merged.builtCount < 0) merged.builtCount = 0;
    if (!isFinite(merged.activeProgress) || merged.activeProgress < 0) merged.activeProgress = 0;
    if (!isFinite(merged.cumulativeIncome) || merged.cumulativeIncome < 0) merged.cumulativeIncome = 0;
    return merged;
  } catch {
    return defaultSave();
  }
}

export function persistSave(s: SaveState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

export function clearSave() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SAVE_KEY);
}

export function loadName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NAME_KEY);
}

export function saveName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAME_KEY, name);
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isYesterday(dayKey: string | null, ref = new Date()): boolean {
  if (!dayKey) return false;
  const y = new Date(ref);
  y.setDate(ref.getDate() - 1);
  return todayKey(y) === dayKey;
}

// migrate old prism-smash/realmforge-v1 saves gracefully: just ignore them (fresh start)
export function clearOldSave() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("prism-smash-save-v1");
  localStorage.removeItem("realmforge-save-v1");
}
