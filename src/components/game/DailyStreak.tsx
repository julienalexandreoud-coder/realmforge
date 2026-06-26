"use client";
import { useGame } from "@/lib/store/gameStore";
import { MAX_DAILY_STREAK } from "@/lib/game/config";
import { formatNumber, prismMultiplier } from "@/lib/game/engine";
import { Flame, Gift } from "lucide-react";
import { todayKey } from "@/lib/game/save";

const REWARDS = [200, 400, 800, 1500, 3000, 6000, 12000];

export default function DailyStreak() {
  const streak = useGame((s) => s.streak);
  const lastClaimDay = useGame((s) => s.lastClaimDay);
  const claim = useGame((s) => s.claimDaily);
  const prisms = useGame((s) => s.prisms);

  const claimedToday = lastClaimDay === todayKey();
  const mult = prismMultiplier({ prisms } as any);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: MAX_DAILY_STREAK }).map((_, i) => {
          const day = i + 1;
          const reached = streak >= day;
          const isToday = !claimedToday && streak + 1 === day;
          return (
            <div
              key={i}
              className={`relative w-7 h-7 sm:w-8 sm:h-8 grid place-items-center rounded-lg text-[10px] font-bold transition ${
                reached
                  ? "bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/30"
                  : isToday
                  ? "bg-amber-400/20 border border-amber-400 text-amber-300 animate-pulse"
                  : "bg-slate-800/60 text-slate-600"
              }`}
              title={`Day ${day}: ${formatNumber(REWARDS[i] * mult)} shards`}
            >
              {reached ? <Flame className="w-3.5 h-3.5" /> : day}
            </div>
          );
        })}
      </div>
      <button
        onClick={claim}
        disabled={claimedToday}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
          claimedToday
            ? "bg-slate-800 text-slate-500 cursor-default"
            : "bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:scale-105 active:scale-95 shadow-md shadow-orange-500/30"
        }`}
      >
        <Gift className="w-3.5 h-3.5" />
        {claimedToday ? "Claimed" : streak === 0 ? "Claim Day 1" : `Claim Day ${Math.min(streak + 1, 7)}`}
      </button>
    </div>
  );
}
