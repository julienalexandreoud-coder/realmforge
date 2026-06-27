"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function LegalModal() {
  const [open, setOpen] = useState<null | "tc" | "pp">(null);

  // expose a global hook so the footer button can open it
  useEffect(() => {
    (window as any).__openLegal = (which: "tc" | "pp") => setOpen(which);
    return () => { delete (window as any).__openLegal; };
  }, []);

  return (
    <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
      <DialogContent className="bg-slate-950 border-cyan-700 max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-xs text-cyan-200">
            {open === "tc" ? "TERMS & CONDITIONS" : "PRIVACY POLICY"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {open === "tc" ? <TermsContent /> : <PrivacyContent />}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function TermsContent() {
  return (
    <div className="text-[12px] text-slate-300 space-y-3 leading-relaxed">
      <h3 className="font-pixel text-[10px] text-cyan-300">Terms &amp; Conditions</h3>
      <p>By playing REALMFORGE, you agree to the following terms:</p>
      <p><strong className="text-slate-100">1. Free to Play.</strong> REALMFORGE is free to play. Optional rewarded video ads may be shown to grant in-game bonuses. These ads are provided by CrazyGames and follow their advertisement policies.</p>
      <p><strong className="text-slate-100">2. No Real-Money Purchases.</strong> All in-game currencies (Coins, Relics) are virtual and have no real-world monetary value. They cannot be purchased, sold, or transferred.</p>
      <p><strong className="text-slate-100">3. Progress Saves Locally.</strong> Your game progress is stored in your browser's local storage. Clearing browser data will reset your progress. We are not responsible for lost progress.</p>
      <p><strong className="text-slate-100">4. Age Requirement.</strong> This game is suitable for all ages. If you are under 13, please ask a parent or guardian before watching ads.</p>
      <p><strong className="text-slate-100">5. Acceptable Use.</strong> You agree not to cheat, hack, exploit bugs, or use automated tools to gain unfair advantage. Violations may result in progress reset.</p>
      <p><strong className="text-slate-100">6. Content.</strong> All game content (art, code, audio) is original work owned by the developer. You may not copy, redistribute, or reverse-engineer the game.</p>
      <p><strong className="text-slate-100">7. Changes.</strong> We may update these terms at any time. Continued play constitutes acceptance of the updated terms.</p>
      <p className="text-slate-500 text-[10px] pt-2">Last updated: June 2026. REALMFORGE is an independent game.</p>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="text-[12px] text-slate-300 space-y-3 leading-relaxed">
      <h3 className="font-pixel text-[10px] text-cyan-300">Privacy Policy</h3>
      <p>REALMFORGE respects your privacy. Here's what we collect and don't collect:</p>
      <p><strong className="text-slate-100">1. No Personal Data.</strong> REALMFORGE does not collect, store, or transmit any personal information. No email, no name, no IP address is stored by us.</p>
      <p><strong className="text-slate-100">2. Local Storage Only.</strong> Your game progress, settings, and leaderboard scores are stored locally in your browser (localStorage). This data never leaves your device.</p>
      <p><strong className="text-slate-100">3. Player Name.</strong> The name you enter is stored only in your browser and used to display your rank on the local leaderboard. It is not sent to any server.</p>
      <p><strong className="text-slate-100">4. Advertisements.</strong> Rewarded video ads are served by CrazyGames. CrazyGames may use cookies and similar technologies to serve relevant ads. See <a href="https://www.crazygames.com/privacy" target="_blank" rel="noopener" className="text-cyan-400 underline">CrazyGames Privacy Policy</a> for details on their data practices.</p>
      <p><strong className="text-slate-100">5. No Tracking.</strong> We do not use analytics, tracking pixels, or third-party trackers. We do not profile users.</p>
      <p><strong className="text-slate-100">6. Children's Privacy.</strong> The game is suitable for all ages. We do not knowingly collect data from anyone, including children.</p>
      <p><strong className="text-slate-100">7. Contact.</strong> For privacy questions, contact the developer via the CrazyGames developer portal.</p>
      <p className="text-slate-500 text-[10px] pt-2">Last updated: June 2026.</p>
    </div>
  );
}
