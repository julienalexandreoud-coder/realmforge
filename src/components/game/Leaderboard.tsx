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
      <div className="p-2.5 flex items-center justify-between border-b-2 border-slate-800">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="font-pixel text-[10px]">GLOBAL RANKS</h3>
        </div>
        <button
          onClick={() => {
            submit();
            setTimeout(load, 400);
          }}
          className="font-pixel text-[8px] px-2 py-1 border-2 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition active:translate-y-0.5"
        >
          ↻ SYNC
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading && leaderboard.length === 0 ? (
            <div className="p-6 text-center font-pixel text-[9px] text-slate-500">LOADING...</div>
          ) : leaderboard.length === 0 ? (
            <div className="p-6 text-center text-[12px] text-slate-500">
              No scores yet. {playerName ? "Your score syncs automatically!" : "Set a name to compete."}
            </div>
          ) : (
            <ol className="space-y-1">
              {leaderboard.map((e, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-2.5 p-2 border-2 ${
                    e.you
                      ? "border-cyan-500 bg-cyan-950/40"
                      : i < 3
                      ? "border-slate-700 bg-slate-900/60"
                      : "border-slate-800 bg-slate-950/40"
                  }`}
                >
                  <div
                    className={`w-7 h-7 shrink-0 grid place-items-center font-pixel text-[10px] ${
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
                    <div className={`text-[12px] font-semibold truncate ${e.you ? "text-cyan-300" : "text-slate-200"}`}>
                      {e.name} {e.you && <span className="font-pixel text-[8px] text-cyan-400">(YOU)</span>}
                    </div>
                    <div className="text-[10px] text-slate-500 flex gap-2 font-pixel">
                      <span>∞ {e.ascension}</span>
                      <span>🏘️ {e.built}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-pixel text-[10px] text-amber-300 tabular-nums">
                      {formatNumber(Number(e.totalCoins))}
                    </div>
                    <div className="text-[8px] text-slate-500 font-pixel">COINS</div>
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
