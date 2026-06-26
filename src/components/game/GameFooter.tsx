"use client";
import { useGame } from "@/lib/store/gameStore";
import DailyStreak from "./DailyStreak";
import { Zap, ZapOff, Flame, Play } from "lucide-react";
import { surgeActive } from "@/lib/game/engine";

export default function GameFooter() {
  const watchAd = useGame((s) => s.watchAd);
  const surgeEndsAt = useGame((s) => s.surgeEndsAt);
  const surgeOn = surgeActive({ surgeEndsAt } as any);

  return (
    <footer className="mt-auto border-t border-cyan-500/15 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
        <DailyStreak />

        <div className="h-6 w-px bg-slate-700 hidden sm:block" />

        {/* Rewarded ad: Power Surge */}
        <button
          onClick={() => watchAd("surge")}
          disabled={surgeOn}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            surgeOn
              ? "bg-amber-500/20 text-amber-300 cursor-default"
              : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-105 active:scale-95 shadow-md shadow-amber-500/30"
          }`}
        >
          {surgeOn ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
          {surgeOn ? "Surge Active" : "⚡ Free Surge (Ad)"}
        </button>

        {/* Rewarded ad: Combo restore */}
        <button
          onClick={() => watchAd("combo")}
          className="hidden sm:flex px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-orange-300 transition items-center gap-1.5"
        >
          <Flame className="w-3.5 h-3.5" /> Combo Boost (Ad)
        </button>

        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 ml-auto">
          <Play className="w-3 h-3" />
          Tap the crystal fast to build combos • Buy upgrades • Reforge for Prisms
        </div>
      </div>
    </footer>
  );
}
