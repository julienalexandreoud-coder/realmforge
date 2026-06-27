"use client";
import { useEffect, useState } from "react";
import { useGame } from "@/lib/store/gameStore";
import GameCanvas from "@/components/game/GameCanvas";
import ScoreHud from "@/components/game/ScoreHud";
import GameFooter from "@/components/game/GameFooter";
import UpgradePanel from "@/components/game/UpgradePanel";
import ShopPanel from "@/components/game/ShopPanel";
import AscendPanel from "@/components/game/AscendPanel";
import Leaderboard from "@/components/game/Leaderboard";
import Achievements from "@/components/game/Achievements";
import NameDialog from "@/components/game/NameDialog";
import RewardedAdModal from "@/components/game/RewardedAdModal";
import Toasts from "@/components/game/Toasts";
import BonusOverlay from "@/components/game/BonusOverlay";
import CrazyGamesSDKLoader from "@/components/game/CrazyGamesSDKLoader";
import LegalModal from "@/components/game/LegalModal";
import { getAudio } from "@/lib/game/audio";
import { canAscend, ascensionRelicsGained } from "@/lib/game/engine";
import { Zap, ShoppingCart, Infinity as Inf, Trophy, Medal } from "lucide-react";

export default function Home() {
  const init = useGame((s) => s.init);
  const tab = useGame((s) => s.tab);
  const setTab = useGame((s) => s.setTab);
  const showAd = useGame((s) => s.showAd);

  const runCoins = useGame((s) => s.runCoinsEarned);
  const ascendBadge = ascensionRelicsGained({ runCoinsEarned: runCoins } as any);

  useEffect(() => {
    init();
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
    { id: "upgrades" as const, label: "Build", icon: Zap },
    { id: "shop" as const, label: "Shop", icon: ShoppingCart },
    { id: "ascend" as const, label: "Ascend", icon: Inf, badge: canAscend({ runCoinsEarned: runCoins } as any) ? ascendBadge : 0 },
    { id: "leaderboard" as const, label: "Ranks", icon: Trophy },
    { id: "achievements" as const, label: "Quests", icon: Medal },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a1a] text-slate-100">
      <ScoreHud />

      <main className="flex-1 w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="grid lg:grid-cols-[1fr_360px] gap-2 sm:gap-3 h-[calc(100vh-124px)] min-h-[520px]">
          {/* Game world */}
          <div className="relative border-2 border-cyan-900 min-h-[320px] overflow-hidden">
            <GameCanvas />
            <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-pixel text-[8px] text-cyan-200/80 bg-slate-950/70 px-2 py-1 border border-cyan-800">
              ▶ TAP TO BUILD · DRAG TO SCROLL
            </div>
          </div>

          {/* Side panel */}
          <div className="flex flex-col border-2 border-slate-700 bg-slate-950/70 overflow-hidden min-h-[280px]">
            <div className="flex border-b-2 border-slate-800 bg-slate-900/60 overflow-x-auto">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`relative flex-1 min-w-[56px] flex flex-col items-center gap-1 py-2.5 font-pixel text-[8px] transition ${
                      active ? "text-cyan-300 bg-slate-950/50" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-gradient-to-r from-cyan-400 to-fuchsia-400" />
                    )}
                    {!!t.badge && t.badge > 0 && (
                      <span className="absolute top-1 right-1/2 translate-x-4 -translate-y-0.5 min-w-[14px] h-3.5 px-1 grid place-items-center bg-fuchsia-500 text-white font-pixel text-[7px] animate-pulse">
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex-1 overflow-hidden">
              {tab === "upgrades" && <UpgradePanel />}
              {tab === "shop" && <ShopPanel />}
              {tab === "ascend" && <AscendPanel />}
              {tab === "leaderboard" && <Leaderboard />}
              {tab === "achievements" && <Achievements />}
            </div>
          </div>
        </div>
      </main>

      <GameFooter />

      <NameDialog />
      <RewardedAdModal key={showAd ?? "none"} />
      <BonusOverlay />
      <CrazyGamesSDKLoader />
      <LegalModal />
      <Toasts />
    </div>
  );
}
