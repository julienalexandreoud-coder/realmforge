"use client";
import { useEffect, useRef } from "react";
import { useGame } from "@/lib/store/gameStore";
import { SKINS } from "@/lib/game/config";
import { crystalMaxHp, surgeActive, surgeRemainingMs, formatNumber } from "@/lib/game/engine";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 400, h: 400, dpr: 1 });
  const lastTickRef = useRef(0);

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
      const now = performance.now();
      // tick the store ~ every 100ms
      if (now - lastTickRef.current > 100) {
        lastTickRef.current = now;
        store.tick(Date.now());
      }
      const { w, h, dpr } = sizeRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // background subtle vignette + grid
      drawBackground(ctx, w, h, surgeActive(store));

      const cx = w / 2;
      const cy = h / 2 + 10;
      const baseR = Math.min(w, h) * 0.28;

      // crystal
      const hpPct = Math.max(0, store.crystalHp / crystalMaxHp(store.crystalLevel));
      const shake = store.crystalShake;
      const scale = store.crystalScale;
      const sx = (Math.random() - 0.5) * shake * 10;
      const sy = (Math.random() - 0.5) * shake * 10;

      drawCrystal(
        ctx,
        cx + sx,
        cy + sy,
        baseR * scale,
        store.activeSkin,
        hpPct,
        store.crystalLevel,
        surgeActive(store),
        t
      );

      // particles
      for (const p of store.particles) {
        const a = 1 - p.life / p.maxLife;
        ctx.globalAlpha = Math.max(0, a);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // floating numbers
      for (const f of store.floatingNumbers) {
        const age = performance.now() - f.born;
        const a = Math.max(0, 1 - age / 900);
        ctx.globalAlpha = a;
        ctx.font = `bold ${f.crit ? 30 : 20}px var(--font-geist-sans), system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = f.crit ? "#fbbf24" : "#e0f2fe";
        ctx.shadowColor = f.crit ? "#f59e0b" : "#0ea5e9";
        ctx.shadowBlur = 12;
        const label = `+${formatNumber(f.value)}${f.crit ? "!" : ""}`;
        ctx.fillText(label, f.x, f.y);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      // combo meter (center-bottom)
      if (store.combo > 1) {
        const window = 1100 + store.upgrades.comboDuration * 120;
        const remain = Math.max(0, 1 - (Date.now() - store.lastTapAt) / window);
        const comboY = cy + baseR + 36;
        ctx.font = "bold 22px var(--font-geist-sans), system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = remain > 0.4 ? "#fbbf24" : "#fb7185";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 8;
        ctx.fillText(`${store.combo}× COMBO`, cx, comboY);
        ctx.shadowBlur = 0;
        // bar
        const bw = 120;
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(cx - bw / 2, comboY + 8, bw, 5);
        ctx.fillStyle = remain > 0.4 ? "#fbbf24" : "#fb7185";
        ctx.fillRect(cx - bw / 2, comboY + 8, bw * remain, 5);
      }

      // surge indicator
      if (surgeActive(store)) {
        const sec = Math.ceil(surgeRemainingMs(store) / 1000);
        ctx.font = "bold 16px var(--font-geist-sans), system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#fde68a";
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 14;
        ctx.fillText(`⚡ SURGE ${sec}s ⚡`, cx, 28);
        ctx.shadowBlur = 0;
      }
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  const handlePointer = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    useGame.getState().tap(x, y);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[360px] rounded-2xl overflow-hidden select-none"
      style={{
        background:
          "radial-gradient(120% 120% at 50% 30%, #0b1220 0%, #060912 60%, #02040a 100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointer}
        className="absolute inset-0 touch-none cursor-pointer"
        style={{ width: "100%", height: "100%" }}
      />
      <div className="pointer-events-none absolute top-3 left-3 text-xs font-mono text-cyan-300/70">
        LVL {useGame((s) => s.crystalLevel)}
      </div>
    </div>
  );
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  surge: boolean
) {
  // radial glow
  const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * 0.7);
  if (surge) {
    g.addColorStop(0, "rgba(251,191,36,0.18)");
    g.addColorStop(1, "rgba(2,4,10,0)");
  } else {
    g.addColorStop(0, "rgba(56,189,248,0.12)");
    g.addColorStop(1, "rgba(2,4,10,0)");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // faint grid
  ctx.strokeStyle = "rgba(125,211,252,0.05)";
  ctx.lineWidth = 1;
  const step = 40;
  ctx.beginPath();
  for (let x = 0; x < w; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y < h; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
}

function drawCrystal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  skin: keyof typeof SKINS,
  hpPct: number,
  level: number,
  surge: boolean,
  t: number
) {
  const skinDef = SKINS[skin];
  const rainbow = skinDef.core === "rainbow";
  const hue = (t / 20) % 360;
  const core = rainbow ? `hsl(${hue}, 90%, 65%)` : skinDef.core;
  const glow = rainbow ? `hsl(${(hue + 40) % 360}, 90%, 60%)` : skinDef.glow;
  const facet = skinDef.facet;

  // outer glow rings (pulse)
  const pulse = 1 + Math.sin(t / 400) * 0.04;
  for (let i = 3; i >= 1; i--) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * (1.2 + i * 0.25) * pulse, 0, Math.PI * 2);
    ctx.fillStyle = rainbow
      ? `hsla(${(hue + i * 30) % 360}, 90%, 60%, ${0.05 / i})`
      : `rgba(${hexToRgb(glow)}, ${0.06 / i})`;
    ctx.fill();
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t / 6000);

  // diamond/gem shape (6-point)
  const sides = 6;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < sides; i++) {
    const ang = (i / sides) * Math.PI * 2 - Math.PI / 2;
    pts.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
  }

  // body gradient
  const grad = ctx.createLinearGradient(-r, -r, r, r);
  grad.addColorStop(0, facet);
  grad.addColorStop(0.4, core);
  grad.addColorStop(1, glow);

  // shadow/glow
  ctx.shadowColor = surge ? "#fbbf24" : glow;
  ctx.shadowBlur = 30 + (surge ? 20 : 0);

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowBlur = 0;

  // facets — lines from center to each vertex
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.5;
  for (const p of pts) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  // inner highlight polygon
  ctx.beginPath();
  const ir = r * 0.45;
  for (let i = 0; i < sides; i++) {
    const ang = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(ang) * ir;
    const y = Math.sin(ang) * ir;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fill();

  // center sparkle
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fill();

  ctx.restore();

  // cracks based on damage (more damage → more cracks)
  const dmg = 1 - hpPct;
  if (dmg > 0.05) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 1 + dmg * 2;
    const crackCount = Math.floor(dmg * 6) + 1;
    for (let i = 0; i < crackCount; i++) {
      const ang = (i / crackCount) * Math.PI * 2 + 0.3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      let px = 0;
      let py = 0;
      const segs = 3;
      for (let s = 1; s <= segs; s++) {
        const len = (r * dmg * s) / segs;
        const jitter = (Math.random() - 0.5) * 0.5;
        px = Math.cos(ang + jitter) * len;
        py = Math.sin(ang + jitter) * len;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // level label
  ctx.font = "bold 13px var(--font-geist-sans), system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 6;
  ctx.fillText(`Lv.${level}`, cx, cy + r + 22);
  ctx.shadowBlur = 0;
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}
