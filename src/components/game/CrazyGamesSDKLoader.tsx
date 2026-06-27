"use client";
import { useEffect } from "react";

/**
 * Calls CrazyGames SDK lifecycle signals after the SDK loads.
 * The SDK script itself is loaded statically in layout.tsx <head>.
 * These signals tell CrazyGames the game finished loading and gameplay started.
 */
export default function CrazyGamesSDKLoader() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Wait for the SDK to be ready (it loads async)
    const tryInit = () => {
      try {
        const sdk = (window as any).CrazyGames?.SDK;
        if (!sdk) return false;
        sdk.game?.sdkGameLoadingStop?.();
        sdk.game?.gameplayStart?.();
        return true;
      } catch {
        // SDK not initialized (not on crazygames.com) — that's fine
        return false;
      }
    };
    // Try immediately, then retry a few times (SDK loads async)
    if (tryInit()) return;
    const iv = setInterval(() => { if (tryInit()) clearInterval(iv); }, 500);
    setTimeout(() => clearInterval(iv), 5000); // give up after 5s
    return () => clearInterval(iv);
  }, []);
  return null;
}
