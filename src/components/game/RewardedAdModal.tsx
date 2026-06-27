"use client";
import { useGame } from "@/lib/store/gameStore";
import { useEffect, useState } from "react";

const AD_DURATION = 5;

// Detect the CrazyGames SDK. Only activate when actually hosted on
// CrazyGames (the SDK throws "not initialized" on other domains).
// In dev/standalone → fall back to a simulated 5s ad countdown so the
// game is fully playable & testable offline.
function hasCrazySDK(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const host = window.location.hostname;
    const onCrazy = host.includes("crazygames.com") || host.includes("1001games");
    const sdk = (window as any).CrazyGames?.SDK;
    // Both the SDK object AND being on their domain (so it's initialized)
    return onCrazy && !!sdk?.ad;
  } catch {
    return false;
  }
}

export default function RewardedAdModal() {
  const showAd = useGame((s) => s.showAd);
  const finishAd = useGame((s) => s.finishAd);
  const cancelAd = useGame((s) => s.cancelAd);
  const [count, setCount] = useState(AD_DURATION);
  const [done, setDone] = useState(false);
  const [usingSDK, setUsingSDK] = useState(false);

  useEffect(() => {
    if (!showAd) return;
    // If the CrazyGames SDK is available, request a REAL rewarded ad.
    // The SDK handles its own ad UI; we just react to adFinished/adError.
    if (hasCrazySDK()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsingSDK(true);
      try {
        (window as any).CrazyGames.SDK.ad.requestAd("rewarded", {
          adFinished: () => useGame.getState().finishAd(),
          adError: (_err: unknown) => useGame.getState().cancelAd(),
          adStarted: () => {},
        });
      } catch {
        useGame.getState().cancelAd();
      }
      return;
    }
    // --- DEV FALLBACK: simulated 5s ad countdown ---
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsingSDK(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCount(AD_DURATION);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDone(false);
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
  // When using the real SDK, it renders its own overlay — hide ours.
  if (usingSDK) return null;

  const config: Record<string, { icon: string; title: string; reward: string }> = {
    surge: { icon: "⚡", title: "GOLDEN AGE", reward: "3× everything for 60s" },
    offline: { icon: "📦", title: "OFFLINE COINS", reward: "Double your offline earnings" },
    combo: { icon: "🔥", title: "COMBO SURGE", reward: "Instant 30× combo + 5 Relics" },
  };
  const c = config[showAd];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4">
      <div className="w-full max-w-sm border-2 border-slate-600 bg-slate-950 overflow-hidden">
        <div className="px-3 py-1.5 bg-slate-900 border-b-2 border-slate-800 flex items-center justify-between">
          <span className="font-pixel text-[7px] uppercase tracking-wider text-slate-500">Advertisement</span>
          {!done && <span className="font-pixel text-[7px] text-slate-500">{count}s</span>}
        </div>

        <div className="relative aspect-video bg-gradient-to-br from-fuchsia-900 via-slate-900 to-cyan-900 grid place-items-center overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  width: 24 + (i % 3) * 12,
                  height: 24 + (i % 3) * 12,
                  left: `${(i * 13) % 90}%`,
                  top: `${(i * 17) % 80}%`,
                  background: ["#a855f7", "#06b6d4", "#f59e0b", "#10b981"][i % 4],
                  animation: `pxfloat ${3 + (i % 3)}s ease-in-out infinite`,
                  imageRendering: "pixelated",
                }}
              />
            ))}
          </div>
          <div className="relative text-center px-4">
            <div className="text-4xl mb-1 animate-bounce">{c?.icon}</div>
            <div className="font-pixel text-xs text-white drop-shadow-[2px_2px_0_#000]">{c?.title}</div>
            <div className="text-[11px] text-cyan-200 mt-1">{c?.reward}</div>
          </div>

          {!done && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
              <div
                className="h-full bg-cyan-400"
                style={{ width: `${((AD_DURATION - count) / AD_DURATION) * 100}%` }}
              />
            </div>
          )}
        </div>

        <div className="p-3">
          {done ? (
            <button
              onClick={finishAd}
              className="w-full py-3 border-2 border-emerald-400 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-pixel text-xs hover:brightness-110 active:translate-y-0.5 transition"
            >
              ✓ CLAIM REWARD
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={cancelAd}
                className="flex-1 py-2.5 border-2 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-pixel text-[9px] transition active:translate-y-0.5"
              >
                NO THANKS
              </button>
              <button
                disabled
                className="flex-1 py-2.5 border-2 border-slate-800 bg-slate-900/50 text-slate-600 font-pixel text-[9px] cursor-not-allowed"
              >
                {count}s...
              </button>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        @keyframes pxfloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
      `}</style>
    </div>
  );
}
