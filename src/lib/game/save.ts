// PRISM SMASH — localStorage persistence
import type { SaveState } from "./types";
import { defaultSave } from "./config";

const SAVE_KEY = "prism-smash-save-v1";
const NAME_KEY = "prism-smash-name-v1";

export function loadSave(): SaveState {
  if (typeof window === "undefined") return defaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveState>;
    const base = defaultSave();
    // merge to be resilient to schema additions
    const merged: SaveState = {
      ...base,
      ...parsed,
      upgrades: { ...base.upgrades, ...(parsed.upgrades || {}) },
      ownedSkins: parsed.ownedSkins && parsed.ownedSkins.length ? parsed.ownedSkins : base.ownedSkins,
      unlockedAchievements: parsed.unlockedAchievements || [],
    };
    // sanity clamp
    if (!isFinite(merged.shards) || merged.shards < 0) merged.shards = 0;
    if (!isFinite(merged.prisms) || merged.prisms < 0) merged.prisms = 0;
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
    // storage full or unavailable — ignore
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
