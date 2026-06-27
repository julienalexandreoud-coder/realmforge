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

---
Task ID: 10-18
Agent: main
Task: Redesign into authentic pixel-art infinite city-builder (REALMFORGE)

Work Log:
- Generated pixel-art logo (realmforge-logo.png, 1344x768) + icon (realmforge-icon.png, 1024x1024) via image-generation skill
- Rewrote types.ts: infinite city model (builtCount, activeProgress, cumulativeIncome, biomes, themes, perm boosts)
- Rewrote config.ts: 8 hand-crafted pixel biomes (plains/forest/desert/snow/volcano/sky/space/void) with sky gradients, ground, decorations; 16 building sprites as ASCII pixel grids with palettes (cottage, windmill, barn, treehouse, lodge, pyramid, oasis, igloo, icecastle, forge, obsidian, cloudhall, balloon, rocket, dome, crystaltower, riftgate); 7 upgrades; 16 achievements; deterministic per-plot generation (seededRand) for infinite world
- Rewrote engine.ts: tap→build progress, tapCoins, completeBonus, buildingIncome scaling, relicMultiplier (+5%/relic), ascension math, offline earnings
- Rewrote gameStore.ts: tap() advances construction + completes buildings (chains), auto-builder tick, passive income, ascend() prestige reset, daily streak, rewarded ads, leaderboard sync
- Rewrote GameCanvas.tsx: pixel-art renderer — imageSmoothingEnabled=false, integer math, sky gradients per biome, parallax mountains, pixel buildings from sprite grids, construction animation (building rises from ground + scaffolding), progress bar, hammer bonk, square-pixel particles, pixel-font floating numbers, combo meter, camera auto-follow + drag-to-scroll, stars/sun per biome
- Added pixel fonts: Press Start 2P (headings) + VT323 (body) via next/font; .font-pixel utility; image-rendering:pixelated globally
- Restyled all panels to pixel theme: chunky 2px borders, no rounded corners, pixel font labels, square buttons
- Renamed currencies: shards→coins 🪙, prisms→relics 🏺; crystal→build target; reforge→ascend; skins→themes
- Updated layout.tsx (pixel fonts, favicon=icon, OG image=logo), globals.css (pixel font util, pixelated images, square scrollbars)
- Fixed 2 bugs: ASCEND_THRESHOLD→ASCENSION_THRESHOLD naming; missing OFFLINE_CAP_MS import
- Verified with Agent Browser: name dialog → 31 taps built 5 buildings (combo 30, 42/sec income) → bought Hammer+Income upgrades → claimed Day 1 streak → watched Golden Age ad (3× for 59s) → rapid build to 28 buildings crossing all 8 biomes (maxBiome=7 Void, camera scrolled 1502px) → ascended (gained 11 relics, reset to 0, ascension=1, Reborn achievement +2000)
- VLM (3 checks): "cohesive retro pixel art, not AI-generic, no glitches", "polished indie pixel-art game, avoids AI-generated stiffness", mobile layout usable, ascend panel clear
- Console: zero errors; lint: clean

Stage Summary:
- REALMFORGE is a fully reworked authentic pixel-art infinite city-builder.
- Every tap visibly builds a pixel structure (rises from ground with scaffolding + progress bar); completing a building bursts particles, awards coins, and the city grows.
- Infinite: world generates deterministically forever across 8 cycling biomes (16 unique pixel buildings); camera auto-follows + drag-to-pan; prestige (Ascend) resets for permanent Relics (+5% each) → truly infinite progression.
- Pixel authenticity: hand-drawn ASCII sprite grids, limited per-biome palettes, Press Start 2P + VT323 fonts, crisp pixelated rendering, chiptune Web Audio.
- Monetization retained: 3 rewarded-ad placements + Relics shop (themes + perm boosts).

---
Task ID: 19-30 (30-min play→improve loop)
Agent: main
Task: Make game much harder + unify dark-navy theme + run 30-min play-improve loop

Work Log (loop iterations):
- Restyled all 8 biomes to dark navy palettes (sky/ground) matching the panel aesthetic
- Added themeTint() in GameCanvas: mutes building sprite colors toward navy, preserves glow accents (fire/gold/neon); added navy vignette overlay to unify world with UI
- Hardened balance: cost 25*1.55^index (very steep), combo 0.03/max2.8x (was 0.05/4x), hammer 0.6/lvl (was 0.9), completeBonus LINEAR 5+idx*0.5 (was exp 3*1.14^idx), tapCoins sqrt scaling (was linear), ascension threshold 20M (was 25k→2M), income growth 1.08 (was 1.12→1.10), relic +3% (was +5%), surge 2.5x/45s (was 3x/60s)
- Built auto-play harness (7 taps/sec + smart spread upgrade buying) injected via agent-browser, sampling state every 2s

Bugs found & fixed during loop:
1. CHAIN-COMPLETION EXPLOIT: while(progress>=1) loop awarded multiple exponential completeBonuses per tap → capped to 1 completion/tap, discard overflow (in both tap() and tick())
2. EXPONENTIAL completeBonus (3*1.14^index) caused runaway to 1e108 coins → made LINEAR (5+index*0.5)
3. tapCoins scaled linearly with builtCount (188/tap at built=1876) → sqrt scaling
4. "allBiomes" achievement gave 20,000 coins at built=8 (first void biome cycle) → instant early-game explosion → reduced to 3,000 at built=24
5. Debug code used `window` which was shadowed by a local `const window = comboWindowMs(s)` → TypeError crashing tap() → removed debug, used globalThis
6. Stale save keys (v2/v3) caused reading leftover exploded data → bumped to v4

Final measured balance (20s @ 7tps, smart buying): 38 buildings, 9,666 coins, 285/s income, 0 relics eligible. Ascension (20M) ≈ 11+ hours of continuous hard tapping → appropriately HARD (was "passed in 1 minute").
VLM: dark-navy theme confirmed, "long-term grind game" feel.

Stage Summary:
- Game is now HARD: first ascension takes hours (not 1 minute).
- Economy is STABLE: no more exponential explosions (chain-completion + exp-bonus + achievement + linear-tapCoins bugs all fixed).
- Visual theme unified: dark navy world + pixel buildings tinted to match the sleek dark UI panel (cyan/purple/orange/gold accents).
- 4 major balance bugs caught only by the automated play loop.

---
Task ID: 31
Agent: main
Task: Make buildings taller and more city-like

Work Log:
- Replaced all 16 hand-drawn building sprites with a procedural `buildTower()` generator that produces tall multi-story towers: roof section (flat/spire/pyramid/antenna/dome) + N floors (each = lit-window row + wall band) + base with door
- Towers are 12 cells wide × 13-21 rows tall (was ~9×6-11), with 3 window bays per floor and ~43% deterministic lit windows (glow accent per biome: amber/emerald/cyan/orange/white/magenta)
- Bumped render pixel scale from 4→5 in drawBuilding & drawConstruction so towers are 60px wide (fill the 64px plot edge-to-edge → wall-to-wall skyline) and up to ~100px tall
- Added window twinkle: lit windows occasionally flash white based on time+position sin → city feels alive
- Rewrote drawParallax: replaced single mountain layer with a 2-layer distant city skyline (parallax 0.5 jagged silhouettes with window glints + 0.25 haze layer) for depth behind the built towers
- Kept dark-navy themeTint (dark walls muted to navy, glow windows preserved) so city matches the sleek UI
- VLM verified: tall multi-story towers, lit windows, wall-to-wall continuous city, distant skyline silhouette, "looks like a pixel-art city rather than scattered cottages"

Stage Summary:
- Buildings are now tall city towers with lit windows forming a continuous wall-to-wall skyline, plus a distant parallax skyline backdrop for depth. The world reads clearly as a pixel-art CITY at night, matching the dark-navy UI theme.

---
Task ID: 32
Agent: main
Task: Fix broken auto-builder + add clickable coin bonuses

Work Log:
- ROOT CAUSE of broken auto-builder: the game tick was tied to the canvas's requestAnimationFrame loop, which stops when the tab is backgrounded or the canvas isn't actively rendering. Moved the tick to a persistent setInterval (100ms) in the store's init(), guarded by a window flag so only one interval ever exists. Removed the page.tsx duplicate interval (it was getting torn down by HMR).
- Second bug: the periodic localStorage save in tick used `(get()).__lastSave` which started as `undefined` → `now - undefined = NaN` → `NaN > 2000 = false` → save never ran. Fixed with `|| 0` default + proper `set({__lastSave})`.
- Auto-builder formula fix: was `l * 0.35` (flat fraction/sec → ~3s per building regardless of cost, inconsistent with steep 1.55^index cost curve). Changed to `l * 0.03` (3%/level/sec of the current building) → scales naturally with cost. Level 1 = 3%/s (~33s), level 5 = 15%/s (~7s), level 20 = 60%/s (~1.7s).
- Added clickable coin bonuses: floating 🪙 (65%, small) / 💎 (27%, 5× value) / ⭐ (8%, 25× value) icons spawn every 6-14s, drift upward, expire after 5-8s. Clicking gives bonus coins (scales with city size sqrt + relic mult), plays coin SFX, spawns particle burst + floating number. Rendered as DOM overlay (BonusOverlay.tsx) with pulsing ring + glow halo + value label.
- Bumped save to v5 (auto-builder formula changed).
- Verified: auto-builder level 2 → coins grew 1033→1656, buildings 7→9, progress 0.28→0.95 in 8s idle. Bonus click → +2079 coins (23570→25649).

Stage Summary:
- Auto-builder now works persistently (setInterval game loop, independent of canvas RAF). Percentage-based scaling makes it always useful.
- Clickable coin/gem/star bonuses appear on screen every 6-14s — tap them for bonus coins. Adds active engagement between building taps.

---
Task ID: 33
Agent: main
Task: Nerf auto-builder further + fix invisible coin bonuses

Work Log:
- NERFED AUTO-BUILDER: reduced from 3%/level/s to 0.8%/level/s (level 1 = 0.8%/s = 125s per building, was 17s). Raised base cost 250→300, cost growth 1.30→1.35, max level 150→100. Now a supplement, not a replacement for tapping.
- FIXED INVISIBLE BONUSES (multiple bugs):
  1. z-index: overlay was z-20 (behind HUD z-30) → bumped to z-45 (above HUD, below modals z-50)
  2. Bonus coordinates were NaN: the Zustand store module wasn't re-evaluating on HMR, so stale spawn code kept running. Fixed by adding NaN guards in the BonusOverlay component itself (isFinite check → fallback to visible spread positions)
  3. onClick vs onPointerDown: bonus buttons used onPointerDown which didn't fire on .click() → added onClick handler
  4. Spawn frequency: was 6-14s → now 3-6s so there's almost always one visible
  5. Bonus lifetime: extended to 8-12s (was 5-8s)
  6. Position clamping: added bounds in aging code so bonuses never drift off-screen
- Verified: 3 bonuses visible at x:131/211/290, all on-screen. VLM confirms "floating glowing coin bonuses visible on the left side, each marked with +44"
- Verified: clicking bonus gives coins (0→13→44 per click)

Stage Summary:
- Auto-builder is now much weaker (0.8%/s at level 1 = ~2min per building).
- Coin bonuses (🪙/💎/⭐) now reliably appear on screen every 3-6s, are clearly visible (z-45, pulsing ring, glow), and clickable for bonus coins.
