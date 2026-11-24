"use client";

import React, { useEffect, useRef } from "react";

interface CyberBackgroundProps {
  isDark: boolean;
  variant?: "hero" | "workspace";
}

interface NeuralNode {
  x: number;
  y: number;
  z: number; // Depth layer: 0.35 (far/blurred) to 1.4 (near)
  vx: number;
  vy: number;
  color: string;
}

export default function CyberBackground({
  isDark,
  variant = "workspace",
}: CyberBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let time = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.tx = (e.clientX / width - 0.5) * 32;
      mouseRef.current.ty = (e.clientY / height - 0.5) * 24;
    };
    window.addEventListener("mousemove", onMouseMove);

    const palette = isDark
      ? ["#06B6D4", "#0D9488", "#10B981", "#818CF8"]
      : ["#0891B2", "#0D9488", "#059669", "#6366F1"];

    const nodeCount = variant === "hero" ? 44 : 28;
    const nodes: NeuralNode[] = Array.from({ length: nodeCount }, (_, i) => ({
      x: ((i * 197) % 1000) / 1000 * width,
      y: ((i * 353) % 1000) / 1000 * height,
      z: 0.4 + ((i * 73) % 100) / 100,
      vx: (((i % 7) - 3) * 0.11) || 0.08,
      vy: (((i % 5) - 2) * 0.09) || -0.07,
      color: palette[i % palette.length],
    }));

    const render = () => {
      time += 0.008;
      mouseRef.current.x += (mouseRef.current.tx - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.ty - mouseRef.current.y) * 0.04;

      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // 1. Flowing 3D Neural Data Splines (Iridescent Waves)
      const splineCount = variant === "hero" ? 4 : 2;
      for (let s = 0; s < splineCount; s++) {
        ctx.beginPath();
        const baseY = height * (0.28 + s * 0.18) + my * (0.35 + s * 0.15);
        for (let x = -40; x <= width + 40; x += 24) {
          const wave1 = Math.sin(x * 0.0028 + time * (1.2 + s * 0.25) + s * 1.4) * (44 + s * 14);
          const wave2 = Math.cos(x * 0.0052 - time * 0.9 + s) * 18;
          const y = baseY + wave1 + wave2;
          if (x === -40) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, "rgba(6, 182, 212, 0)");
        grad.addColorStop(
          0.3,
          isDark ? "rgba(6, 182, 212, 0.22)" : "rgba(6, 182, 212, 0.15)"
        );
        grad.addColorStop(
          0.65,
          isDark ? "rgba(16, 185, 129, 0.22)" : "rgba(13, 148, 136, 0.14)"
        );
        grad.addColorStop(1, "rgba(129, 140, 248, 0)");

        ctx.strokeStyle = grad;
        ctx.lineWidth = s === 0 ? 1.8 : 1.1;
        ctx.stroke();

        // Traveling Glowing Photon Packet along each spline
        const photonX = ((time * (120 + s * 35) + s * 320) % (width + 180)) - 90;
        const pY =
          baseY +
          Math.sin(photonX * 0.0028 + time * (1.2 + s * 0.25) + s * 1.4) * (44 + s * 14) +
          Math.cos(photonX * 0.0052 - time * 0.9 + s) * 18;

        const pGlow = ctx.createRadialGradient(photonX, pY, 0, photonX, pY, 16);
        pGlow.addColorStop(0, isDark ? "rgba(236, 254, 255, 0.95)" : "rgba(6, 182, 212, 0.85)");
        pGlow.addColorStop(0.35, "rgba(6, 182, 212, 0.45)");
        pGlow.addColorStop(1, "rgba(6, 182, 212, 0)");
        ctx.fillStyle = pGlow;
        ctx.beginPath();
        ctx.arc(photonX, pY, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Neural Geometry Network with Depth-of-Field Glow
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx * n.z;
        n.y += n.vy * n.z;

        if (n.x < -30) n.x = width + 30;
        if (n.x > width + 30) n.x = -30;
        if (n.y < -30) n.y = height + 30;
        if (n.y > height + 30) n.y = -30;

        const px = n.x + mx * n.z;
        const py = n.y + my * n.z;

        // Connect nearby neural nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const mx2 = m.x + mx * m.z;
          const my2 = m.y + my * m.z;
          const dist = Math.hypot(px - mx2, py - my2);
          const maxDist = variant === "hero" ? 165 : 140;

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * (isDark ? 0.2 : 0.12);
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(mx2, my2);
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Soft bokeh / depth-of-field halo
        const radius = n.z * (variant === "hero" ? 2.6 : 2.1);
        const halo = ctx.createRadialGradient(px, py, 0, px, py, radius * 5.2);
        halo.addColorStop(0, `${n.color}${isDark ? "66" : "44"}`);
        halo.addColorStop(1, `${n.color}00`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(px, py, radius * 5.2, 0, Math.PI * 2);
        ctx.fill();

        // Crisp core
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [isDark, variant]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* LAYER 1: Cyber-Architectural Orbital Space & Monoliths */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className={`absolute inset-0 h-full w-full ${
          variant === "hero" ? "opacity-90" : "opacity-45"
        }`}
      >
        <defs>
          <linearGradient id="beamCyan" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity={isDark ? "0.18" : "0.1"} />
            <stop offset="55%" stopColor="#0D9488" stopOpacity={isDark ? "0.06" : "0.03"} />
            <stop offset="100%" stopColor="#02050B" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="monolithRim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#67E8F9" stopOpacity={isDark ? "0.42" : "0.22"} />
            <stop offset="50%" stopColor="#0D9488" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="orbitalArc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
            <stop offset="50%" stopColor="#67E8F9" stopOpacity={isDark ? "0.35" : "0.2"} />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Volumetric Studio Light Beams */}
        <polygon points="180,0 440,0 760,900 320,900" fill="url(#beamCyan)" />
        <polygon points="940,0 1160,0 1440,860 1120,900" fill="url(#beamCyan)" />

        {/* Orbital Station Horizon Ring */}
        <ellipse
          cx="720"
          cy="940"
          rx="860"
          ry="340"
          fill="none"
          stroke="url(#orbitalArc)"
          strokeWidth="1.5"
        />
        <ellipse
          cx="720"
          cy="965"
          rx="740"
          ry="280"
          fill="none"
          stroke="url(#orbitalArc)"
          strokeWidth="0.8"
          strokeDasharray="6 10"
        />

        {/* Minimalist Cyber-Architectural Monolith Silhouettes with Moody Rim Lighting */}
        <g opacity={isDark ? "0.65" : "0.24"}>
          <polygon
            points="65,900 135,340 215,375 215,900"
            fill={isDark ? "#050B16" : "#CBD5E1"}
            stroke="url(#monolithRim)"
            strokeWidth="1.2"
          />
          <polygon
            points="1220,900 1265,280 1375,320 1395,900"
            fill={isDark ? "#050B16" : "#CBD5E1"}
            stroke="url(#monolithRim)"
            strokeWidth="1.2"
          />
          <polygon
            points="1130,900 1155,490 1215,515 1215,900"
            fill={isDark ? "#040912" : "#E2E8F0"}
            stroke="url(#monolithRim)"
            strokeWidth="0.9"
          />
        </g>
      </svg>

      {/* LAYER 2: Perspective Architectural Wireframe Floor Grid */}
      <div
        className={`absolute inset-x-[-20%] bottom-[-6%] h-[42vh] cyber-floor-grid ${
          variant === "hero" ? "opacity-65" : "opacity-30"
        }`}
      />

      {/* LAYER 3: Translucent Glassmorphism & Refracted Light Prisms */}
      <div
        className={`prism-refract animate-drift absolute top-[12%] right-[8%] h-44 w-44 rounded-3xl ${
          variant === "hero" ? "opacity-70" : "opacity-25"
        }`}
      />
      <div
        className={`prism-refract animate-drift absolute bottom-[16%] left-[5%] h-32 w-56 rounded-3xl ${
          variant === "hero" ? "opacity-60" : "opacity-20"
        }`}
        style={{ animationDelay: "3s" }}
      />

      {/* LAYER 4: Live 60FPS Neural & Data Spline Canvas */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full ${
          variant === "hero" ? "opacity-95" : "opacity-60"
        }`}
      />

      {/* Subtle Coordinate Grid & Cinema Film Grain */}
      <div className="absolute inset-0 spatial-grid opacity-50" />
      <div className="absolute inset-0 cinema-noise" />
    </div>
  );
}
