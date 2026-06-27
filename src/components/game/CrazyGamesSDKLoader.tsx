"use client";
import { useEffect } from "react";

/**
 * Loads the CrazyGames SDK script ONLY when the game is actually hosted on
 * CrazyGames. In dev/standalone the SDK is never loaded, avoiding console
 * errors from the SDK trying to initialize on a non-CrazyGames domain.
 */
export default function CrazyGamesSDKLoader() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    const onCrazy = host.includes("crazygames.com") || host.includes("1001games");
    if (!onCrazy) return;
    // Already loaded?
    if ((window as any).CrazyGames) return;
    const s = document.createElement("script");
    s.src = "https://sdk.crazygames.com/crazygames-sdk-v3.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);
  return null;
}
