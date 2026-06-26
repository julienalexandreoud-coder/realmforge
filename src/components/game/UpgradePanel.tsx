"use client";
import { useGame } from "@/lib/store/gameStore";
import { UPGRADES, UPGRADE_ORDER } from "@/lib/game/config";
import { upgradeCost, formatNumber } from "@/lib/game/engine";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock } from "lucide-react";

export default function UpgradePanel() {
  const coins = useGame((s) => s.coins);
  const upgrades = useGame((s) => s.upgrades);
  const buy = useGame((s) => s.buyUpgrade);

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        <p className="font-pixel text-[9px] text-slate-400 px-1 leading-relaxed">
          SPEND COINS TO POWER UP YOUR REALM.
        </p>
        {UPGRADE_ORDER.map((id) => {
          const def = UPGRADES[id];
          const lvl = upgrades[id];
          const maxed = lvl >= def.maxLevel;
          const cost = upgradeCost(id, lvl);
          const afford = coins >= cost;
          return (
            <button
              key={id}
              onClick={() => buy(id)}
              disabled={maxed}
              className={`w-full text-left border-2 p-2.5 transition group ${
                maxed
                  ? "border-amber-600 bg-amber-950/30 cursor-default"
                  : afford
                  ? "border-cyan-700 bg-slate-900/70 hover:border-cyan-400 hover:bg-slate-800 active:translate-y-0.5"
                  : "border-slate-800 bg-slate-950/50 opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 shrink-0 grid place-items-center border-2 border-slate-700 bg-slate-800 text-lg">
                  {def.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-pixel text-[10px] text-slate-100 truncate">{def.name}</span>
                    <span className="font-pixel text-[8px] px-1.5 py-0.5 border border-slate-700 bg-slate-950 text-slate-400 tabular-nums">
                      {lvl}/{def.maxLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug mt-0.5 line-clamp-2">{def.desc}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-cyan-300/90 font-pixel">{def.effectLabel(lvl)}</span>
                    {maxed ? (
                      <span className="text-[10px] font-pixel text-amber-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> MAX
                      </span>
                    ) : (
                      <span className={`font-pixel text-[11px] tabular-nums ${afford ? "text-amber-300" : "text-rose-400"}`}>
                        🪙 {formatNumber(cost)}
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
