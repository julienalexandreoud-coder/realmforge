"use client";
import { useGame } from "@/lib/store/gameStore";
import { ACHIEVEMENTS } from "@/lib/game/config";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatNumber } from "@/lib/game/engine";
import { Lock } from "lucide-react";

export default function Achievements() {
  const unlocked = useGame((s) => s.unlockedAchievements);
  const combo = useGame((s) => s.combo);
  const level = useGame((s) => s.crystalLevel);

  const ctx = { currentCombo: combo, currentLevel: level };

  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Achievements</h3>
          <span className="text-xs text-slate-400">
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
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                  done
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : close
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-slate-800 bg-slate-900/40"
                }`}
              >
                <div
                  className={`w-10 h-10 shrink-0 grid place-items-center rounded-lg text-xl ${
                    done ? "bg-emerald-500/20" : "bg-slate-800 grayscale opacity-50"
                  }`}
                >
                  {done ? a.icon : <Lock className="w-4 h-4 text-slate-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold ${done ? "text-emerald-200" : "text-slate-300"}`}>
                    {a.name}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-snug">{a.desc}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold ${done ? "text-emerald-400" : "text-slate-500"}`}>
                    💎 {formatNumber(a.reward)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
