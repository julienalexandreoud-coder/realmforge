"use client";
import { useEffect } from "react";
import { useGame } from "@/lib/store/gameStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatNumber } from "@/lib/game/engine";
import { Trophy } from "lucide-react";

export default function Leaderboard() {
  const leaderboard = useGame((s) => s.leaderboard);
  const loading = useGame((s) => s.leaderboardLoading);
  const load = useGame((s) => s.loadLeaderboard);
  const submit = useGame((s) => s.submitToLeaderboard);
  const playerName = useGame((s) => s.playerName);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold">Global Leaderboard</h3>
        </div>
        <button
          onClick={() => {
            submit();
            setTimeout(load, 400);
          }}
          className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
        >
          ↻ Refresh
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading && leaderboard.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">Loading rankings…</div>
          ) : leaderboard.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No scores yet. {playerName ? "Your score submits automatically as you play!" : "Set a name to compete."}
            </div>
          ) : (
            <ol className="space-y-1">
              {leaderboard.map((e, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-3 p-2.5 rounded-lg ${
                    e.you
                      ? "bg-cyan-500/15 border border-cyan-500/40"
                      : i < 3
                      ? "bg-slate-900/60"
                      : "bg-slate-900/30"
                  }`}
                >
                  <div
                    className={`w-7 h-7 shrink-0 grid place-items-center rounded-full font-bold text-xs ${
                      i === 0
                        ? "bg-amber-400 text-amber-950"
                        : i === 1
                        ? "bg-slate-300 text-slate-800"
                        : i === 2
                        ? "bg-amber-700 text-amber-100"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-semibold truncate ${e.you ? "text-cyan-300" : "text-slate-200"}`}>
                      {e.name} {e.you && <span className="text-[10px] text-cyan-400">(you)</span>}
                    </div>
                    <div className="text-[11px] text-slate-500 flex gap-2">
                      <span>♻️ {e.prestige}</span>
                      <span>🔺 Lv.{e.maxLevel}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-cyan-300 tabular-nums">
                      {formatNumber(Number(e.totalShards))}
                    </div>
                    <div className="text-[10px] text-slate-500">shards</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
