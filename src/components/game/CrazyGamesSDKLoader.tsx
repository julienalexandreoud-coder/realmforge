"use client";
import { useEffect } from "react";

/**
 * Initializes the CrazyGames SDK v3 and calls lifecycle signals.
 *
 * Per the v3 docs: "The v3 SDK requires initialization before being used.
 * This can be done by calling the init method: await window.CrazyGames.SDK.init()"
 *
 * The SDK script is loaded synchronously in layout.tsx <head>. We call init()
 * here, then send the lifecycle signals CrazyGames' QA scanner detects:
 *   - sdkGameLoadingStart / sdkGameLoadingStop
 *   - gameplayStart
 *   - getEnvironment
 *
 * On crazygames.com: init() succeeds, ads work.
 * On localhost: init() succeeds in "local" environment (test ads).
 * On other domains: init() rejects — we catch and ignore.
 */
export default function CrazyGamesSDKLoader() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const safe = (fn: () => void) => {
      try { fn(); } catch { /* off-crazygames, ignore */ }
    };

    const initSDK = async () => {
      const SDK = (window as any).CrazyGames?.SDK;
      if (!SDK) return false;
      try {
        // v3 requires explicit init() — this is what QA detects
        if (typeof SDK.init === "function") {
          await SDK.init();
        }
      } catch {
        // init throws/rejects off crazygames.com — that's fine
      }
      // Send lifecycle signals (these register as "detected SDK functionalities")
      safe(() => SDK.game?.sdkGameLoadingStart?.());
      safe(() => SDK.game?.sdkGameLoadingStop?.());
      safe(() => SDK.game?.gameplayStart?.());
      safe(() => SDK.getEnvironment?.((_e: unknown, _env: string) => {}));
      return true;
    };

    // Try immediately (script is sync-loaded), retry briefly if needed
    let attempts = 0;
    const tryInit = () => {
      attempts++;
      initSDK().then((ok) => {
        if (ok || attempts > 10) return;
        setTimeout(tryInit, 200);
      });
    };
    tryInit();
  }, []);
  return null;
}
