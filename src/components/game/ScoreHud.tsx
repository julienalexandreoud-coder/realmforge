"use client";
import { useGame } from "@/lib/store/gameStore";
import { formatNumber, surgeActive, surgeRemainingMs } from "@/lib/game/engine";
import { Volume2, VolumeX, Music, Music2, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

export default function ScoreHud() {
  const shards = useGame((s) => s.shards);
  const prisms = useGame((s) => s.prisms);
  const level = useGame((s) => s.crystalLevel);
  const combo = useGame((s) => s.combo);
  const surgeEndsAt = useGame((s) => s.surgeEndsAt);
  const muted = useGame((s) => s.muted);
  const musicOn = useGame((s) => s.musicOn);
  const toggleMute = useGame((s) => s.toggleMute);
  const toggleMusic = useGame((s) => s.toggleMusic);
  const hardReset = useGame((s) => s.hardReset);
  const playerName = useGame((s) => s.playerName);

  const [, force] = useState(0);
  useEffect(() => {
    if (surgeEndsAt <= Date.now()) return;
    const i = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(i);
  }, [surgeEndsAt]);

  const surgeOn = surgeActive({ surgeEndsAt } as any);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/70 border-b border-cyan-500/15">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-2 mr-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-fuchsia-500 grid place-items-center text-base shadow-lg shadow-cyan-500/30">
            💎
          </div>
          <div className="leading-tight">
            <div className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
              PRISM SMASH
            </div>
            <div className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
              {playerName ? `Playing as ${playerName}` : "Tap to smash"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          <Stat icon="💎" label="Shards" value={formatNumber(shards)} color="text-cyan-300" />
          <Stat icon="🔮" label="Prisms" value={formatNumber(prisms)} color="text-fuchsia-300" />
          <Stat icon="🔺" label="Level" value={String(level)} color="text-amber-300" />
          {combo > 1 && (
            <Stat icon="🔥" label="Combo" value={`${combo}×`} color="text-orange-300" pulse />
          )}
          {surgeOn && (
            <Stat
              icon="⚡"
              label="Surge"
              value={`${Math.ceil(surgeRemainingMs({ surgeEndsAt } as any) / 1000)}s`}
              color="text-yellow-300"
              pulse
            />
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleMute}
            aria-label="Toggle sound"
            className="w-9 h-9 grid place-items-center rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 transition"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleMusic}
            aria-label="Toggle music"
            className="w-9 h-9 grid place-items-center rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 transition"
          >
            {musicOn ? <Music className="w-4 h-4" /> : <Music2 className="w-4 h-4 opacity-40" />}
          </button>
          <button
            onClick={() => {
              if (confirm("Reset ALL progress? This cannot be undone.")) hardReset();
            }}
            aria-label="Reset game"
            className="w-9 h-9 grid place-items-center rounded-lg bg-slate-800/70 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function Stat({
  icon,
  label,
  value,
  color,
  pulse,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
  pulse?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/70 border border-slate-700/50 ${
        pulse ? "animate-pulse" : ""
      }`}
    >
      <span className="text-sm">{icon}</span>
      <div className="leading-none">
        <div className={`font-bold text-sm tabular-nums ${color}`}>{value}</div>
        <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
      </div>
    </div>
  );
}
