# Project Worklog — PRISM SMASH (CrazyGames-style clicker)

## Research (Task ID: 1)
Agent: main
Task: Research CrazyGames top games + monetization + addictive mechanics

Findings:
- Top CrazyGames genre = Clicker/Idle (The MachinEGG, Gear Factory, Crusher Clicker, Block Wall Destroyer, Farm Ring Idle)
- Other popular: .io games, physics/throw, driving, shooting, puzzle
- Monetization: ad revenue share (40% non-exclusive → 60% exclusive), rewarded ads (watch ad = boost), IAP (selected games), sponsorships
- CrazyGames SDK: `CrazySDK.adRequest('rewarded')` for rewarded ads
- Reach 20M+ monthly players, instant HTML5 play
- Addictive hooks: number-go-up, combos, crits, idle/auto income, prestige (reset for permanent multiplier), daily streaks, leaderboards, achievements, juice (particles + floating numbers + sound), one-tap controls

Decision: Build "PRISM SMASH" — neon clicker/idle hybrid.
Core: tap crystal → shards; combos (up to 10x); crits; crystal levels up; spend shards on upgrades (tap power, auto-tapper, crit, etc.); prestige "Reforge" for Prisms (permanent multiplier); daily streak; global leaderboard (Prisma); achievements; rewarded ads (Power Surge 3x/60s, double offline, revive combo) simulated with SDK-ready integration; premium shop for Prisms/cosmetics.

Tech: Next.js 16 App Router, canvas 2D for crystal+particles, Zustand store, Web Audio (synthesized sfx, no asset files), localStorage save, Prisma (SQLite) for leaderboard.

---
Task ID: 4-9
Agent: main
Task: Build, wire up, and verify the full PRISM SMASH game

Work Log:
- Updated prisma/schema.prisma with LeaderboardEntry model; ran db:push
- Created src/lib/game/{types,config,engine,audio,save}.ts (game data layer)
- Created src/lib/store/gameStore.ts (Zustand store: taps, combos, crits, auto-tapper, prestige, daily streak, surge, achievements, leaderboard sync, offline earnings)
- Created src/app/api/leaderboard/route.ts (GET top 100 + POST upsert with max-semantics)
- Created components: GameCanvas (canvas2D crystal+particles+floaters), ScoreHud, UpgradePanel, ShopPanel, PrestigePanel, Leaderboard, Achievements, RewardedAdModal, DailyStreak, NameDialog, Toasts, GameFooter
- Wired src/app/page.tsx (layout: HUD / canvas+tabbed panel / sticky footer)
- Set dark theme + game metadata in layout.tsx; custom scrollbars in globals.css
- Fixed 2 lint errors (setState-in-effect) via key-remount + removing unused state
- Verified with Agent Browser: name dialog → tap crystal (12 taps → level 2, combo 12, 70 shards) → buy Tap Power → claim Day 1 streak (200 shards) → watch rewarded ad (5s countdown → claim → Power Surge 3x active 59s) → leaderboard API GET/POST working → all 5 tabs render → "(you)" highlight on leaderboard
- VLM confirmed visuals: crystal glow+cracks, clean layout, no overlaps/cutoffs, "fun and juicy"
- Canvas pixel sampling confirmed crystal renders (white center sparkle, cyan body)
- Console: zero errors; lint: clean

Stage Summary:
- PRISM SMASH is fully functional and browser-verified.
- Core loop: tap crystal → shards + combos + crits → crystal levels up → buy 7 upgrades → auto-drill idle income → reforge (prestige) for Prisms (+2% global each) → daily streak → 16 achievements → global leaderboard (Prisma/SQLite).
- Monetization (CrazyGames-style): 3 rewarded-ad placements (Power Surge 3x/60s, double offline, combo restore) + premium Prisms shop (skins, perm boosts) — simulated ad modal with SDK-ready integration points.
- Retention hooks: daily 7-day streak, prestige, achievements, leaderboard, offline earnings, combos.
- Juice: canvas particles, floating crit numbers, crystal shake/scale/cracks, synthesized Web Audio sfx + ambient music, framer-motion toasts.
