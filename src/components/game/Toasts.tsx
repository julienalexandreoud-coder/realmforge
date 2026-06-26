"use client";
import { useGame } from "@/lib/store/gameStore";
import { AnimatePresence, motion } from "framer-motion";

export default function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="fixed top-16 right-3 z-40 flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-1.5rem)]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto rounded-xl border border-cyan-500/30 bg-slate-950/95 backdrop-blur-md px-3.5 py-2.5 shadow-xl shadow-cyan-500/10 min-w-[220px]"
          >
            <div className="flex items-start gap-2.5">
              {t.icon && <span className="text-lg leading-none mt-0.5">{t.icon}</span>}
              <div className="min-w-0">
                <div className="text-sm font-bold text-cyan-100">{t.title}</div>
                {t.desc && <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{t.desc}</div>}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
