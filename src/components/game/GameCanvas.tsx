"use client";
import { useEffect, useRef } from "react";
import { useGame } from "@/lib/store/gameStore";
import { biomeForIndex, buildingForPlot, PLOT_W, GROUND_H } from "@/lib/game/config";
import { surgeActive, surgeRemainingMs, formatNumber, totalIncome } from "@/lib/game/engine";
import type { BuildingDef, BiomeDef } from "@/lib/game/types";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 400, h: 400, dpr: 1 });
  const camRef = useRef(0); // smoothed camera
  const lastTickRef = useRef(0);
  const draggingRef = useRef(false);
  const lastDragXRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const ctx = canvas.getContext("2d")!;

    const render = (t: number) => {
      rafRef.current = requestAnimationFrame(render);
      const store = useGame.getState();
      const now = Date.now();
      if (now - lastTickRef.current > 100) {
        lastTickRef.current = performance.now();
        store.tick(now);
      }
      const { w, h, dpr } = sizeRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      // smooth camera toward active plot
      const targetCam = store.builtCount * PLOT_W - w * 0.35;
      camRef.current += (targetCam - camRef.current) * 0.06;
      if (Math.abs(camRef.current) < 0.5) camRef.current = 0;
      useGame.getState().setCameraX(camRef.current);
      const cam = camRef.current;

      // determine visible plot range
      const firstPlot = Math.max(0, Math.floor(cam / PLOT_W) - 1);
      const lastPlot = Math.floor((cam + w) / PLOT_W) + 1;

      // draw sky (use biome of the center plot)
      const centerPlot = Math.floor((cam + w / 2) / PLOT_W);
      const biome = biomeForIndex(Math.max(0, centerPlot));
      drawSky(ctx, w, h, biome, t);

      // draw parallax distant decorations
      drawParallax(ctx, w, h, cam, biome, t);

      // ground baseline
      const groundY = h - GROUND_H;
      // ground per-plot (biome may change across visible range)
      for (let p = firstPlot; p <= lastPlot; p++) {
        if (p < 0) continue;
        const b = biomeForIndex(p);
        const x = p * PLOT_W - cam;
        ctx.fillStyle = b.ground;
        ctx.fillRect(Math.floor(x), Math.floor(groundY), PLOT_W + 1, GROUND_H);
        // ground top highlight line
        ctx.fillStyle = b.groundDark;
        ctx.fillRect(Math.floor(x), Math.floor(groundY), PLOT_W + 1, 3);
        // ground texture dots
        ctx.fillStyle = b.groundDark;
        for (let i = 0; i < 4; i++) {
          const dx = (p * 7 + i * 13) % PLOT_W;
          ctx.fillRect(Math.floor(x + dx), Math.floor(groundY + 8 + (i % 2) * 6), 3, 2);
        }
      }

      // draw buildings/decorations per plot
      for (let p = firstPlot; p <= lastPlot; p++) {
        if (p < 0) continue;
        const b = biomeForIndex(p);
        const x = p * PLOT_W - cam;
        // decoration between plots (only on plots with no building, i.e. future plots, or sparse)
        if (p >= store.builtCount && p % 2 === 1) {
          drawDecoration(ctx, Math.floor(x + PLOT_W / 2), Math.floor(groundY), b);
        }

        if (p < store.builtCount) {
          // completed building (regenerate deterministically)
          const def = buildingForPlot(p);
          drawBuilding(ctx, Math.floor(x + PLOT_W / 2), Math.floor(groundY), def, 1, 1, b, t);
        } else if (p === store.builtCount) {
          // active construction
          const def = buildingForPlot(p);
          const progress = store.activeProgress;
          drawConstruction(ctx, Math.floor(x + PLOT_W / 2), Math.floor(groundY), def, progress, b, t, store.buildPulse);
          // progress bar
          drawProgressBar(ctx, Math.floor(x + PLOT_W / 2), Math.floor(groundY + GROUND_H + 8), progress, surgeActive(store));
          // "tap here" hint pulse for the very first building
          if (p === 0 && store.builtCount === 0) {
            const pulse = 0.5 + 0.5 * Math.sin(t / 300);
            ctx.globalAlpha = pulse;
            ctx.fillStyle = "#ffffff";
            pixelText(ctx, "TAP!", Math.floor(x + PLOT_W / 2), Math.floor(groundY - 16), 2, "center");
            ctx.globalAlpha = 1;
          }
        } else {
          // empty future plot marker
          ctx.fillStyle = "rgba(255,255,255,0.05)";
          ctx.fillRect(Math.floor(x + PLOT_W / 2 - 2), Math.floor(groundY - 2), 4, 4);
        }
      }

      // hammer cursor bonk at center-top of active plot
      const activeX = store.builtCount * PLOT_W - cam + PLOT_W / 2;
      const activeTopY = groundY - 60;
      if (store.hammerAnim > 0.05) {
        drawHammer(ctx, Math.floor(activeX), Math.floor(activeTopY - 20 - (1 - store.hammerAnim) * 30), store.hammerAnim);
      }

      // particles (square pixels)
      for (const p of store.particles) {
        const a = Math.max(0, 1 - p.life / p.maxLife);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.ceil(p.size), Math.ceil(p.size));
      }
      ctx.globalAlpha = 1;

      // floating numbers (pixel font)
      for (const f of store.floatingNumbers) {
        const age = performance.now() - f.born;
        const a = Math.max(0, 1 - age / 900);
        ctx.globalAlpha = a;
        const txt = `+${formatNumber(f.value)}${f.crit ? "!" : ""}`;
        pixelText(ctx, txt, Math.floor(f.x), Math.floor(f.y), f.crit ? 2 : 1.5, "center", f.crit ? "#ffd700" : "#ffe06a");
      }
      ctx.globalAlpha = 1;

      // ---- HUD overlays on canvas ----
      // combo meter (bottom center)
      if (store.combo > 1) {
        const window = 1200 + store.upgrades.combo * 110;
        const remain = Math.max(0, 1 - (Date.now() - store.lastTapAt) / window);
        const cx = w / 2;
        const cy = h - 24;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(Math.floor(cx - 70), Math.floor(cy - 14), 140, 22);
        ctx.fillStyle = remain > 0.4 ? "#ffd700" : "#fb7185";
        pixelText(ctx, `${store.combo}x COMBO`, Math.floor(cx), Math.floor(cy - 2), 1.5, "center");
        // bar
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(Math.floor(cx - 66), Math.floor(cy + 6), 132, 4);
        ctx.fillStyle = remain > 0.4 ? "#ffd700" : "#fb7185";
        ctx.fillRect(Math.floor(cx - 66), Math.floor(cy + 6), Math.floor(132 * remain), 4);
      }

      // surge banner
      if (surgeActive(store)) {
        const sec = Math.ceil(surgeRemainingMs(store) / 1000);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(8, 8, 150, 22);
        pixelText(ctx, `GOLDEN x3 ${sec}s`, 14, 24, 1.5, "left", "#ffd700");
      }

      // income readout (top right)
      const inc = totalIncome(store);
      if (inc > 0) {
        pixelText(ctx, `${formatNumber(inc)}/s`, Math.floor(w - 8), 22, 1.5, "right", "#7dd3fc");
      }
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    draggingRef.current = false;
    lastDragXRef.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    const dx = e.clientX - lastDragXRef.current;
    if (Math.abs(dx) > 4) draggingRef.current = true;
    lastDragXRef.current = e.clientX;
    // allow horizontal drag to pan camera (offset camRef)
    if (draggingRef.current) {
      camRef.current -= dx;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!draggingRef.current) {
      // treat as tap
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      useGame.getState().tap(x, y);
    }
    draggingRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[360px] overflow-hidden select-none"
      style={{
        background: "#0a0a1a",
        imageRendering: "pixelated",
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="absolute inset-0 touch-none cursor-pointer"
        style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
      />
      <div className="pointer-events-none absolute top-2 left-2 flex items-center gap-2">
        <img src="/realmforge-icon.png" alt="" className="w-7 h-7 rounded" style={{ imageRendering: "pixelated" }} />
        <div className="font-pixel text-[10px] text-cyan-200 drop-shadow-[2px_2px_0_#000]">
          REALMFORGE
        </div>
      </div>
    </div>
  );
}

// ---------- Drawing helpers ----------

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, biome: BiomeDef, t: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, biome.sky[0]);
  grad.addColorStop(0.5, biome.sky[1]);
  grad.addColorStop(1, biome.sky[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // stars for space/void biomes
  if (biome.id === "space" || biome.id === "void") {
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 40; i++) {
      const sx = (i * 53) % w;
      const sy = (i * 31) % (h - GROUND_H - 20);
      const tw = 0.5 + 0.5 * Math.sin(t / 400 + i);
      ctx.globalAlpha = tw;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  // sun/moon for day biomes
  if (biome.id === "plains" || biome.id === "desert" || biome.id === "sky") {
    ctx.fillStyle = biome.id === "desert" ? "#fff3b0" : "#fff7d6";
    const sunX = w * 0.8;
    const sunY = h * 0.22;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = biome.sky[0];
    ctx.fillRect(sunX - 26, sunY + 8, 52, 16);
  }
}

function drawParallax(ctx: CanvasRenderingContext2D, w: number, h: number, cam: number, biome: BiomeDef, t: number) {
  // distant mountains/hills as silhouettes
  if (biome.id === "plains" || biome.id === "forest" || biome.id === "desert" || biome.id === "snow") {
    ctx.fillStyle = biome.groundDark;
    ctx.globalAlpha = 0.4;
    const baseY = h - GROUND_H - 6;
    const offset = (cam * 0.3) % 80;
    ctx.beginPath();
    ctx.moveTo(-offset, baseY);
    for (let x = -offset; x < w + 80; x += 80) {
      ctx.lineTo(x + 40, baseY - 30);
      ctx.lineTo(x + 80, baseY);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawDecoration(ctx: CanvasRenderingContext2D, x: number, groundY: number, biome: BiomeDef) {
  const sprite = biome.decoration;
  const px = 3; // pixel scale
  const w = sprite[0].length;
  const h = sprite.length;
  const offX = x - (w * px) / 2;
  const offY = groundY - h * px;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const ch = sprite[r][c];
      if (ch === ".") continue;
      const color = biome.decPalette[ch];
      if (!color || color === "transparent") continue;
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(offX + c * px), Math.floor(offY + r * px), px, px);
    }
  }
}

function drawBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  def: BuildingDef,
  scale: number,
  alpha: number,
  biome: BiomeDef,
  t: number
) {
  const px = Math.max(2, Math.floor(4 * scale));
  const w = def.w;
  const h = def.h;
  const offX = x - (w * px) / 2;
  const offY = groundY - h * px;
  ctx.globalAlpha = alpha;
  // subtle bob
  const bob = Math.sin(t / 800 + x) * 0.5;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const ch = def.sprite[r][c];
      if (!ch || ch === "." || ch === " ") continue;
      const color = def.palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(offX + c * px), Math.floor(offY + r * px + bob), px, px);
    }
  }
  ctx.globalAlpha = 1;
}

function drawConstruction(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  def: BuildingDef,
  progress: number,
  biome: BiomeDef,
  t: number,
  pulse: number
) {
  const px = 4;
  const w = def.w;
  const h = def.h;
  const offX = x - (w * px) / 2;
  const offY = groundY - h * px;
  // draw only the bottom `progress` fraction of the building, rising
  const visibleRows = Math.max(1, Math.ceil(h * progress));
  // scaffolding behind
  ctx.fillStyle = "#8a6a3a";
  for (let c = 0; c <= w; c += 2) {
    ctx.fillRect(Math.floor(offX + c * px - 1), Math.floor(offY), 1, h * px);
  }
  ctx.fillRect(Math.floor(offX), Math.floor(offY + (h - visibleRows) * px), w * px, 1);
  // building rows from bottom
  const bob = pulse * 2;
  for (let r = h - visibleRows; r < h; r++) {
    if (r < 0) continue;
    for (let c = 0; c < w; c++) {
      const ch = def.sprite[r][c];
      if (!ch || ch === "." || ch === " ") continue;
      const color = def.palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(offX + c * px), Math.floor(offY + r * px - bob), px, px);
    }
  }
  // top construction line glow
  ctx.fillStyle = "rgba(255,235,120,0.8)";
  const topRow = Math.max(0, h - visibleRows);
  ctx.fillRect(Math.floor(offX), Math.floor(offY + topRow * px - bob), w * px, 2);
}

function drawProgressBar(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number, surge: boolean) {
  const bw = 52;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(x - bw / 2 - 1, y - 1, bw + 2, 7);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(x - bw / 2, y, bw, 5);
  ctx.fillStyle = surge ? "#ffd700" : "#7dd3fc";
  ctx.fillRect(x - bw / 2, y, Math.floor(bw * Math.min(1, progress)), 5);
}

function drawHammer(ctx: CanvasRenderingContext2D, x: number, y: number, anim: number) {
  // simple pixel hammer, tilted by anim
  const px = 3;
  const angle = (1 - anim) * 1.2; // rotate
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-angle);
  // handle
  ctx.fillStyle = "#8a5a2a";
  ctx.fillRect(-px, 0, px * 2, px * 8);
  // head
  ctx.fillStyle = "#c0c0c0";
  ctx.fillRect(-px * 3, -px * 3, px * 6, px * 3);
  ctx.fillStyle = "#888";
  ctx.fillRect(-px * 3, -px, px * 6, px);
  ctx.restore();
}

// crude pixel text renderer using the canvas font with no smoothing
function pixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale: number,
  align: "left" | "center" | "right" = "left",
  color = "#ffffff"
) {
  ctx.save();
  ctx.font = `${Math.round(10 * scale)}px "Press Start 2P", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillText(text, x + 2, y + 2);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}
