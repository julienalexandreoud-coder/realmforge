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
    <footer className="mt-auto border-t-2 border-cyan-900 bg-slate-950/90">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
        <DailyStreak />

        <div className="h-6 w-px bg-slate-700 hidden sm:block" />

        <button
          onClick={() => watchAd("surge")}
          disabled={surgeOn}
          className={`px-2.5 py-1.5 border-2 font-pixel text-[8px] transition flex items-center gap-1.5 ${
            surgeOn
              ? "border-amber-600 bg-amber-950/40 text-amber-300 cursor-default"
              : "border-amber-400 bg-amber-700 text-white hover:brightness-110 active:translate-y-0.5"
          }`}
        >
          {surgeOn ? <ZapOff className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
          {surgeOn ? "ACTIVE" : "FREE GOLDEN AGE"}
        </button>

        <button
          onClick={() => watchAd("combo")}
          className="hidden sm:flex px-2.5 py-1.5 border-2 border-slate-700 bg-slate-900 hover:bg-slate-800 text-orange-300 font-pixel text-[8px] transition items-center gap-1.5 active:translate-y-0.5"
        >
          <Flame className="w-3 h-3" /> COMBO BOOST
        </button>

        <div className="hidden md:flex items-center gap-1.5 font-pixel text-[7px] text-slate-500 ml-auto">
          <Play className="w-3 h-3" />
          TAP THE WORLD TO BUILD • DRAG TO SCROLL • ASCEND FOR ETERNAL POWER
        </div>
      </div>
    </footer>
  );
}
