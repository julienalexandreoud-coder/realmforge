"use client";
// REALMFORGE — central game store (Zustand) — infinite pixel city builder
import { create } from "zustand";
import type { SaveState, UpgradeId, AchievementId, ThemeId } from "@/lib/game/types";
import {
  UPGRADES,
  ACHIEVEMENTS,
  THEMES,
  UPGRADE_ORDER,
  BIOMES,
  buildingForPlot,
  buildingIncomeAt,
  defaultSave,
} from "@/lib/game/config";
import {
  upgradeCost,
  tapCoins,
  tapBuild,
  completeBonus,
  buildingIncome,
  totalIncome,
  autoBuildRate,
  comboWindowMs,
  comboMultiplier,
  critChance,
  surgeActive,
  surgeEndsAtFromNow,
  surgeRemainingMs,
  ascensionRelicsGained,
  canAscend,
  offlineEarnings,
  relicMultiplier,
} from "@/lib/game/engine";
import { loadSave, persistSave, loadName, saveName, todayKey, isYesterday, clearOldSave } from "@/lib/game/save";
import { getAudio } from "@/lib/game/audio";

interface RuntimeState {
  combo: number;
  lastTapAt: number;
  floatingNumbers: { id: number; x: number; y: number; value: number; crit: boolean; born: number; vy: number }[];
  particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string }[];
  // clickable floating bonuses (coins/gems/stars) that appear on screen
  bonuses: { id: number; x: number; y: number; vx: number; vy: number; type: "coin" | "gem" | "star"; value: number; born: number; expiresAt: number }[];
  nextBonusAt: number;
  shake: number;
  buildPulse: number; // 0..1 visual pulse on build
  hammerAnim: number; // 0..1 hammer swing
  toasts: { id: number; title: string; desc?: string; icon?: string }[];
  showAd: null | "surge" | "offline" | "combo";
  pendingOffline: { coins: number; seconds: number } | null;
  tab: "upgrades" | "shop" | "ascend" | "leaderboard" | "achievements";
  muted: boolean;
  musicOn: boolean;
  leaderboard: { name: string; totalCoins: string; ascension: number; built: number; you?: boolean }[];
  leaderboardLoading: boolean;
  submittedAt: number;
  // canvas -> store camera sync
  cameraX: number;
  setCameraX: (x: number) => void;
  collectBonus: (id: number) => void;
}

interface GameStore extends SaveState, RuntimeState {
  init: () => void;
  tap: (x: number, y: number) => void;
  buyUpgrade: (id: UpgradeId) => void;
  ascend: () => void;
  watchAd: (kind: "surge" | "offline" | "combo") => void;
  finishAd: () => void;
  cancelAd: () => void;
  claimDaily: () => void;
  buyShopItem: (id: string) => void;
  setTheme: (id: ThemeId) => void;
  setName: (name: string) => void;
  setTab: (t: RuntimeState["tab"]) => void;
  toggleMute: () => void;
  toggleMusic: () => void;
  hardReset: () => void;
  pushToast: (t: { title: string; desc?: string; icon?: string }) => void;
  dismissToast: (id: number) => void;
  tick: (now: number) => void;
  loadLeaderboard: () => Promise<void>;
  submitToLeaderboard: () => Promise<void>;
  _checkAchievements: () => void;
  _save: () => void;
}

let floatId = 1;
let toastId = 1;

export const useGame = create<GameStore>((set, get) => {
  if (typeof window !== "undefined") (window as any).__game = { getState: get };
  return ({
  ...defaultSave(),
  // runtime
  combo: 0,
  lastTapAt: 0,
  floatingNumbers: [],
  particles: [],
  bonuses: [],
  nextBonusAt: 0,
  shake: 0,
  buildPulse: 0,
  hammerAnim: 0,
  toasts: [],
  showAd: null,
  pendingOffline: null,
  tab: "upgrades",
  muted: false,
  musicOn: true,
  leaderboard: [],
  leaderboardLoading: false,
  submittedAt: 0,
  cameraX: 0,
  setCameraX: (x) => set({ cameraX: x }),

  collectBonus: (id) => {
    const s = get();
    const bonus = s.bonuses.find((b) => b.id === id);
    if (!bonus) return;
    const audio = getAudio();
    audio.init();
    audio.play("coin");
    const gain = bonus.value;
    // particle burst at bonus location
    const parts = [...s.particles];
    const color = bonus.type === "star" ? "#fbbf24" : bonus.type === "gem" ? "#c084fc" : "#fbbf24";
    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 3;
      parts.push({
        x: bonus.x,
        y: bonus.y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 1.5,
        life: 0,
        maxLife: 500 + Math.random() * 300,
        size: 2 + Math.random() * 2,
        color,
      });
    }
    // floating number
    const floats = [...s.floatingNumbers, {
      id: floatId++,
      x: bonus.x,
      y: bonus.y,
      value: gain,
      crit: bonus.type !== "coin",
      born: Date.now(),
      vy: -0.8,
    }];
    set({
      bonuses: s.bonuses.filter((b) => b.id !== id),
      coins: s.coins + gain,
      totalCoinsEarned: s.totalCoinsEarned + gain,
      runCoinsEarned: s.runCoinsEarned + gain,
      particles: parts.slice(-360),
      floatingNumbers: floats.slice(-24),
    });
    get()._save();
  },

  init: () => {
    clearOldSave();
    const s = loadSave();
    const name = loadName();
    const now = Date.now();
    const off = offlineEarnings(s, now);
    const audio = getAudio();
    audio.setMuted(false);
    // center camera on active plot
    const camX = s.builtCount * 64;
    set({
      ...s,
      playerName: s.playerName || name,
      lastSeen: now,
      pendingOffline: off.coins > 0 ? off : null,
      showAd: off.coins > 0 ? "offline" : null,
      cameraX: camX,
      nextBonusAt: now + 4000, // first bonus appears 4s after load
      bonuses: [],
    });
    if (get().musicOn) {
      audio.init();
      audio.setMusicEnabled(true);
    }
    // ---- persistent game loop (setInterval, NOT tied to React/RAF) ----
    // This guarantees the auto-builder & passive income keep ticking even
    // when the tab is backgrounded or React re-renders. Guarded so we only
    // ever create one interval.
    if (typeof window !== "undefined" && !(window as any).__realmforgeLoop) {
      (window as any).__realmforgeLoop = setInterval(() => {
        useGame.getState().tick(Date.now());
      }, 100);
    }
  },

  tap: (x, y) => {
    const s = get();
    const now = Date.now();
    const window = comboWindowMs(s);
    const newCombo = Math.min(60, now - s.lastTapAt <= window ? s.combo + 1 : 1);
    const crit = Math.random() < critChance(s);
    const audio = getAudio();
    audio.init();
    audio.resume();
    audio.play(crit ? "crit" : newCombo > 1 && newCombo % 5 === 0 ? "combo" : "hammer");

    const coinsGain = tapCoins(s, newCombo, crit);
    const buildGain = tapBuild(s, newCombo, crit);

    let progress = s.activeProgress + buildGain;
    let builtCount = s.builtCount;
    let cumulativeIncome = s.cumulativeIncome;
    let coins = s.coins + coinsGain;
    let totalEarned = s.totalCoinsEarned + coinsGain;
    let runEarned = s.runCoinsEarned + coinsGain;
    let maxBiome = s.maxBiomeReached;

    const floats = [...s.floatingNumbers];
    const parts = [...s.particles];

    floats.push({
      id: floatId++,
      x,
      y,
      value: coinsGain,
      crit,
      born: now,
      vy: -0.7 - Math.random() * 0.3,
    });

    // spark particles
    const sparkColor = crit ? "#ffd700" : "#ffffff";
    for (let i = 0; i < (crit ? 12 : 5); i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = (crit ? 2.5 : 1.4) + Math.random() * 1.6;
      parts.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 1.2,
        life: 0,
        maxLife: 400 + Math.random() * 300,
        size: 2 + Math.random() * 2,
        color: sparkColor,
      });
    }

    // complete AT MOST ONE building per tap (prevents chain-completion exploit
    // where a single over-powered tap awards many exponential bonuses at once).
    // Excess progress is clamped (not carried to the next, more-expensive building).
    let completed = 0;
    if (progress >= 1) {
      progress = 0; // discard overflow — you must tap the next building fresh
      const idx = builtCount;
      const bonus = completeBonus(s, idx, newCombo);
      const inc = buildingIncome(s, idx);
      coins += bonus;
      totalEarned += bonus;
      runEarned += bonus;
      cumulativeIncome += inc;
      builtCount += 1;
      completed += 1;
      maxBiome = Math.max(maxBiome, idx % BIOMES.length);
      // burst particles
      for (let i = 0; i < 28; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 1.5 + Math.random() * 4;
        parts.push({
          x,
          y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 2,
          life: 0,
          maxLife: 600 + Math.random() * 400,
          size: 2 + Math.random() * 3,
          color: ["#ffd700", "#ffffff", "#7dd3fc", "#a3e635"][Math.floor(Math.random() * 4)],
        });
      }
    }

    if (completed > 0) {
      audio.play("complete");
      audio.play("coin");
      get().pushToast({
        title: completed > 1 ? `${completed} buildings raised!` : `${buildingForPlot(builtCount - 1).name} complete!`,
        desc: `+${Math.floor(completeBonus(s, builtCount - 1, newCombo))} coins`,
        icon: "🏗️",
      });
    }

    set({
      combo: newCombo,
      lastTapAt: now,
      activeProgress: progress,
      builtCount,
      cumulativeIncome,
      maxBiomeReached: maxBiome,
      coins,
      totalCoinsEarned: totalEarned,
      runCoinsEarned: runEarned,
      totalTaps: s.totalTaps + 1,
      maxCombo: Math.max(s.maxCombo, newCombo),
      floatingNumbers: floats.slice(-24),
      particles: parts.slice(-360),
      shake: Math.min(1, 0.25 + (crit ? 0.45 : 0.12) + completed * 0.15),
      buildPulse: 1,
      hammerAnim: 1,
    });

    get()._checkAchievements();
    get()._save();
    if (now - get().submittedAt > 20000) get().submitToLeaderboard();
  },

  buyUpgrade: (id) => {
    const s = get();
    const lvl = s.upgrades[id];
    if (lvl >= UPGRADES[id].maxLevel) return;
    const cost = upgradeCost(id, lvl);
    if (s.coins < cost) {
      getAudio().play("error");
      get().pushToast({ title: "Not enough coins", icon: "❌" });
      return;
    }
    getAudio().init();
    getAudio().play("upgrade");
    set({
      coins: s.coins - cost,
      upgrades: { ...s.upgrades, [id]: lvl + 1 },
    });
    get()._save();
  },

  ascend: () => {
    const s = get();
    if (!canAscend(s)) {
      getAudio().play("error");
      return;
    }
    const gained = ascensionRelicsGained(s);
    getAudio().init();
    getAudio().play("ascend");
    const keepThemes = [...s.ownedThemes];
    const keepAch = [...s.unlockedAchievements];
    const base = defaultSave();
    set({
      ...base,
      playerName: s.playerName,
      relics: s.relics + gained,
      ascensionCount: s.ascensionCount + 1,
      ownedThemes: keepThemes,
      activeTheme: s.activeTheme,
      unlockedAchievements: keepAch,
      streak: s.streak,
      lastClaimDay: s.lastClaimDay,
      lastSeen: Date.now(),
      createdAt: s.createdAt,
      perm: s.perm,
      combo: 0,
      lastTapAt: 0,
      particles: [],
      floatingNumbers: [],
      cameraX: 0,
    });
    get().pushToast({ title: `Ascended! +${gained} Relics`, desc: "Your realm grows stronger. +5% power each.", icon: "♾️" });
    get()._checkAchievements();
    get()._save();
    get().submitToLeaderboard();
  },

  watchAd: (kind) => set({ showAd: kind }),

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
      get().pushToast({ title: "GOLDEN AGE!", desc: "3× everything for 60s.", icon: "⚡" });
    } else if (kind === "offline") {
      const off = s.pendingOffline;
      if (off && off.coins > 0) {
        const doubled = off.coins * 2;
        set({
          coins: get().coins + doubled,
          totalCoinsEarned: get().totalCoinsEarned + doubled,
          runCoinsEarned: get().runCoinsEarned + doubled,
          pendingOffline: null,
        });
        get().pushToast({ title: "Offline coins doubled!", desc: `+${Math.floor(doubled)} coins`, icon: "📦" });
      }
    } else if (kind === "combo") {
      set({ combo: 30, lastTapAt: Date.now() });
      get().pushToast({ title: "Combo restored!", desc: "30× combo active.", icon: "🔥" });
    }
    get()._save();
  },

  cancelAd: () => {
    const s = get();
    if (s.showAd === "offline" && s.pendingOffline && s.pendingOffline.coins > 0) {
      const base = s.pendingOffline.coins;
      set({
        coins: get().coins + base,
        totalCoinsEarned: get().totalCoinsEarned + base,
        runCoinsEarned: get().runCoinsEarned + base,
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
    const rewards = [200, 500, 1200, 2500, 5000, 10000, 25000];
    const reward = rewards[newStreak - 1] * relicMultiplier(s);
    getAudio().init();
    getAudio().play("reward");
    set({
      streak: newStreak,
      lastClaimDay: today,
      coins: s.coins + reward,
      totalCoinsEarned: s.totalCoinsEarned + reward,
      runCoinsEarned: s.runCoinsEarned + reward,
    });
    get().pushToast({ title: `Day ${newStreak} streak!`, desc: `+${Math.floor(reward)} coins`, icon: "📅" });
    get()._checkAchievements();
    get()._save();
  },

  buyShopItem: (id) => {
    const s = get();
    if (id === "tapBoostPerm" || id === "autoBoostPerm" || id === "incomeBoostPerm") {
      if (s.perm[id]) return;
      const cost = id === "tapBoostPerm" ? 30 : id === "autoBoostPerm" ? 30 : 35;
      if (s.relics < cost) {
        getAudio().play("error");
        get().pushToast({ title: "Not enough Relics", icon: "❌" });
        return;
      }
      getAudio().init();
      getAudio().play("upgrade");
      set({ relics: s.relics - cost, perm: { ...s.perm, [id]: true } });
      get().pushToast({ title: "Permanent boost purchased!", icon: "⭐" });
    } else if (id.startsWith("theme")) {
      const themeId = id.replace("theme", "") as ThemeId;
      const theme = THEMES[themeId];
      if (!theme || s.ownedThemes.includes(themeId)) return;
      if (s.relics < theme.cost) {
        getAudio().play("error");
        get().pushToast({ title: "Not enough Relics", icon: "❌" });
        return;
      }
      getAudio().init();
      getAudio().play("upgrade");
      set({
        relics: s.relics - theme.cost,
        ownedThemes: [...s.ownedThemes, themeId],
        activeTheme: themeId,
      });
      get().pushToast({ title: `${theme.name} theme unlocked!`, icon: "🎨" });
    }
    get()._save();
  },

  setTheme: (id) => {
    const s = get();
    if (!s.ownedThemes.includes(id)) return;
    set({ activeTheme: id });
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

  hardReset: () => {
    if (typeof window !== "undefined") localStorage.removeItem("realmforge-save-v6");
    const base = defaultSave();
    set({
      ...base,
      playerName: get().playerName,
      combo: 0,
      lastTapAt: 0,
      particles: [],
      floatingNumbers: [],
      cameraX: 0,
    });
    get().pushToast({ title: "Realm reset", icon: "♻️" });
  },

  pushToast: (t) => {
    const id = toastId++;
    set({ toasts: [...get().toasts, { ...t, id }].slice(-4) });
    setTimeout(() => get().dismissToast(id), 3800);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  tick: (now) => {
    const s = get();
    const updates: Partial<GameStore> = {};
    const window = comboWindowMs(s);
    const combo = now - s.lastTapAt > window ? 0 : s.combo;
    if (combo !== s.combo) updates.combo = combo;

    const shake = Math.max(0, s.shake - 0.05);
    const pulse = Math.max(0, s.buildPulse - 0.08);
    const hammer = Math.max(0, s.hammerAnim - 0.12);
    if (shake !== s.shake) updates.shake = shake;
    if (pulse !== s.buildPulse) updates.buildPulse = pulse;
    if (hammer !== s.hammerAnim) updates.hammerAnim = hammer;

    // auto builder + passive income (dt = 0.1s)
    const dt = 0.1;
    const inc = totalIncome(s);
    if (inc > 0) {
      const gain = inc * dt;
      updates.coins = s.coins + gain;
      updates.totalCoinsEarned = s.totalCoinsEarned + gain;
      updates.runCoinsEarned = s.runCoinsEarned + gain;
    }
    const abr = autoBuildRate(s);
    if (abr > 0) {
      let progress = s.activeProgress + (abr * dt);
      let builtCount = s.builtCount;
      let cumulativeIncome = s.cumulativeIncome;
      let coins = updates.coins ?? s.coins;
      let totalEarned = updates.totalCoinsEarned ?? s.totalCoinsEarned;
      let runEarned = updates.runCoinsEarned ?? s.runCoinsEarned;
      let maxBiome = s.maxBiomeReached;
      // cap to 1 completion per tick (same anti-chain rule as tap)
      if (progress >= 1) {
        progress = 0;
        const idx = builtCount;
        const bonus = completeBonus(s, idx, 0);
        const binc = buildingIncome(s, idx);
        coins += bonus;
        totalEarned += bonus;
        runEarned += bonus;
        cumulativeIncome += binc;
        builtCount += 1;
        maxBiome = Math.max(maxBiome, idx % BIOMES.length);
      }
      updates.activeProgress = progress;
      updates.builtCount = builtCount;
      updates.cumulativeIncome = cumulativeIncome;
      updates.coins = coins;
      updates.totalCoinsEarned = totalEarned;
      updates.runCoinsEarned = runEarned;
      updates.maxBiomeReached = maxBiome;
    }

    // particles + floats aging
    updates.particles = s.particles
      .map((p) => ({ ...p, life: p.life + 100, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.14, vx: p.vx * 0.99 }))
      .filter((p) => p.life < p.maxLife);
    updates.floatingNumbers = s.floatingNumbers
      .map((f) => ({ ...f, y: f.y + f.vy, vy: f.vy * 0.97 }))
      .filter((f) => now - f.born < 900);

    // ---- spawn & age clickable bonuses ----
    const spawnBonus = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 800;
      const h = typeof window !== "undefined" ? window.innerHeight : 600;
      // restrict to the game canvas area (left ~60% of screen on desktop, full on mobile)
      const areaW = w >= 1024 ? w * 0.6 : w;
      const px = 50 + Math.random() * Math.max(100, areaW - 100);
      const py = 100 + Math.random() * Math.max(60, h * 0.4);
      const roll = Math.random();
      const type: "coin" | "gem" | "star" = roll < 0.65 ? "coin" : roll < 0.92 ? "gem" : "star";
      const baseVal = 5 + Math.sqrt(s.builtCount + 1) * 8;
      const value = Math.floor(
        (type === "coin" ? baseVal : type === "gem" ? baseVal * 5 : baseVal * 25) * (1 + s.relics * 0.03)
      );
      const id = floatId++;
      const lifeMs = type === "star" ? 8000 : type === "gem" ? 10000 : 12000;
      const newBonuses = [...s.bonuses, {
        id: id,
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.1 - Math.random() * 0.15,
        type: type,
        value: value,
        born: now,
        expiresAt: now + lifeMs,
      }].slice(-5);
      updates.bonuses = newBonuses;
    };
    // spawn on schedule
    if (now >= s.nextBonusAt) {
      spawnBonus();
      // next spawn in 3-6s (frequent so there's almost always one visible)
      updates.nextBonusAt = now + 3000 + Math.random() * 3000;
    }
    // age existing bonuses (drift + expire), clamped to screen bounds
    if (s.bonuses.length > 0) {
      const w = typeof window !== "undefined" ? window.innerWidth : 800;
      const h = typeof window !== "undefined" ? window.innerHeight : 600;
      const aged = updates.bonuses ?? s.bonuses;
      updates.bonuses = aged
        .map((b) => {
          const bx = isFinite(b.x) ? b.x : 100;
          const by = isFinite(b.y) ? b.y : 100;
          let nx = bx + b.vx;
          let ny = by + b.vy;
          nx = Math.max(40, Math.min(w - 40, nx));
          ny = Math.max(80, Math.min(h - 80, ny));
          return { ...b, x: nx, y: ny, vy: b.vy * 0.99 };
        })
        .filter((b) => now < b.expiresAt);
    }

    if (Object.keys(updates).length > 0) set(updates as any);

    // persist to localStorage every ~2s (not every 100ms tick)
    const lastSave = (get() as any).__lastSave || 0;
    if (now - lastSave > 2000) {
      set({ __lastSave: now } as any);
      get()._save();
    }

    if (s.surgeEndsAt > 0 && now > s.surgeEndsAt && now - s.surgeEndsAt < 200) {
      get().pushToast({ title: "Golden Age ended", icon: "⚡" });
    }
  },

  _checkAchievements: () => {
    const s = get();
    const ctx = { currentCombo: s.combo, biomesReached: s.maxBiomeReached + 1 };
    const newly: AchievementId[] = [];
    for (const a of ACHIEVEMENTS) {
      if (!s.unlockedAchievements.includes(a.id) && a.check(s, ctx)) newly.push(a.id);
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
        coins: get().coins + def.reward,
        totalCoinsEarned: get().totalCoinsEarned + def.reward,
        runCoinsEarned: get().runCoinsEarned + def.reward,
      });
    }
    get()._save();
  },

  _save: () => {
    const s = get();
    const save: SaveState = {
      coins: s.coins,
      relics: s.relics,
      builtCount: s.builtCount,
      activeProgress: s.activeProgress,
      cumulativeIncome: s.cumulativeIncome,
      upgrades: s.upgrades,
      totalCoinsEarned: s.totalCoinsEarned,
      runCoinsEarned: s.runCoinsEarned,
      totalTaps: s.totalTaps,
      maxCombo: s.maxCombo,
      ascensionCount: s.ascensionCount,
      ownedThemes: s.ownedThemes,
      activeTheme: s.activeTheme,
      unlockedAchievements: s.unlockedAchievements,
      lastClaimDay: s.lastClaimDay,
      streak: s.streak,
      playerName: s.playerName,
      lastSeen: Date.now(),
      surgeEndsAt: s.surgeEndsAt,
      createdAt: s.createdAt,
      cameraX: s.cameraX,
      perm: s.perm,
      maxBiomeReached: s.maxBiomeReached,
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
          totalCoins: e.totalShards, // field reused
          ascension: e.prestige,
          built: e.maxLevel,
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
          totalShards: Math.floor(s.totalCoinsEarned),
          prestige: s.ascensionCount,
          maxLevel: s.builtCount,
        }),
      });
      set({ submittedAt: Date.now() });
      if (get().leaderboard.length === 0 || Math.random() < 0.3) get().loadLeaderboard();
    } catch {
      // ignore
    }
  },
  });
});
