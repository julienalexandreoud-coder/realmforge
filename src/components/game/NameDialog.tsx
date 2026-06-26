"use client";
import { useState } from "react";
import { useGame } from "@/lib/store/gameStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NameDialog() {
  const open = useGame((s) => !s.playerName);
  const setName = useGame((s) => s.setName);
  const [val, setVal] = useState("");

  const submit = () => {
    if (val.trim()) setName(val);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="bg-slate-950 border-cyan-500/30" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
            Welcome, Smasher!
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Pick a name to claim your spot on the global leaderboard. Your progress saves automatically to this device.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. CrystalKing"
            maxLength={18}
            className="bg-slate-900 border-slate-700 text-slate-100 text-lg"
          />
          <Button
            onClick={submit}
            disabled={!val.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:opacity-90 text-white font-bold py-6 text-base"
          >
            Start Smashing →
          </Button>
          <p className="text-[11px] text-slate-500 text-center">
            You can change this anytime via the reset button.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
