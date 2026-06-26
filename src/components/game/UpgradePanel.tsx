"use client";
import { useGame } from "@/lib/store/gameStore";
import { UPGRADES, UPGRADE_ORDER } from "@/lib/game/config";
import { upgradeCost, formatNumber } from "@/lib/game/engine";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock } from "lucide-react";

export default function UpgradePanel() {
  const shards = useGame((s) => s.shards);
  const upgrades = useGame((s) => s.upgrades);
  const buy = useGame((s) => s.buyUpgrade);

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2.5">
        <p className="text-xs text-slate-400 px-1">
          Spend shards to boost your smash power. Higher levels = exponential cost.
        </p>
        {UPGRADE_ORDER.map((id) => {
          const def = UPGRADES[id];
          const lvl = upgrades[id];
          const maxed = lvl >= def.maxLevel;
          const cost = upgradeCost(id, lvl);
          const afford = shards >= cost;
          return (
            <button
              key={id}
              onClick={() => buy(id)}
              disabled={maxed}
              className={`w-full text-left rounded-xl border p-3 transition group ${
                maxed
                  ? "border-amber-500/30 bg-amber-500/5 cursor-default"
                  : afford
                  ? "border-cyan-500/30 bg-slate-900/60 hover:border-cyan-400/60 hover:bg-slate-800/70 active:scale-[0.99]"
                  : "border-slate-800 bg-slate-900/40 opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 grid place-items-center rounded-lg bg-slate-800 text-xl">
                  {def.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-slate-100 truncate">{def.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 tabular-nums">
                      Lv {lvl}/{def.maxLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug mt-0.5 line-clamp-2">{def.desc}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-cyan-300/80">{def.effectLabel(lvl)}</span>
                    {maxed ? (
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> MAX
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          afford ? "text-cyan-300" : "text-rose-400"
                        }`}
                      >
                        💎 {formatNumber(cost)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
