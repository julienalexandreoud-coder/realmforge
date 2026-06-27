"use client";
import { useGame } from "@/lib/store/gameStore";
import { MAX_DAILY_STREAK } from "@/lib/game/config";
import { formatNumber, relicMultiplier } from "@/lib/game/engine";
import { Flame, Gift } from "lucide-react";
import { todayKey } from "@/lib/game/save";

const REWARDS = [200, 500, 1200, 2500, 5000, 10000, 25000];

export default function DailyStreak() {
  const streak = useGame((s) => s.streak);
  const lastClaimDay = useGame((s) => s.lastClaimDay);
  const claim = useGame((s) => s.claimDaily);
  const relics = useGame((s) => s.relics);

  const claimedToday = lastClaimDay === todayKey();
  const mult = relicMultiplier({ relics } as any);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: MAX_DAILY_STREAK }).map((_, i) => {
          const day = i + 1;
          const reached = streak >= day;
          const isToday = !claimedToday && streak + 1 === day;
          return (
            <div
              key={i}
              className={`relative w-6 h-6 sm:w-7 sm:h-7 grid place-items-center border-2 transition ${
                reached
                  ? "border-orange-400 bg-orange-600 text-white"
                  : isToday
                  ? "border-amber-400 bg-amber-950/60 text-amber-300 animate-pulse"
                  : "border-slate-700 bg-slate-950 text-slate-600"
              }`}
              title={`Day ${day}: ${formatNumber(REWARDS[i] * mult)} coins`}
            >
              {reached ? <Flame className="w-3 h-3" /> : <span className="font-pixel text-[8px]">{day}</span>}
            </div>
          );
        })}
      </div>
      <button
        onClick={claim}
        disabled={claimedToday}
        className={`px-2.5 py-1.5 border-2 font-pixel text-[8px] transition flex items-center gap-1.5 ${
          claimedToday
            ? "border-slate-800 bg-slate-950 text-slate-600 cursor-default"
            : "border-orange-400 bg-orange-700 text-white hover:brightness-110 active:translate-y-0.5"
        }`}
      >
        <Gift className="w-3 h-3" />
        {claimedToday ? "DONE" : streak === 0 ? "DAY 1" : `DAY ${Math.min(streak + 1, 7)}`}
      </button>
    </div>
  );
}
