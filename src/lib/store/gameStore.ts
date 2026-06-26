"use client";
// PRISM SMASH — central game store (Zustand)
import { create } from "zustand";
import type {
  SaveState,
  UpgradeId,
  AchievementId,
  SkinId,
} from "@/lib/game/types";
import {
  UPGRADES,
  ACHIEVEMENTS,
  SKINS,
  SHOP_ITEMS,
  COMBO_WINDOW_MS,
  defaultSave,
} from "@/lib/game/config";
import {
  upgradeCost,
  crystalMaxHp,
  crystalKillShards,
  computeTap,
  autoDps,
  comboWindowMs,
  prestigePrismsGained,
  canPrestige,
  surgeActive,
  surgeEndsAtFromNow,
  surgeRemainingMs,
  offlineEarnings,
  prismMultiplier,
} from "@/lib/game/engine";
import {
  loadSave,
  persistSave,
  loadName,
  saveName,
  todayKey,
  isYesterday,
} from "@/lib/game/save";
import { getAudio } from "@/lib/game/audio";

// transient (non-persisted) UI/runtime state
interface RuntimeState {
  combo: number;
  lastTapAt: number;
  floatingNumbers: { id: number; x: number; y: number; value: number; crit: boolean; born: number; vy: number }[];
  particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string }[];
  crystalShake: number; // 0..1
  crystalScale: number; // pulse
  toasts: { id: number; title: string; desc?: string; icon?: string }[];
  showStart: boolean;
  showAd: null | "surge" | "offline" | "combo";
  pendingOffline: { shards: number; seconds: number } | null;
  tab: "upgrades" | "shop" | "prestige" | "leaderboard" | "achievements";
  muted: boolean;
  musicOn: boolean;
  leaderboard: { name: string; totalShards: string; prestige: number; maxLevel: number; you?: boolean }[];
  leaderboardLoading: boolean;
  submittedAt: number; // last time we submitted to leaderboard
}

interface GameStore extends SaveState, RuntimeState {
  // init
  init: () => void;
  // core actions
  tap: (x: number, y: number) => void;
  buyUpgrade: (id: UpgradeId) => void;
  reforge: () => void;
  activateSurge: () => void;
  watchAd: (kind: "surge" | "offline" | "combo") => void;
  finishAd: () => void;
  cancelAd: () => void;
  claimDaily: () => void;
  buyShopItem: (id: string) => void;
  setSkin: (id: SkinId) => void;
  setName: (name: string) => void;
  setTab: (t: RuntimeState["tab"]) => void;
  toggleMute: () => void;
  toggleMusic: () => void;
  dismissStart: () => void;
  hardReset: () => void;
  pushToast: (t: { title: string; desc?: string; icon?: string }) => void;
  dismissToast: (id: number) => void;
  spawnParticles: (x: number, y: number, color: string, count: number, power?: number) => void;
  tick: (now: number) => void;
  loadLeaderboard: () => Promise<void>;
  submitToLeaderboard: () => Promise<void>;
  // internal
  _checkAchievements: () => void;
  _save: () => void;
}

let floatId = 1;
let partId = 1;
let toastId = 1;

function decayCombo(combo: number, lastTapAt: number, window: number, now: number): number {
  if (now - lastTapAt > window) return 0;
  return combo;
}

export const useGame = create<GameStore>((set, get) => ({
  ...defaultSave(),
  // runtime
  combo: 0,
  lastTapAt: 0,
  floatingNumbers: [],
  particles: [],
  crystalShake: 0,
  crystalScale: 1,
  toasts: [],
  showStart: true,
  showAd: null,
  pendingOffline: null,
  tab: "upgrades",
  muted: false,
  musicOn: true,
  leaderboard: [],
  leaderboardLoading: false,
  submittedAt: 0,

  init: () => {
    const s = loadSave();
    const name = loadName();
    const now = Date.now();
    // offline earnings
    const off = offlineEarnings(s, now);
    const audio = getAudio();
    audio.setMuted(false);
    set({
      ...s,
      playerName: s.playerName || name,
      lastSeen: now,
      pendingOffline: off.shards > 0 ? off : null,
      showAd: off.shards > 0 ? "offline" : null,
      showStart: false,
    });
    // start music if enabled
    if (get().musicOn) {
      audio.init();
      audio.setMusicEnabled(true);
    }
  },

  tap: (x, y) => {
    const s = get();
    const now = Date.now();
    const window = comboWindowMs(s);
    const newCombo = now - s.lastTapAt <= window ? s.combo + 1 : 1;
    const res = computeTap(s, newCombo);
    const audio = getAudio();
    audio.init();
    audio.resume();
    audio.play(newCombo > 1 && newCombo % 5 === 0 ? "combo" : res.crit ? "crit" : "tap");

    // damage crystal
    let hp = s.crystalHp - res.damage;
    let level = s.crystalLevel;
    let shards = s.shards + res.shards;
    let totalEarned = s.totalShardsEarned + res.shards;
    let runEarned = s.runShardsEarned + res.shards;
    const floats = [...s.floatingNumbers];
    const parts = [...s.particles];

    // floating number
    floats.push({
      id: floatId++,
      x,
      y,
      value: res.shards,
      crit: res.crit,
      born: now,
      vy: -0.6 - Math.random() * 0.3,
    });

    // particles on tap
    const color = res.crit ? "#fbbf24" : SKINS[s.activeSkin].glow;
    for (let i = 0; i < (res.crit ? 14 : 6); i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = (res.crit ? 3 : 1.6) + Math.random() * 2;
      parts.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 1,
        life: 0,
        maxLife: 600 + Math.random() * 400,
        size: 2 + Math.random() * 3,
        color,
      });
    }

    // crystal leveled up?
    let leveledUp = false;
    while (hp <= 0) {
      const killShards = crystalKillShards(s, level, newCombo);
      shards += killShards;
      totalEarned += killShards;
      runEarned += killShards;
      level += 1;
      hp = crystalMaxHp(level) + hp; // carry over excess damage
      leveledUp = true;
      // big smash particles
      audio.play("smash");
    }

    if (leveledUp) {
      // explosion
      for (let i = 0; i < 40; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 2 + Math.random() * 5;
        parts.push({
          x,
          y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 2,
          life: 0,
          maxLife: 800 + Math.random() * 600,
          size: 3 + Math.random() * 4,
          color: ["#fbbf24", "#7dd3fc", "#a3e635", "#c084fc"][Math.floor(Math.random() * 4)],
        });
      }
    }

    set({
      combo: newCombo,
      lastTapAt: now,
      crystalHp: hp,
      crystalLevel: level,
      shards,
      totalShardsEarned: totalEarned,
      runShardsEarned: runEarned,
      totalTaps: s.totalTaps + 1,
      maxCombo: Math.max(s.maxCombo, newCombo),
      floatingNumbers: floats.slice(-30),
      particles: parts.slice(-400),
      crystalShake: Math.min(1, 0.3 + (res.crit ? 0.5 : 0.15)),
      crystalScale: res.crit ? 1.18 : 1.08,
    });

    get()._checkAchievements();
    get()._save();
    // periodic leaderboard submit
    if (now - get().submittedAt > 20000) {
      get().submitToLeaderboard();
    }
  },

  buyUpgrade: (id) => {
    const s = get();
    const lvl = s.upgrades[id];
    if (lvl >= UPGRADES[id].maxLevel) return;
    const cost = upgradeCost(id, lvl);
    if (s.shards < cost) {
      getAudio().play("error");
      get().pushToast({ title: "Not enough shards", icon: "❌" });
      return;
    }
    getAudio().init();
    getAudio().play("upgrade");
    set({
      shards: s.shards - cost,
      upgrades: { ...s.upgrades, [id]: lvl + 1 },
    });
    get()._save();
  },

  reforge: () => {
    const s = get();
    if (!canPrestige(s)) {
      getAudio().play("error");
      return;
    }
    const gained = prestigePrismsGained(s);
    getAudio().init();
    getAudio().play("prestige");
    const keep: SkinId[] = [...s.ownedSkins];
    const keepAch = [...s.unlockedAchievements];
    const base = defaultSave();
    set({
      ...base,
      playerName: s.playerName,
      prisms: s.prisms + gained,
      prestigeCount: s.prestigeCount + 1,
      ownedSkins: keep,
      activeSkin: s.activeSkin,
      unlockedAchievements: keepAch,
      streak: s.streak,
      lastClaimDay: s.lastClaimDay,
      lastSeen: Date.now(),
      createdAt: s.createdAt,
      surgeEndsAt: 0,
      // keep runtime UI state
      combo: 0,
      lastTapAt: 0,
      particles: [],
      floatingNumbers: [],
    });
    get().pushToast({ title: `Reforged! +${gained} Prisms`, desc: "Permanent power boosted.", icon: "♻️" });
    get()._checkAchievements();
    get()._save();
    get().submitToLeaderboard();
  },

  activateSurge: () => {
    set({ showAd: "surge" });
  },

  watchAd: (kind) => {
    set({ showAd: kind });
  },

  finishAd: () => {
    const s = get();
    const kind = s.showAd;
    set({ showAd: null });
    if (!kind) return;
    getAudio().init();
    getAudio().play("reward");
    if (kind === "surge") {
      set({ surgeEndsAt: surgeEndsAtFromNow() });
      getAudio().play("surge");
      get().pushToast({ title: "POWER SURGE!", desc: "3× everything for 60s.", icon: "⚡" });
    } else if (kind === "offline") {
      const off = s.pendingOffline;
      if (off && off.shards > 0) {
        const doubled = off.shards * 2;
        set({
          shards: get().shards + doubled,
          totalShardsEarned: get().totalShardsEarned + doubled,
          runShardsEarned: get().runShardsEarned + doubled,
          pendingOffline: null,
        });
        get().pushToast({ title: "Offline bonus doubled!", desc: `+${Math.floor(doubled)} shards`, icon: "📦" });
      }
    } else if (kind === "combo") {
      set({ combo: 25, lastTapAt: Date.now() });
      get().pushToast({ title: "Combo restored!", desc: "25× combo active.", icon: "🔥" });
    }
    get()._save();
  },

  cancelAd: () => {
    const s = get();
    // if offline ad cancelled, still grant base (not doubled)
    if (s.showAd === "offline" && s.pendingOffline && s.pendingOffline.shards > 0) {
      const base = s.pendingOffline.shards;
      set({
        shards: get().shards + base,
        totalShardsEarned: get().totalShardsEarned + base,
        runShardsEarned: get().runShardsEarned + base,
        pendingOffline: null,
      });
    }
    set({ showAd: null });
  },

  claimDaily: () => {
    const s = get();
    const today = todayKey();
    if (s.lastClaimDay === today) return;
    const newStreak = isYesterday(s.lastClaimDay) ? Math.min(s.streak + 1, 7) : 1;
    // reward scales with streak: 1..7 → 200,400,800,1500,3000,6000,12000
    const rewards = [200, 400, 800, 1500, 3000, 6000, 12000];
    const reward = rewards[newStreak - 1] * prismMultiplier(s);
    getAudio().init();
    getAudio().play("reward");
    set({
      streak: newStreak,
      lastClaimDay: today,
      shards: s.shards + reward,
      totalShardsEarned: s.totalShardsEarned + reward,
      runShardsEarned: s.runShardsEarned + reward,
    });
    get().pushToast({ title: `Day ${newStreak} streak!`, desc: `+${Math.floor(reward)} shards`, icon: "📅" });
    get()._checkAchievements();
    get()._save();
  },

  buyShopItem: (id) => {
    const s = get();
    const item = SHOP_ITEMS.find((i) => i.id === id);
    if (!item) return;
    if (item.oneTime) {
      // skins / perm boosts
      if (id === "skinEmber" || id === "skinToxic" || id === "skinCosmic" || id === "skinRainbow") {
        const skinMap: Record<string, SkinId> = {
          skinEmber: "ember",
          skinToxic: "toxic",
          skinCosmic: "cosmic",
          skinRainbow: "rainbow",
        };
        const skinId = skinMap[id];
        if (s.ownedSkins.includes(skinId)) return;
        if (s.prisms < item.cost) {
          getAudio().play("error");
          get().pushToast({ title: "Not enough Prisms", icon: "❌" });
          return;
        }
        getAudio().init();
        getAudio().play("upgrade");
        set({
          prisms: s.prisms - item.cost,
          ownedSkins: [...s.ownedSkins, skinId],
          activeSkin: skinId,
        });
        get().pushToast({ title: `${SKINS[skinId].name} skin unlocked!`, icon: "🎨" });
      } else {
        // perm boosts tracked via achievements list hack? use a separate flag.
        // We'll track perm boosts by storing in unlockedAchievements-like set.
        // Simpler: store as a pseudo upgrade level check. We'll add to a field.
        if ((s as any)[`perm_${id}`]) return;
        if (s.prisms < item.cost) {
          getAudio().play("error");
          get().pushToast({ title: "Not enough Prisms", icon: "❌" });
          return;
        }
        getAudio().init();
        getAudio().play("upgrade");
        set({
          prisms: s.prisms - item.cost,
          [`perm_${id}`]: true,
        } as any);
        get().pushToast({ title: `${item.name} purchased!`, desc: item.desc, icon: item.icon });
      }
    } else {
      // prism packs bought with shards? No—prism packs are obtained via rewarded ads only.
      // Not handled here; handled by watchAd.
    }
    get()._save();
  },

  setSkin: (id) => {
    const s = get();
    if (!s.ownedSkins.includes(id)) return;
    set({ activeSkin: id });
    get()._save();
  },

  setName: (name) => {
    const trimmed = name.trim().slice(0, 18) || "Player";
    saveName(trimmed);
    set({ playerName: trimmed });
    get().submitToLeaderboard();
    get()._save();
  },

  setTab: (t) => set({ tab: t }),

  toggleMute: () => {
    const m = !get().muted;
    const audio = getAudio();
    audio.init();
    audio.setMuted(m);
    set({ muted: m });
  },

  toggleMusic: () => {
    const on = !get().musicOn;
    const audio = getAudio();
    audio.init();
    audio.setMusicEnabled(on);
    set({ musicOn: on });
  },

  dismissStart: () => set({ showStart: false }),

  hardReset: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("prism-smash-save-v1");
    }
    const base = defaultSave();
    set({
      ...base,
      playerName: get().playerName,
      combo: 0,
      lastTapAt: 0,
      particles: [],
      floatingNumbers: [],
      showStart: false,
    });
    get().pushToast({ title: "Game reset", icon: "♻️" });
  },

  pushToast: (t) => {
    const id = toastId++;
    set({ toasts: [...get().toasts, { ...t, id }].slice(-4) });
    setTimeout(() => get().dismissToast(id), 4000);
  },

  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  spawnParticles: (x, y, color, count, power = 2) => {
    const parts = [...get().particles];
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = power * (0.5 + Math.random());
      parts.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 1,
        life: 0,
        maxLife: 500 + Math.random() * 400,
        size: 2 + Math.random() * 3,
        color,
      });
    }
    set({ particles: parts.slice(-400) });
  },

  tick: (now) => {
    const s = get();
    // decay combo
    const window = comboWindowMs(s);
    const combo = decayCombo(s.combo, s.lastTapAt, window, now);
    // auto-tapper
    let updates: Partial<GameStore> = {};
    if (combo !== s.combo) updates.combo = combo;
    // crystal shake/scale decay handled in canvas; here just reduce
    const shake = Math.max(0, s.crystalShake - 0.04);
    const scale = s.crystalScale + (1 - s.crystalScale) * 0.15;
    if (shake !== s.crystalShake) updates.crystalShake = shake;
    if (Math.abs(scale - s.crystalScale) > 0.001) updates.crystalScale = scale;

    // auto damage: applied per tick (called ~10/s). Use dt-based calc.
    const dps = autoDps(s);
    if (dps > 0) {
      // assume tick every 100ms → 0.1s
      const dt = 0.1;
      const dmg = dps * dt;
      const shardsGain = dmg * 0.25; // mirror tap shard rate
      let hp = s.crystalHp - dmg;
      let level = s.crystalLevel;
      let shards = s.shards + shardsGain;
      let totalEarned = s.totalShardsEarned + shardsGain;
      let runEarned = s.runShardsEarned + shardsGain;
      while (hp <= 0) {
        const killShards = crystalKillShards(s, level, combo);
        shards += killShards;
        totalEarned += killShards;
        runEarned += killShards;
        level += 1;
        hp = crystalMaxHp(level) + hp;
      }
      updates.crystalHp = hp;
      updates.crystalLevel = level;
      updates.shards = shards;
      updates.totalShardsEarned = totalEarned;
      updates.runShardsEarned = runEarned;
    }

    // particle aging
    const parts = s.particles
      .map((p) => ({ ...p, life: p.life + 100, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.12, vx: p.vx * 0.99 }))
      .filter((p) => p.life < p.maxLife);
    updates.particles = parts;

    // floating numbers aging
    const floats = s.floatingNumbers
      .map((f) => ({ ...f, y: f.y + f.vy, vy: f.vy * 0.98, born: f.born }))
      .filter((f) => now - f.born < 900);
    updates.floatingNumbers = floats;

    if (Object.keys(updates).length > 0) set(updates as any);

    // surge expiry toast
    if (s.surgeEndsAt > 0 && now > s.surgeEndsAt && now - s.surgeEndsAt < 200) {
      get().pushToast({ title: "Power Surge ended", icon: "⚡" });
    }
  },

  _checkAchievements: () => {
    const s = get();
    const ctx = { currentCombo: s.combo, currentLevel: s.crystalLevel };
    const newly: AchievementId[] = [];
    for (const a of ACHIEVEMENTS) {
      if (!s.unlockedAchievements.includes(a.id) && a.check(s, ctx)) {
        newly.push(a.id);
      }
    }
    if (newly.length === 0) return;
    const audio = getAudio();
    audio.init();
    for (const id of newly) {
      const def = ACHIEVEMENTS.find((a) => a.id === id)!;
      audio.play("achievement");
      get().pushToast({ title: `Achievement: ${def.name}`, desc: `${def.desc} (+${def.reward})`, icon: def.icon });
      set({
        unlockedAchievements: [...get().unlockedAchievements, id],
        shards: get().shards + def.reward,
        totalShardsEarned: get().totalShardsEarned + def.reward,
        runShardsEarned: get().runShardsEarned + def.reward,
      });
    }
    get()._save();
  },

  _save: () => {
    const s = get();
    const save: SaveState = {
      shards: s.shards,
      prisms: s.prisms,
      crystalLevel: s.crystalLevel,
      crystalHp: s.crystalHp,
      upgrades: s.upgrades,
      totalShardsEarned: s.totalShardsEarned,
      runShardsEarned: s.runShardsEarned,
      totalTaps: s.totalTaps,
      maxCombo: s.maxCombo,
      prestigeCount: s.prestigeCount,
      ownedSkins: s.ownedSkins,
      activeSkin: s.activeSkin,
      unlockedAchievements: s.unlockedAchievements,
      lastClaimDay: s.lastClaimDay,
      streak: s.streak,
      playerName: s.playerName,
      lastSeen: Date.now(),
      surgeEndsAt: s.surgeEndsAt,
      createdAt: s.createdAt,
    };
    persistSave(save);
  },

  loadLeaderboard: async () => {
    set({ leaderboardLoading: true });
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      const name = get().playerName;
      set({
        leaderboard: (data.entries || []).map((e: any) => ({
          name: e.playerName,
          totalShards: e.totalShards,
          prestige: e.prestige,
          maxLevel: e.maxLevel,
          you: name ? e.playerName === name : false,
        })),
        leaderboardLoading: false,
      });
    } catch {
      set({ leaderboardLoading: false });
    }
  },

  submitToLeaderboard: async () => {
    const s = get();
    if (!s.playerName) return;
    try {
      await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: s.playerName,
          totalShards: Math.floor(s.totalShardsEarned),
          prestige: s.prestigeCount,
          maxLevel: s.crystalLevel,
        }),
      });
      set({ submittedAt: Date.now() });
      // refresh leaderboard occasionally
      if (get().leaderboard.length === 0 || Math.random() < 0.3) {
        get().loadLeaderboard();
      }
    } catch {
      // ignore
    }
  },
}));
