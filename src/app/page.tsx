"use client";
import { useEffect, useState } from "react";
import { useGame } from "@/lib/store/gameStore";
import GameCanvas from "@/components/game/GameCanvas";
import ScoreHud from "@/components/game/ScoreHud";
import GameFooter from "@/components/game/GameFooter";
import UpgradePanel from "@/components/game/UpgradePanel";
import ShopPanel from "@/components/game/ShopPanel";
import PrestigePanel from "@/components/game/PrestigePanel";
import Leaderboard from "@/components/game/Leaderboard";
import Achievements from "@/components/game/Achievements";
import NameDialog from "@/components/game/NameDialog";
import RewardedAdModal from "@/components/game/RewardedAdModal";
import Toasts from "@/components/game/Toasts";
import { getAudio } from "@/lib/game/audio";
import { canPrestige, prestigePrismsGained, formatNumber } from "@/lib/game/engine";
import { Zap, ShoppingCart, Recycle, Trophy, Medal } from "lucide-react";

export default function Home() {
  const init = useGame((s) => s.init);
  const tab = useGame((s) => s.tab);
  const setTab = useGame((s) => s.setTab);
  const showAd = useGame((s) => s.showAd);

  // ref to subscribe for prestige badge
  const runShards = useGame((s) => s.runShardsEarned);
  const prestigeBadge = prestigePrismsGained({ runShardsEarned: runShards } as any);

  useEffect(() => {
    init();
    // start game loop ticker fallback handled in canvas; here ensure audio ready on first interaction
    const onFirst = () => {
      const a = getAudio();
      a.init();
      a.resume();
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("keydown", onFirst);
    };
    window.addEventListener("pointerdown", onFirst);
    window.addEventListener("keydown", onFirst);
    return () => {
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("keydown", onFirst);
    };
  }, [init]);

  const tabs = [
    { id: "upgrades" as const, label: "Upgrades", icon: Zap },
    { id: "shop" as const, label: "Shop", icon: ShoppingCart },
    { id: "prestige" as const, label: "Reforge", icon: Recycle, badge: canPrestige({ runShardsEarned: runShards } as any) ? prestigeBadge : 0 },
    { id: "leaderboard" as const, label: "Ranks", icon: Trophy },
    { id: "achievements" as const, label: "Quests", icon: Medal },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#05070f] text-slate-100">
      <ScoreHud />

      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-4 py-3">
        <div className="grid lg:grid-cols-[1fr_380px] gap-3 lg:gap-4 h-[calc(100vh-128px)] min-h-[560px]">
          {/* Game area */}
          <div className="relative rounded-2xl overflow-hidden border border-cyan-500/15 min-h-[340px]">
            <GameCanvas />
            {/* tap hint */}
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-cyan-300/70 bg-slate-950/60 px-3 py-1 rounded-full border border-cyan-500/20">
              👆 Tap the crystal to smash it
            </div>
          </div>

          {/* Side panel */}
          <div className="flex flex-col rounded-2xl border border-slate-700/50 bg-slate-950/60 overflow-hidden min-h-[300px]">
            {/* tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/50 overflow-x-auto">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`relative flex-1 min-w-[64px] flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                      active ? "text-cyan-300" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-cyan-400 to-fuchsia-400 rounded-full" />
                    )}
                    {!!t.badge && t.badge > 0 && (
                      <span className="absolute top-1 right-1/2 translate-x-4 -translate-y-0.5 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-fuchsia-500 text-white text-[9px] font-bold animate-pulse">
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* panel content */}
            <div className="flex-1 overflow-hidden">
              {tab === "upgrades" && <UpgradePanel />}
              {tab === "shop" && <ShopPanel />}
              {tab === "prestige" && <PrestigePanel />}
              {tab === "leaderboard" && <Leaderboard />}
              {tab === "achievements" && <Achievements />}
            </div>
          </div>
        </div>
      </main>

      <GameFooter />

      {/* overlays */}
      <NameDialog />
      <RewardedAdModal key={showAd ?? "none"} />
      <Toasts />
    </div>
  );
}
