"use client";
/**
 * FluidPet — cute animated pet with fluid orb body.
 * Fluid bubble adapted from ElatoAI/Animation1.jsx (MIT, akdeb/ElatoAI).
 */
import { useRef, useEffect } from "react";

// Emotion → [primary, secondary, glow]
const PALETTE: Record<string, [string,string,string]> = {
  neutral:     ["#7C5CFC","#A78BFA","rgba(124,92,252,0.4)"],
  happy:       ["#34D399","#6EE7B7","rgba(52,211,153,0.5)"],
  laughing:    ["#10B981","#34D399","rgba(16,185,129,0.6)"],
  funny:       ["#F59E0B","#FCD34D","rgba(245,158,11,0.5)"],
  sad:         ["#6366F1","#818CF8","rgba(99,102,241,0.4)"],
  angry:       ["#EF4444","#F87171","rgba(239,68,68,0.5)"],
  crying:      ["#60A5FA","#93C5FD","rgba(96,165,250,0.5)"],
  loving:      ["#EC4899","#F9A8D4","rgba(236,72,153,0.5)"],
  embarrassed: ["#F97316","#FCA5A5","rgba(249,115,22,0.4)"],
  surprised:   ["#FBBF24","#FDE68A","rgba(251,191,36,0.5)"],
  shocked:     ["#EF4444","#FCA5A5","rgba(239,68,68,0.6)"],
  thinking:    ["#8B5CF6","#C4B5FD","rgba(139,92,246,0.5)"],
  winking:     ["#10B981","#7C5CFC","rgba(16,185,129,0.4)"],
  cool:        ["#0EA5E9","#38BDF8","rgba(14,165,233,0.5)"],
  relaxed:     ["#34D399","#A7F3D0","rgba(52,211,153,0.3)"],
  delicious:   ["#F97316","#FCD34D","rgba(249,115,22,0.4)"],
  kissy:       ["#EC4899","#FBCFE8","rgba(236,72,153,0.5)"],
  confident:   ["#7C5CFC","#0EA5E9","rgba(124,92,252,0.5)"],
  sleepy:      ["#94A3B8","#CBD5E1","rgba(148,163,184,0.3)"],
  silly:       ["#F59E0B","#7C5CFC","rgba(245,158,11,0.4)"],
  confused:    ["#94A3B8","#8B5CF6","rgba(148,163,184,0.4)"],
};

// Cute face per emotion — drawn on canvas
const FACES: Record<string, (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void> = {
  happy:    drawHappy,
  laughing: drawLaughing,
  sad:      drawSad,
  crying:   drawCrying,
  angry:    drawAngry,
  loving:   drawLoving,
  shocked:  drawShocked,
  thinking: drawThinking,
  sleepy:   drawSleepy,
  cool:     drawCool,
  winking:  drawWinking,
};

function hexToRgb(hex: string) {
  return { r:parseInt(hex.slice(1,3),16), g:parseInt(hex.slice(3,5),16), b:parseInt(hex.slice(5,7),16) };
}

// ── Face drawing functions ────────────────────────────────────────────────────

function drawEyes(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  leftOpen=1, rightOpen=1, color="#1a1a2e") {
  const ey = cy - r*0.08;
  const ex = r*0.22;
  const er = r*0.11;
  // Left eye
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx-ex, ey, er, er*leftOpen, 0, 0, Math.PI*2);
  ctx.fillStyle = color;
  ctx.fill();
  // Left shine
  ctx.beginPath();
  ctx.arc(cx-ex+er*0.3, ey-er*0.3, er*0.28, 0, Math.PI*2);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fill();
  // Right eye
  ctx.beginPath();
  ctx.ellipse(cx+ex, ey, er, er*rightOpen, 0, 0, Math.PI*2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx+ex+er*0.3, ey-er*0.3, er*0.28, 0, Math.PI*2);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fill();
  ctx.restore();
}

function drawCheeks(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color="rgba(255,150,150,0.35)") {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx-r*0.32, cy+r*0.05, r*0.14, r*0.08, 0, 0, Math.PI*2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx+r*0.32, cy+r*0.05, r*0.14, r*0.08, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawHappy(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  drawEyes(ctx, cx, cy, r);
  drawCheeks(ctx, cx, cy, r);
  ctx.beginPath();
  ctx.arc(cx, cy+r*0.18, r*0.18, 0, Math.PI);
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = r*0.06;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawLaughing(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  // Squinty happy eyes
  const ey = cy - r*0.08, ex = r*0.22;
  ctx.save();
  ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = r*0.07; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(cx-ex, ey, r*0.1, Math.PI, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx+ex, ey, r*0.1, Math.PI, 0); ctx.stroke();
  ctx.restore();
  drawCheeks(ctx, cx, cy, r, "rgba(255,120,120,0.5)");
  // Open mouth
  ctx.beginPath();
  ctx.arc(cx, cy+r*0.18, r*0.2, 0, Math.PI);
  ctx.fillStyle = "#1a1a2e";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy+r*0.18, r*0.2, 0, Math.PI);
  ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = r*0.04; ctx.stroke();
}

function drawSad(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  drawEyes(ctx, cx, cy, r, 0.7, 0.7);
  ctx.beginPath();
  ctx.arc(cx, cy+r*0.32, r*0.18, Math.PI, 0);
  ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = r*0.06; ctx.lineCap = "round"; ctx.stroke();
}

function drawCrying(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  drawSad(ctx, cx, cy, r);
  // Tears
  ctx.save();
  ctx.fillStyle = "rgba(147,197,253,0.8)";
  ctx.beginPath(); ctx.ellipse(cx-r*0.22, cy+r*0.05, r*0.04, r*0.12, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx+r*0.22, cy+r*0.05, r*0.04, r*0.12, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawAngry(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const ey = cy - r*0.08, ex = r*0.22, er = r*0.11;
  ctx.save();
  // Angry brows
  ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = r*0.07; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx-ex-er, ey-er*1.2); ctx.lineTo(cx-ex+er, ey-er*0.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+ex+er, ey-er*1.2); ctx.lineTo(cx+ex-er, ey-er*0.5); ctx.stroke();
  ctx.restore();
  drawEyes(ctx, cx, cy, r, 0.6, 0.6, "#1a1a2e");
  ctx.beginPath();
  ctx.arc(cx, cy+r*0.32, r*0.14, Math.PI, 0);
  ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = r*0.06; ctx.lineCap = "round"; ctx.stroke();
}

function drawLoving(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  // Heart eyes
  const ey = cy - r*0.08, ex = r*0.22, er = r*0.12;
  [cx-ex, cx+ex].forEach(x => {
    ctx.save();
    ctx.translate(x, ey);
    ctx.scale(er*0.9, er*0.9);
    ctx.beginPath();
    ctx.moveTo(0, 0.3);
    ctx.bezierCurveTo(-1,-0.5,-2,0.5,0,1.5);
    ctx.bezierCurveTo(2,0.5,1,-0.5,0,0.3);
    ctx.fillStyle = "#EF4444";
    ctx.fill();
    ctx.restore();
  });
  drawCheeks(ctx, cx, cy, r, "rgba(255,100,150,0.5)");
  ctx.beginPath();
  ctx.arc(cx, cy+r*0.18, r*0.18, 0, Math.PI);
  ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = r*0.06; ctx.lineCap = "round"; ctx.stroke();
}

function drawShocked(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const ey = cy - r*0.08, ex = r*0.22, er = r*0.13;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx-ex, ey, er, 0, Math.PI*2);
  ctx.fillStyle = "#1a1a2e"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx+ex, ey, er, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx-ex+er*0.3, ey-er*0.3, er*0.3, 0, Math.PI*2);
  ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx+ex+er*0.3, ey-er*0.3, er*0.3, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  // O mouth
  ctx.beginPath();
  ctx.arc(cx, cy+r*0.22, r*0.1, 0, Math.PI*2);
  ctx.fillStyle = "#1a1a2e"; ctx.fill();
}

function drawThinking(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  drawEyes(ctx, cx, cy, r, 1, 0.5);
  // Thought dots
  ctx.save();
  ctx.fillStyle = "#1a1a2e";
  [0,1,2].forEach(i => {
    ctx.beginPath();
    ctx.arc(cx+r*0.1+i*r*0.12, cy+r*0.25, r*0.04, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.restore();
}

function drawSleepy(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const ey = cy - r*0.08, ex = r*0.22;
  ctx.save();
  ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = r*0.07; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx-ex-r*0.1, ey); ctx.lineTo(cx-ex+r*0.1, ey); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+ex-r*0.1, ey); ctx.lineTo(cx+ex+r*0.1, ey); ctx.stroke();
  ctx.restore();
  // Zzz
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `bold ${r*0.18}px sans-serif`;
  ctx.fillText("z", cx+r*0.35, cy-r*0.25);
  ctx.font = `bold ${r*0.13}px sans-serif`;
  ctx.fillText("z", cx+r*0.48, cy-r*0.38);
  ctx.restore();
}

function drawCool(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const ey = cy - r*0.08, ex = r*0.22, er = r*0.13;
  // Sunglasses
  ctx.save();
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath(); ctx.roundRect(cx-ex-er, ey-er, er*2, er*1.6, er*0.3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(cx+ex-er, ey-er, er*2, er*1.6, er*0.3); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx-ex+er, ey-er*0.2); ctx.lineTo(cx+ex-er, ey-er*0.2);
  ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = r*0.05; ctx.stroke();
  ctx.restore();
  drawCheeks(ctx, cx, cy, r);
  ctx.beginPath();
  ctx.arc(cx, cy+r*0.18, r*0.18, 0, Math.PI);
  ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = r*0.06; ctx.lineCap = "round"; ctx.stroke();
}

function drawWinking(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const ey = cy - r*0.08, ex = r*0.22;
  // Normal left eye
  ctx.save();
  ctx.beginPath(); ctx.arc(cx-ex, ey, r*0.11, 0, Math.PI*2);
  ctx.fillStyle = "#1a1a2e"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx-ex+r*0.04, ey-r*0.04, r*0.04, 0, Math.PI*2);
  ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fill();
  // Wink right
  ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = r*0.07; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx+ex-r*0.1, ey); ctx.lineTo(cx+ex+r*0.1, ey); ctx.stroke();
  ctx.restore();
  drawCheeks(ctx, cx, cy, r);
  ctx.beginPath();
  ctx.arc(cx, cy+r*0.18, r*0.18, 0, Math.PI);
  ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = r*0.06; ctx.lineCap = "round"; ctx.stroke();
}

function drawDefaultFace(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  drawEyes(ctx, cx, cy, r);
  drawCheeks(ctx, cx, cy, r);
  ctx.beginPath();
  ctx.arc(cx, cy+r*0.18, r*0.14, 0, Math.PI);
  ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = r*0.06; ctx.lineCap = "round"; ctx.stroke();
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FluidPet({
  emotion, deviceState, size = 160
}: { emotion: string; deviceState: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef   = useRef(0);
  const rafRef    = useRef<number>(0);

  const [primary, secondary, glowColor] = PALETTE[emotion] ?? PALETTE.neutral;
  const isActive  = deviceState === "speaking" || deviceState === "listening";
  const amplitude = deviceState === "speaking" ? 65
                  : deviceState === "listening" ? 40
                  : deviceState === "thinking"  ? 25 : 12;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      timeRef.current += isActive ? 0.016 : 0.005;
      ctx.clearRect(0, 0, size, size);

      const cx = size/2, cy = size/2;
      const r  = size * 0.36;
      const amp = amplitude / 100;
      const pts = 80;

      // Outer glow ring
      const outerGlow = ctx.createRadialGradient(cx, cy, r*0.8, cx, cy, r*1.8);
      const p = hexToRgb(primary);
      outerGlow.addColorStop(0, `rgba(${p.r},${p.g},${p.b},0.12)`);
      outerGlow.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
      ctx.beginPath(); ctx.arc(cx, cy, r*1.8, 0, Math.PI*2);
      ctx.fillStyle = outerGlow; ctx.fill();

      // Fluid body
      const grad = ctx.createRadialGradient(cx-r*0.25, cy-r*0.25, r*0.05, cx, cy, r*1.05);
      const s = hexToRgb(secondary);
      grad.addColorStop(0,   `rgba(${s.r},${s.g},${s.b},1)`);
      grad.addColorStop(0.45,`rgba(${p.r},${p.g},${p.b},0.95)`);
      grad.addColorStop(1,   `rgba(${p.r},${p.g},${p.b},0.4)`);

      ctx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const angle = (i/pts)*Math.PI*2;
        const n1 = Math.sin(angle*3 + timeRef.current)     * amp * 0.28;
        const n2 = Math.sin(angle*5 + timeRef.current*1.4) * amp * 0.14;
        const n3 = Math.sin(angle*8 + timeRef.current*0.8) * amp * 0.06;
        const rr = r*(1+n1+n2+n3);
        const x  = cx + Math.cos(angle)*rr;
        const y  = cy + Math.sin(angle)*rr;
        i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Specular highlight (glass effect)
      const spec = ctx.createRadialGradient(cx-r*0.28, cy-r*0.32, 0, cx-r*0.28, cy-r*0.32, r*0.55);
      spec.addColorStop(0, "rgba(255,255,255,0.45)");
      spec.addColorStop(0.5,"rgba(255,255,255,0.1)");
      spec.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath(); ctx.arc(cx-r*0.28, cy-r*0.32, r*0.55, 0, Math.PI*2);
      ctx.fillStyle = spec; ctx.fill();

      // Bottom shadow
      const shadow = ctx.createRadialGradient(cx, cy+r*0.3, 0, cx, cy+r*0.3, r*0.6);
      shadow.addColorStop(0, "rgba(0,0,0,0.15)");
      shadow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(cx, cy+r*0.3, r*0.6, 0, Math.PI*2);
      ctx.fillStyle = shadow; ctx.fill();

      // Draw cute face
      const drawFace = FACES[emotion] ?? drawDefaultFace;
      drawFace(ctx, cx, cy, r);

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [emotion, deviceState, size, amplitude, isActive, primary, secondary]);

  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <canvas ref={canvasRef} style={{ width:size, height:size, display:"block" }} />
    </div>
  );
}
