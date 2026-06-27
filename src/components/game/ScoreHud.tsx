"use client";
import { useGame } from "@/lib/store/gameStore";
import { formatNumber, surgeActive, surgeRemainingMs } from "@/lib/game/engine";
import { Volume2, VolumeX, Music, Music2, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

export default function ScoreHud() {
  const coins = useGame((s) => s.coins);
  const relics = useGame((s) => s.relics);
  const built = useGame((s) => s.builtCount);
  const combo = useGame((s) => s.combo);
  const surgeEndsAt = useGame((s) => s.surgeEndsAt);
  const muted = useGame((s) => s.muted);
  const musicOn = useGame((s) => s.musicOn);
  const toggleMute = useGame((s) => s.toggleMute);
  const toggleMusic = useGame((s) => s.toggleMusic);
  const hardReset = useGame((s) => s.hardReset);
  const playerName = useGame((s) => s.playerName);
  const activeTheme = useGame((s) => s.activeTheme);

  const [, force] = useState(0);
  useEffect(() => {
    if (surgeEndsAt <= Date.now()) return;
    const i = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(i);
  }, [surgeEndsAt]);

  const surgeOn = surgeActive({ surgeEndsAt } as any);

  return (
    <header
      className="sticky top-0 z-30 border-b-2 border-cyan-900"
      style={{ background: "linear-gradient(180deg,#0d1530 0%,#0a0f24 100%)" }}
    >
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-2 mr-1">
          <img
            src="/realmforge-icon.png"
            alt="REALMFORGE"
            className="w-9 h-9"
            style={{ imageRendering: "pixelated" }}
          />
          <div className="leading-tight hidden sm:block">
            <div className="font-pixel text-[11px] tracking-wider text-cyan-200 drop-shadow-[2px_2px_0_#000]">
              REALMFORGE
            </div>
            <div className="text-[10px] text-slate-400 -mt-0.5 font-pixel">
              {playerName ? `◆ ${playerName}` : "tap to build"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          <Stat icon="🪙" label="COINS" value={formatNumber(coins)} color="text-amber-300" />
          <Stat icon="🏺" label="RELICS" value={formatNumber(relics)} color="text-fuchsia-300" />
          <Stat icon="🏘️" label="BUILT" value={formatNumber(built)} color="text-cyan-300" />
          {combo > 1 && <Stat icon="🔥" label="COMBO" value={`${combo}×`} color="text-orange-300" pulse />}
          {surgeOn && (
            <Stat
              icon="⚡"
              label="AGE"
              value={`${Math.ceil(surgeRemainingMs({ surgeEndsAt } as any) / 1000)}s`}
              color="text-yellow-300"
              pulse
            />
          )}
        </div>

        <div className="flex items-center gap-1">
          <IconBtn onClick={toggleMute} label="Toggle sound" active={!muted}>
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </IconBtn>
          <IconBtn onClick={toggleMusic} label="Toggle music" active={musicOn}>
            {musicOn ? <Music className="w-4 h-4" /> : <Music2 className="w-4 h-4 opacity-40" />}
          </IconBtn>
          <IconBtn
            onClick={() => {
              if (confirm("Reset ALL progress? This cannot be undone.")) hardReset();
            }}
            label="Reset game"
            active
            danger
          >
            <RotateCcw className="w-4 h-4" />
          </IconBtn>
        </div>
      </div>
    </header>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  active,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-9 h-9 grid place-items-center border-2 transition active:translate-y-0.5 ${
        danger
          ? "border-rose-700 bg-rose-950/60 text-rose-300 hover:bg-rose-900/60"
          : active
          ? "border-cyan-700 bg-slate-900 text-cyan-200 hover:bg-slate-800"
          : "border-slate-700 bg-slate-900 text-slate-500"
      }`}
      style={{ imageRendering: "pixelated" }}
    >
      {children}
    </button>
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
      className={`flex items-center gap-1.5 px-2 py-1 border-2 border-slate-700 bg-slate-950/80 ${
        pulse ? "animate-pulse" : ""
      }`}
    >
      <span className="text-sm">{icon}</span>
      <div className="leading-none">
        <div className={`font-pixel text-[11px] tabular-nums ${color}`}>{value}</div>
        <div className="text-[7px] uppercase tracking-wider text-slate-500 font-pixel">{label}</div>
      </div>
    </div>
  );
}
