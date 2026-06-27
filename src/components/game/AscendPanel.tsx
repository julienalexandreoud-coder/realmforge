"use client";
import { useGame } from "@/lib/store/gameStore";
import { ASCENSION_THRESHOLD } from "@/lib/game/config";
import { formatNumber, ascensionRelicsGained, nextRelicProgress, relicMultiplier } from "@/lib/game/engine";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, TrendingUp } from "lucide-react";

export default function AscendPanel() {
  const runCoins = useGame((s) => s.runCoinsEarned);
  const relics = useGame((s) => s.relics);
  const ascensionCount = useGame((s) => s.ascensionCount);
  const ascend = useGame((s) => s.ascend);

  const gained = ascensionRelicsGained({ runCoinsEarned: runCoins } as any);
  const can = gained > 0;
  const prog = nextRelicProgress({ runCoinsEarned: runCoins } as any);
  const mult = relicMultiplier({ relics } as any);
  const newMult = relicMultiplier({ relics: relics + gained } as any);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 border-2 border-fuchsia-700 bg-fuchsia-950/40 text-fuchsia-300 font-pixel text-[9px] mb-3">
            <Sparkles className="w-3.5 h-3.5" /> ASCEND
          </div>
          <h2 className="font-pixel text-base bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-transparent leading-relaxed">
            FOUND A NEW REALM
          </h2>
          <p className="text-[12px] text-slate-400 mt-2 leading-relaxed">
            Reset your coins, buildings & upgrades — but gain{" "}
            <span className="text-fuchsia-300 font-semibold">Relics</span>, a permanent currency that boosts{" "}
            <span className="text-cyan-300 font-semibold">everything</span> by +5% each.
          </p>
        </div>

        <div className="border-2 border-slate-700 bg-slate-950/60 p-3 space-y-2.5">
          <Row label="Current Relics" value={`🏺 ${formatNumber(relics)}`} />
          <Row label="Current Global Boost" value={`×${mult.toFixed(2)}`} accent="text-cyan-300" />
          <div className="h-px bg-slate-700/60" />
          <Row label="Coins earned this run" value={`🪙 ${formatNumber(runCoins)}`} />
          <Row label="Relics from ascension" value={`🏺 +${formatNumber(gained)}`} accent="text-fuchsia-300" />
          <Row label="New Global Boost" value={`×${newMult.toFixed(2)}`} accent="text-emerald-300" />
          <Row label="Total ascensions" value={`${ascensionCount}`} />
        </div>

        <div>
          <div className="flex justify-between font-pixel text-[9px] text-slate-400 mb-1.5">
            <span>NEXT RELIC</span>
            <span className="tabular-nums">
              {formatNumber(prog.current)} / {formatNumber(prog.needed)}
            </span>
          </div>
          <div className="h-3 border-2 border-slate-700 bg-slate-950">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${Math.max(2, prog.pct * 100)}%`, imageRendering: "pixelated" }}
            />
          </div>
        </div>

        <button
          onClick={() => {
            if (can && confirm(`Ascend now? You'll gain ${gained} Relics but lose your current realm (coins, buildings, upgrades).`)) {
              ascend();
            }
          }}
          disabled={!can}
          className={`w-full py-3.5 border-2 font-pixel text-xs transition ${
            can
              ? "border-fuchsia-400 bg-gradient-to-r from-fuchsia-700 to-cyan-600 text-white hover:brightness-110 active:translate-y-0.5"
              : "border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed"
          }`}
        >
          {can ? (
            <span className="flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4" /> ASCEND FOR +{formatNumber(gained)} RELICS
            </span>
          ) : (
            <span>
              EARN {formatNumber(ASCENSION_THRESHOLD)} COINS TO ASCEND
              <span className="block text-[9px] font-normal opacity-70 mt-1">
                ({formatNumber(runCoins)} / {formatNumber(ASCENSION_THRESHOLD)})
              </span>
            </span>
          )}
        </button>

        <p className="text-[10px] text-slate-500 text-center leading-relaxed">
          ◆ Ascension is the key to going infinitely far. Each new realm is stronger than the last.
        </p>
      </div>
    </ScrollArea>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-slate-400">{label}</span>
      <span className={`font-pixel text-[10px] tabular-nums ${accent || "text-slate-100"}`}>{value}</span>
    </div>
  );
}
