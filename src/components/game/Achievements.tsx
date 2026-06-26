"use client";
import { useGame } from "@/lib/store/gameStore";
import { ACHIEVEMENTS, BIOMES } from "@/lib/game/config";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatNumber } from "@/lib/game/engine";
import { Lock } from "lucide-react";

export default function Achievements() {
  const unlocked = useGame((s) => s.unlockedAchievements);
  const combo = useGame((s) => s.combo);
  const builtCount = useGame((s) => s.builtCount);
  const maxBiomeReached = useGame((s) => s.maxBiomeReached);

  const ctx = { currentCombo: combo, biomesReached: maxBiomeReached + 1 };

  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-pixel text-[10px]">QUESTS</h3>
          <span className="font-pixel text-[9px] text-slate-400">
            {unlocked.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const done = unlocked.includes(a.id);
            const close = !done && a.check(useGame.getState() as any, ctx);
            return (
              <div
                key={a.id}
                className={`flex items-center gap-2.5 p-2.5 border-2 transition ${
                  done
                    ? "border-emerald-600 bg-emerald-950/30"
                    : close
                    ? "border-amber-600 bg-amber-950/20"
                    : "border-slate-800 bg-slate-950/40"
                }`}
              >
                <div
                  className={`w-9 h-9 shrink-0 grid place-items-center border-2 text-lg ${
                    done ? "border-emerald-600 bg-emerald-900/40" : "border-slate-700 bg-slate-800 grayscale opacity-50"
                  }`}
                >
                  {done ? a.icon : <Lock className="w-4 h-4 text-slate-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`font-pixel text-[9px] ${done ? "text-emerald-200" : "text-slate-300"}`}>{a.name}</div>
                  <div className="text-[11px] text-slate-500 leading-snug">{a.desc}</div>
                </div>
                <div className="text-right">
                  <div className={`font-pixel text-[9px] ${done ? "text-emerald-400" : "text-slate-500"}`}>
                    🪙 {formatNumber(a.reward)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="font-pixel text-[8px] text-slate-600 mt-3 text-center leading-relaxed">
          {BIOMES.length} BIOMES TO DISCOVER AS YOUR REALM GROWS INFINITE
        </p>
      </div>
    </ScrollArea>
  );
}
