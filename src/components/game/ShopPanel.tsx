"use client";
import { useGame } from "@/lib/store/gameStore";
import { SKINS, SHOP_ITEMS } from "@/lib/game/config";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatNumber } from "@/lib/game/engine";
import { Check } from "lucide-react";
import type { SkinId } from "@/lib/game/types";

export default function ShopPanel() {
  const prisms = useGame((s) => s.prisms);
  const ownedSkins = useGame((s) => s.ownedSkins);
  const activeSkin = useGame((s) => s.activeSkin);
  const buy = useGame((s) => s.buyShopItem);
  const setSkin = useGame((s) => s.setSkin);
  const watchAd = useGame((s) => s.watchAd);
  const pushToast = useGame((s) => s.pushToast);

  const skinItems = (Object.keys(SKINS) as SkinId[]).map((id) => SKINS[id]);
  const permBoosts = SHOP_ITEMS.filter((i) => ["tapBoostPerm", "autoBoostPerm", "startCombo"].includes(i.id));

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {/* Prism currency — earn via rewarded ad */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-fuchsia-300 mb-2">Prisms 🔮</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => watchAd("combo")}
              className="rounded-xl border border-fuchsia-500/30 bg-slate-900/60 p-3 hover:bg-slate-800/70 transition text-left"
            >
              <div className="text-xl mb-1">📺</div>
              <div className="font-semibold text-sm">+5 Prisms</div>
              <div className="text-[10px] text-slate-400">Watch a short ad</div>
            </button>
            <button
              onClick={() => {
                // simulate: grant prisms directly as a "rewarded" action
                useGame.setState((s) => ({ prisms: s.prisms + 20 }));
                pushToast({ title: "+20 Prisms!", desc: "Rewarded ad completed.", icon: "🔮" });
                useGame.getState()._save();
              }}
              className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 hover:bg-amber-500/10 transition text-left"
            >
              <div className="text-xl mb-1">🎬</div>
              <div className="font-semibold text-sm">+20 Prisms</div>
              <div className="text-[10px] text-slate-400">Long rewarded ad</div>
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            Prisms are the premium currency — earned by reforging (prestige) or rewarded ads. They give a permanent +2% global boost each.
          </p>
        </section>

        {/* Permanent boosts */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">Permanent Boosts</h3>
          <div className="space-y-2">
            {permBoosts.map((item) => {
              const owned = !!(useGame.getState() as any)[`perm_${item.id}`];
              const afford = prisms >= item.cost;
              return (
                <button
                  key={item.id}
                  onClick={() => buy(item.id)}
                  disabled={owned}
                  className={`w-full text-left rounded-xl border p-3 transition ${
                    owned
                      ? "border-emerald-500/30 bg-emerald-500/5 cursor-default"
                      : afford
                      ? "border-amber-500/30 bg-slate-900/60 hover:bg-slate-800/70"
                      : "border-slate-800 bg-slate-900/40 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 grid place-items-center rounded-lg bg-slate-800 text-lg">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{item.name}</div>
                      <div className="text-[11px] text-slate-400 leading-snug">{item.desc}</div>
                    </div>
                    {owned ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-xs font-bold">
                        <Check className="w-4 h-4" /> OWNED
                      </span>
                    ) : (
                      <span className={`text-sm font-bold ${afford ? "text-fuchsia-300" : "text-rose-400"}`}>
                        🔮 {item.cost}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Skins */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2">Crystal Skins</h3>
          <div className="grid grid-cols-2 gap-2">
            {skinItems.map((skin) => {
              const owned = ownedSkins.includes(skin.id);
              const active = activeSkin === skin.id;
              const afford = prisms >= skin.cost;
              return (
                <button
                  key={skin.id}
                  onClick={() => (owned ? setSkin(skin.id) : skin.cost > 0 ? buy(`skin${skin.id[0].toUpperCase()}${skin.id.slice(1)}` as any) : setSkin(skin.id))}
                  className={`rounded-xl border p-3 transition text-left relative overflow-hidden ${
                    active
                      ? "border-cyan-400 bg-cyan-500/10"
                      : owned
                      ? "border-slate-700 bg-slate-900/60 hover:border-slate-500"
                      : afford
                      ? "border-slate-700 bg-slate-900/60 hover:border-cyan-500/50"
                      : "border-slate-800 bg-slate-900/40 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-6 h-6 rounded-full shadow-lg"
                      style={{
                        background:
                          skin.core === "rainbow"
                            ? "conic-gradient(from 0deg, #f00, #f80, #ff0, #0f0, #08f, #80f, #f0f, #f00)"
                            : `radial-gradient(circle at 35% 35%, ${skin.facet}, ${skin.core} 50%, ${skin.glow})`,
                        boxShadow: `0 0 14px ${skin.glow === "rainbow" ? "#a855f7" : skin.glow}`,
                      }}
                    />
                    <span className="font-semibold text-sm">{skin.name}</span>
                  </div>
                  {active ? (
                    <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                      <Check className="w-3 h-3" /> EQUIPPED
                    </span>
                  ) : owned ? (
                    <span className="text-[11px] text-slate-400">Tap to equip</span>
                  ) : skin.cost === 0 ? (
                    <span className="text-[11px] text-emerald-400">FREE</span>
                  ) : (
                    <span className={`text-[11px] font-bold ${afford ? "text-fuchsia-300" : "text-rose-400"}`}>
                      🔮 {skin.cost}
                    </span>
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
