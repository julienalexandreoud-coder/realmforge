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
      <DialogContent className="border-2 border-cyan-700 bg-slate-950" showCloseButton={false}>
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <img
              src="/realmforge-logo.png"
              alt="REALMFORGE"
              className="w-full max-w-xs"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          <DialogTitle className="font-pixel text-base text-center text-cyan-200 drop-shadow-[2px_2px_0_#000]">
            FORGE YOUR REALM
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-center">
            Pick a name to claim your spot on the global ranks. Tap the world to build an endless pixel kingdom.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. RealmKing"
            maxLength={18}
            className="bg-slate-900 border-2 border-slate-700 text-slate-100 font-pixel text-sm"
          />
          <Button
            onClick={submit}
            disabled={!val.trim()}
            className="w-full border-2 border-cyan-400 bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:brightness-110 text-white font-pixel text-xs py-6"
          >
            START BUILDING →
          </Button>
          <p className="font-pixel text-[8px] text-slate-500 text-center">
            PROGRESS SAVES TO THIS DEVICE
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
