"use client";
import { useGame } from "@/lib/store/gameStore";
import { formatNumber } from "@/lib/game/engine";

const TYPE_STYLE = {
  coin: { icon: "🪙", color: "#fbbf24", ring: "border-amber-400", glow: "shadow-amber-500/50", label: "COIN" },
  gem: { icon: "💎", color: "#c084fc", ring: "border-fuchsia-400", glow: "shadow-fuchsia-500/50", label: "GEM" },
  star: { icon: "⭐", color: "#fbbf24", ring: "border-yellow-300", glow: "shadow-yellow-400/70", label: "STAR" },
};

export default function BonusOverlay() {
  const bonuses = useGame((s) => s.bonuses);
  const collect = useGame((s) => s.collectBonus);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none">
      {bonuses.map((b) => {
        const st = TYPE_STYLE[b.type];
        const age = Date.now() - b.born;
        const lifeLeft = b.expiresAt - Date.now();
        const fadeOut = lifeLeft < 1200 ? lifeLeft / 1200 : 1;
        const pulse = 1 + Math.sin(age / 150) * 0.08;
        return (
          <button
            key={b.id}
            onPointerDown={(e) => {
              e.stopPropagation();
              collect(b.id);
            }}
            className={`absolute pointer-events-auto flex flex-col items-center justify-center select-none transition-transform`}
            style={{
              left: b.x,
              top: b.y,
              transform: `translate(-50%,-50%) scale(${pulse})`,
              opacity: fadeOut,
            }}
          >
            {/* pulsing ring */}
            <div
              className={`absolute w-12 h-12 rounded-full border-2 ${st.ring} ${st.glow} shadow-lg animate-ping`}
              style={{ animationDuration: "1.5s" }}
            />
            {/* glow halo */}
            <div
              className="absolute w-14 h-14 rounded-full blur-md"
              style={{ background: st.color, opacity: 0.35 }}
            />
            <span
              className="relative text-3xl drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]"
              style={{ filter: `drop-shadow(0 0 6px ${st.color})` }}
            >
              {st.icon}
            </span>
            <span
              className="relative font-pixel text-[8px] mt-0.5 px-1.5 py-0.5 bg-slate-950/80 border border-slate-700"
              style={{ color: st.color }}
            >
              +{formatNumber(b.value)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
