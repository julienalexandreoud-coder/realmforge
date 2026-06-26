"use client";
import { useGame } from "@/lib/store/gameStore";
import { useEffect, useState } from "react";

const AD_DURATION = 5; // seconds (simulated; real CrazyGames rewarded ads are 15-30s)

export default function RewardedAdModal() {
  const showAd = useGame((s) => s.showAd);
  const finishAd = useGame((s) => s.finishAd);
  const cancelAd = useGame((s) => s.cancelAd);
  const [count, setCount] = useState(AD_DURATION);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!showAd) return;
    const i = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(i);
          setDone(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [showAd]);

  if (!showAd) return null;

  const config: Record<string, { icon: string; title: string; reward: string }> = {
    surge: { icon: "⚡", title: "POWER SURGE", reward: "3× everything for 60 seconds" },
    offline: { icon: "📦", title: "OFFLINE BONUS", reward: "Double your offline earnings" },
    combo: { icon: "🔥", title: "COMBO BOOST", reward: "Instant 25× combo + 5 Prisms" },
  };
  const c = config[showAd];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl">
        {/* fake ad banner header */}
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Advertisement</span>
          {!done && (
            <span className="text-[10px] text-slate-500">Skip in {count}s</span>
          )}
        </div>

        {/* ad body — simulated */}
        <div className="relative aspect-video bg-gradient-to-br from-fuchsia-900 via-slate-900 to-cyan-900 grid place-items-center overflow-hidden">
          {/* animated bg */}
          <div className="absolute inset-0 opacity-30">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full blur-2xl"
                style={{
                  width: 80 + (i % 3) * 40,
                  height: 80 + (i % 3) * 40,
                  left: `${(i * 13) % 90}%`,
                  top: `${(i * 17) % 80}%`,
                  background: ["#a855f7", "#06b6d4", "#f59e0b", "#10b981"][i % 4],
                  animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
                }}
              />
            ))}
          </div>
          <div className="relative text-center px-6">
            <div className="text-5xl mb-2 animate-bounce">{c?.icon}</div>
            <div className="text-xl font-extrabold text-white drop-shadow">{c?.title}</div>
            <div className="text-sm text-cyan-200 mt-1">{c?.reward}</div>
          </div>

          {!done && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
              <div
                className="h-full bg-cyan-400 transition-all duration-1000"
                style={{ width: `${((AD_DURATION - count) / AD_DURATION) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* footer */}
        <div className="p-4">
          {done ? (
            <button
              onClick={finishAd}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold hover:scale-[1.02] active:scale-95 transition"
            >
              ✓ CLAIM REWARD
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={cancelAd}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
              >
                No thanks
              </button>
              <button
                disabled
                className="flex-1 py-2.5 rounded-xl bg-slate-800/50 text-slate-600 text-sm font-medium cursor-not-allowed"
              >
                Reward in {count}s…
              </button>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
