"use client";
import { useGame } from "@/lib/store/gameStore";
import { AnimatePresence, motion } from "framer-motion";

export default function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="fixed top-16 right-2 z-40 flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-1rem)]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto border-2 border-cyan-700 bg-slate-950/95 px-3 py-2 min-w-[200px]"
          >
            <div className="flex items-start gap-2">
              {t.icon && <span className="text-base leading-none mt-0.5">{t.icon}</span>}
              <div className="min-w-0">
                <div className="font-pixel text-[9px] text-cyan-100">{t.title}</div>
                {t.desc && <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{t.desc}</div>}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
