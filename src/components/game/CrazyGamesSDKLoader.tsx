"use client";
import { useEffect } from "react";

/**
 * Loads and initializes the CrazyGames SDK v3 ONLY when the game is actually
 * hosted on CrazyGames. In dev/standalone the SDK is never loaded, avoiding
 * console errors from the SDK trying to initialize on a non-CrazyGames domain.
 *
 * CrazyGames SDK modules (v3):
 *   window.CrazyGames.SDK.ad          — video ads: requestAd("midgame"|"rewarded", cb)
 *   window.CrazyGames.SDK.banner      — banner ads: requestBanner(style)
 *   window.CrazyGames.SDK.data        — user data: getUserData(), etc.
 *   window.CrazyGames.SDK.game        — gameplay: gameplayStart(), gameplayStop(),
 *                                       sdkGameLoadingStart(), sdkGameLoadingStop(),
 *                                       invitationLink, hideInviteButton()
 *   window.CrazyGames.SDK.leaderboard — leaderboards: submitScore(), etc.
 */
export default function CrazyGamesSDKLoader() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    // The SDK only initializes correctly on CrazyGames domains.
    const onCrazy = host.includes("crazygames.com") || host.includes("1001games");
    if (!onCrazy) return;
    if ((window as any).CrazyGames) return;

    const s = document.createElement("script");
    s.src = "https://sdk.crazygames.com/crazygames-sdk-v3.js";
    s.async = true;
    s.onload = () => {
      // Signal CrazyGames that the game has finished loading.
      try {
        (window as any).CrazyGames?.SDK?.game?.sdkGameLoadingStop?.();
        (window as any).CrazyGames?.SDK?.game?.gameplayStart?.();
      } catch {
        // ignore — optional calls
      }
    };
    document.head.appendChild(s);
  }, []);
  return null;
}
