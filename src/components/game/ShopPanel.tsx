"use client";
import { useGame } from "@/lib/store/gameStore";
import { THEMES } from "@/lib/game/config";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";
import type { ThemeId } from "@/lib/game/types";

const PERM_ITEMS = [
  { id: "tapBoostPerm", name: "Tempered Hammer", desc: "Permanent +50% tap & build power.", icon: "🗡️", cost: 30 },
  { id: "autoBoostPerm", name: "Master Apprentice", desc: "Permanent +50% auto-builder speed.", icon: "🔧", cost: 30 },
  { id: "incomeBoostPerm", name: "Royal Treasury", desc: "Permanent +50% building income.", icon: "👑", cost: 35 },
];

export default function ShopPanel() {
  const relics = useGame((s) => s.relics);
  const ownedThemes = useGame((s) => s.ownedThemes);
  const activeTheme = useGame((s) => s.activeTheme);
  const buy = useGame((s) => s.buyShopItem);
  const setTheme = useGame((s) => s.setTheme);
  const watchAd = useGame((s) => s.watchAd);
  const pushToast = useGame((s) => s.pushToast);
  const perm = useGame((s) => s.perm);

  const themeList = (Object.keys(THEMES) as ThemeId[]).map((id) => THEMES[id]);

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {/* Earn relics */}
        <section>
          <h3 className="font-pixel text-[10px] text-fuchsia-300 mb-2">◆ RELICS 🏺</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => watchAd("combo")}
              className="border-2 border-fuchsia-700 bg-slate-900/70 p-2.5 hover:bg-slate-800 active:translate-y-0.5 transition text-left"
            >
              <div className="text-lg mb-0.5">📺</div>
              <div className="font-pixel text-[9px]">+5 RELICS</div>
              <div className="text-[10px] text-slate-400">watch a short ad</div>
            </button>
            <button
              onClick={() => {
                useGame.setState((s) => ({ relics: s.relics + 20 }));
                pushToast({ title: "+20 Relics!", desc: "Rewarded ad completed.", icon: "🏺" });
                useGame.getState()._save();
              }}
              className="border-2 border-amber-600 bg-amber-950/30 p-2.5 hover:bg-amber-950/50 active:translate-y-0.5 transition text-left"
            >
              <div className="text-lg mb-0.5">🎬</div>
              <div className="font-pixel text-[9px]">+20 RELICS</div>
              <div className="text-[10px] text-slate-400">long rewarded ad</div>
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
            Relics = premium currency. Earned by ascending or watching ads. Each gives +5% to ALL production forever.
          </p>
        </section>

        {/* Permanent boosts */}
        <section>
          <h3 className="font-pixel text-[10px] text-amber-300 mb-2">◆ PERMANENT BOOSTS</h3>
          <div className="space-y-2">
            {PERM_ITEMS.map((item) => {
              const owned = !!perm[item.id];
              const afford = relics >= item.cost;
              return (
                <button
                  key={item.id}
                  onClick={() => buy(item.id)}
                  disabled={owned}
                  className={`w-full text-left border-2 p-2.5 transition ${
                    owned
                      ? "border-emerald-600 bg-emerald-950/30 cursor-default"
                      : afford
                      ? "border-amber-700 bg-slate-900/70 hover:bg-slate-800 active:translate-y-0.5"
                      : "border-slate-800 bg-slate-950/50 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 grid place-items-center border-2 border-slate-700 bg-slate-800 text-lg">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-pixel text-[10px]">{item.name}</div>
                      <div className="text-[11px] text-slate-400 leading-snug">{item.desc}</div>
                    </div>
                    {owned ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-pixel text-[9px]">
                        <Check className="w-3.5 h-3.5" /> OWNED
                      </span>
                    ) : (
                      <span className={`font-pixel text-[11px] ${afford ? "text-fuchsia-300" : "text-rose-400"}`}>🏺 {item.cost}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Themes */}
        <section>
          <h3 className="font-pixel text-[10px] text-cyan-300 mb-2">◆ REALM THEMES</h3>
          <div className="grid grid-cols-2 gap-2">
            {themeList.map((th) => {
              const owned = ownedThemes.includes(th.id);
              const active = activeTheme === th.id;
              const afford = relics >= th.cost;
              return (
                <button
                  key={th.id}
                  onClick={() => (owned ? setTheme(th.id) : th.cost > 0 ? buy(`theme${th.id}`) : setTheme(th.id))}
                  className={`border-2 p-2.5 transition text-left relative overflow-hidden ${
                    active
                      ? "border-cyan-400 bg-cyan-950/40"
                      : owned
                      ? "border-slate-700 bg-slate-900/70 hover:border-slate-500"
                      : afford
                      ? "border-slate-700 bg-slate-900/70 hover:border-cyan-600"
                      : "border-slate-800 bg-slate-950/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-5 h-5 border-2 border-slate-900"
                      style={{ background: th.tint, boxShadow: `0 0 8px ${th.tint}` }}
                    />
                    <span className="font-pixel text-[9px]">{th.name}</span>
                  </div>
                  {active ? (
                    <span className="font-pixel text-[8px] text-cyan-300 flex items-center gap-1">
                      <Check className="w-3 h-3" /> ACTIVE
                    </span>
                  ) : owned ? (
                    <span className="text-[10px] text-slate-400">tap to use</span>
                  ) : th.cost === 0 ? (
                    <span className="font-pixel text-[8px] text-emerald-400">FREE</span>
                  ) : (
                    <span className={`font-pixel text-[9px] ${afford ? "text-fuchsia-300" : "text-rose-400"}`}>🏺 {th.cost}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}
