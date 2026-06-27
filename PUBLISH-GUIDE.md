# 📥 How to Download & Publish REALMFORGE

This guide walks you through downloading the game from this sandbox,
testing it, and publishing it on CrazyGames.

---

## Part 1 — Download the game from this sandbox

You have **3 options**, easiest first.

### ✅ Option A: Download the ready-to-publish ZIP (fastest)

A finished, CrazyGames-ready build is already sitting in the project root:

> **`realmforge-crazygames.zip`** (≈ 1.8 MB)

This zip contains the full static HTML5 build (`index.html` + assets).
**Download it directly** using the file browser on the left of this
sandbox (it's in the project root folder `/home/z/my-project/`).

That's the file you upload to CrazyGames — no build step needed.

### 🛠 Option B: Clone from GitHub (recommended for future edits)

The full source code is on GitHub:

```bash
git clone https://github.com/julienalexandreoud-coder/realmforge.git
cd realmforge
bun install          # or: npm install
```

Then build the static game yourself:

```bash
bun run build:static
```

→ produces an `out/` folder. Zip it and upload:

```bash
cd out
zip -r ../realmforge-crazygames.zip .
cd ..
```

### 🧪 Option C: Run it locally first (to test)

```bash
git clone https://github.com/julienalexandreoud-coder/realmforge.git
cd realmforge
bun install
bun run dev          # opens at http://localhost:3000
```

---

## Part 2 — Publish on CrazyGames (step by step)

1. **Go to** 👉 https://developer.crazygames.com
2. **Sign in** (or create a free developer account).
3. Click **"Submit Game"** → **"HTML5"**.
4. **Upload** the `realmforge-crazygames.zip` file.
5. **Fill in the details** (copy-paste these):

   | Field | Value |
   |-------|-------|
   | **Title** | `REALMFORGE` |
   | **Description** | `Tap to forge an endless pixel-art city across 8 dark biomes. Build combos, click coin bonuses, and Ascend for permanent power. A hard, addictive clicker that takes hours to master.` |
   | **Tags** | `clicker`, `idle`, `pixel art`, `city builder`, `incremental` |
   | **Category** | Clicker / Idle |
   | **Controls** | Mouse / Touch (tap) |
   | **Orientation** | Landscape |
   | **Resolution** | Responsive |

6. **Upload art assets** (all in the `public/` folder, also on GitHub):
   - **Icon** → `realmforge-icon.png`
   - **Cover banner** → `realmforge-banner.png`
   - **Screenshots** → `screenshot-1-gameplay.png`, `screenshot-2-shop.png`,
     `screenshot-3-ascend.png`, `screenshot-4-quests.png`

7. **Submit for review.** Approval usually takes **2–7 days**.
   CrazyGames will email you when it's live.

---

## Part 3 — How the ads work (already built in)

The game has the **CrazyGames SDK v3** already integrated. You do **nothing** —
once the game is hosted on `crazygames.com`, the SDK auto-loads and your
ads start earning.

**3 rewarded-ad placements** are wired up:

| Placement | Trigger | Reward |
|-----------|---------|--------|
| ⚡ Power Surge | "Free Golden Age" button (footer) | 3× everything for 45s |
| 📦 Offline Double | Auto on return after being away | Double offline coins |
| 🔥 Combo Restore | "Combo Boost" button (footer) | Instant 30× combo |

The SDK call used (in `RewardedAdModal.tsx`):

```js
window.CrazyGames.SDK.ad.requestAd("rewarded", {
  adFinished: () => grantReward(),
  adError:    () => cancelReward(),
  adStarted:  () => muteAudio(),
});
```

**In dev** (this sandbox / localhost), the SDK is not loaded, so the game
shows a **simulated 5-second ad** instead — so you can test the full flow
without the real SDK.

---

## Part 4 — CrazyGames SDK reference (what's available)

The CrazyGames SDK v3 exposes these modules (only on `crazygames.com`):

| Module | What it does |
|--------|--------------|
| `SDK.ad.requestAd("rewarded", cb)` | Rewarded video ad (player opts in for a reward) |
| `SDK.ad.requestAd("midgame", cb)` | Midgame video ad (shown at natural breaks) |
| `SDK.banner.requestBanner(style)` | Display banner ad (728×90 / 300×250) |
| `SDK.ad.hasAdblock()` | Detect adblockers |
| `SDK.data.getUserData()` | Get CrazyGames user profile |
| `SDK.game.gameplayStart()` | Tell CrazyGames active gameplay started |
| `SDK.game.gameplayStop()` | Tell CrazyGames gameplay paused |
| `SDK.game.sdkGameLoadingStart/Stop()` | Loading screen signals |
| `SDK.game.invitationLink` | Get a link to invite friends |
| `SDK.leaderboard.*` | CrazyGames hosted leaderboards |

REALMFORGE currently uses **rewarded ads** (`SDK.ad.requestAd("rewarded")`)
and the loading signals (`sdkGameLoadingStop` + `gameplayStart`).

---

## ❓ Troubleshooting

**"Preview not loading"** — the dev server in this sandbox occasionally stops.
It's harmless; the static build (the zip) is what you upload to CrazyGames,
and that always works.

**"CrazySDK not initialized" error in dev** — that's expected; the SDK only
runs on CrazyGames. In dev the game uses a simulated ad. Once hosted on
CrazyGames, real ads play automatically.

**"My score isn't on the leaderboard"** — the leaderboard is **local** (stored
in your browser's localStorage), because CrazyGames doesn't allow external
database calls. Each player sees their own local ranking + 5 default rivals.

---

Need help? The full source + this guide live at:
https://github.com/julienalexandreoud-coder/realmforge
