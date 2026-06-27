"use client";
import { useGame } from "@/lib/store/gameStore";
import { PRESTIGE_THRESHOLD } from "@/lib/game/config";
import { formatNumber, prestigePrismsGained, nextPrismProgress, prismMultiplier } from "@/lib/game/engine";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, TrendingUp } from "lucide-react";

export default function PrestigePanel() {
  const runShards = useGame((s) => s.runShardsEarned);
  const prisms = useGame((s) => s.prisms);
  const prestigeCount = useGame((s) => s.prestigeCount);
  const reforge = useGame((s) => s.reforge);

  const gained = prestigePrismsGained({ runShardsEarned: runShards } as any);
  const canReforge = gained > 0;
  const prog = nextPrismProgress({ runShardsEarned: runShards } as any);
  const mult = prismMultiplier({ prisms } as any);
  const newMult = prismMultiplier({ prisms: prisms + gained } as any);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> REFORGE
          </div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
            Reset for Eternal Power
          </h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Reforging resets your shards, upgrades, and crystal level — but grants{" "}
            <span className="text-fuchsia-300 font-semibold">Prisms</span>, a permanent currency that boosts{" "}
            <span className="text-cyan-300 font-semibold">everything</span> by +2% each.
          </p>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 space-y-3">
          <Row label="Current Prisms" value={`🔮 ${formatNumber(prisms)}`} />
          <Row label="Current Global Boost" value={`×${mult.toFixed(2)}`} accent="text-cyan-300" />
          <div className="h-px bg-slate-700/50" />
          <Row label="Shards earned this run" value={`💎 ${formatNumber(runShards)}`} />
          <Row label="Prisms from reforge" value={`🔮 +${formatNumber(gained)}`} accent="text-fuchsia-300" />
          <Row label="New Global Boost" value={`×${newMult.toFixed(2)}`} accent="text-emerald-300" />
          <Row label="Total reforges" value={`${prestigeCount}`} />
        </div>

        {/* progress to next prism */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Progress to next Prism</span>
            <span className="tabular-nums">
              {formatNumber(prog.current)} / {formatNumber(prog.needed)}
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${Math.max(2, prog.pct * 100)}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => {
            if (canReforge && confirm(`Reforge now? You'll gain ${gained} Prisms but lose your current shards & upgrades.`)) {
              reforge();
            }
          }}
          disabled={!canReforge}
          className={`w-full py-3.5 rounded-xl font-bold text-base transition relative overflow-hidden ${
            canReforge
              ? "bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-fuchsia-500/30"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
          }`}
        >
          {canReforge ? (
            <span className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5" /> REFORGE FOR +{formatNumber(gained)} PRISMS
            </span>
          ) : (
            <span>
              Earn {formatNumber(PRESTIGE_THRESHOLD)} shards this run to reforge
              <span className="block text-xs font-normal opacity-70 mt-0.5">
                ({formatNumber(runShards)} / {formatNumber(PRESTIGE_THRESHOLD)})
              </span>
            </span>
          )}
        </button>

        <p className="text-[11px] text-slate-500 text-center leading-relaxed">
          💡 Tip: Reforging is the key to going infinitely far. Each reforge makes every future run stronger.
        </p>
      </div>
    </ScrollArea>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`font-bold tabular-nums ${accent || "text-slate-100"}`}>{value}</span>
    </div>
  );
}
