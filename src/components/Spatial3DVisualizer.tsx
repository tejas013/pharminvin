"use client";

import React, { useEffect, useRef, useState } from "react";
import { InventoryBatch, StorageZone } from "@/types/pharminvin";
import { Cpu, Layers, Radio, RotateCw, ShieldAlert } from "lucide-react";

interface Spatial3DVisualizerProps {
  batches: InventoryBatch[];
  zones: StorageZone[];
}

interface Node3D {
  x: number;
  y: number;
  z: number;
  label: string;
  name: string;
  zoneLabel: string;
  qty: number;
  daysLeft: number;
  color: string;
  size: number;
  isPrimary: boolean;
}

interface ProjectedHit {
  px: number;
  py: number;
  r: number;
  node: Node3D;
}

export default function Spatial3DVisualizer({
  batches,
  zones,
}: Spatial3DVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitsRef = useRef<ProjectedHit[]>([]);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [hovered, setHovered] = useState<{
    x: number;
    y: number;
    node: Node3D;
  } | null>(null);

  const rotationRef = useRef({ rx: 0.22, ry: 0.4 });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });
  const hasBreach = zones.some((z) => z.status === "breach");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let tick = 0;

    const filtered =
      selectedZone === "all"
        ? batches
        : batches.filter((b) => b.shelfZoneId === selectedZone);

    const nodes: Node3D[] = [];
    const count = Math.max(filtered.length, 8);

    for (let i = 0; i < count; i++) {
      const batch = filtered[i % Math.max(filtered.length, 1)];
      const angle = (i / count) * Math.PI * 3.4;
      const radius = 112 + (i % 2 === 0 ? 18 : -14);
      const y = (i / (count - 1 || 1) - 0.5) * 175;

      const daysLeft = batch
        ? Math.ceil(
            (new Date(batch.expiryDate).getTime() - Date.now()) / 86400000
          )
        : 120;

      const zoneBreached = batch
        ? zones.find((z) => z.id === batch.shelfZoneId)?.status === "breach"
        : false;

      let color = "#10B981";
      if (zoneBreached || daysLeft <= 30) color = "#F43F5E";
      else if (daysLeft <= 60) color = "#F59E0B";
      else if (daysLeft <= 90) color = "#06B6D4";

      nodes.push({
        x: Math.cos(angle) * radius,
        y,
        z: Math.sin(angle) * radius,
        label: batch ? batch.batchId : `NODE-${i + 1}`,
        name: batch ? batch.name : "Cryo Node",
        zoneLabel: batch ? batch.shelfZoneLabel : "Ambient Matrix",
        qty: batch ? batch.quantity : 100,
        daysLeft,
        color,
        size: batch ? Math.min(9.5, Math.max(5.5, batch.quantity / 85)) : 6,
        isPrimary: true,
      });

      // Paired molecular double-helix satellite
      nodes.push({
        x: Math.cos(angle + Math.PI) * (radius * 0.7),
        y: y * 0.9,
        z: Math.sin(angle + Math.PI) * (radius * 0.7),
        label: "",
        name: "",
        zoneLabel: "",
        qty: 0,
        daysLeft: 180,
        color: zoneBreached ? "#FB7185" : "#0D9488",
        size: 3.2,
        isPrimary: false,
      });
    }

    // Subtle ambient starfield particles inside the spatial volume
    const dust = Array.from({ length: 42 }, (_, idx) => ({
      x: Math.sin(idx * 12.9898) * 210,
      y: Math.cos(idx * 78.233) * 140,
      z: Math.sin(idx * 43.123) * 210,
      r: (idx % 3) * 0.6 + 0.8,
    }));

    const project = (
      x: number,
      y: number,
      z: number,
      cx: number,
      cy: number,
      cosY: number,
      sinY: number,
      cosX: number,
      sinX: number
    ) => {
      const fov = 420;
      const x1 = x * cosY - z * sinY;
      const z1 = z * cosY + x * sinY;
      const y2 = y * cosX - z1 * sinX;
      const z2 = z1 * cosX + y * sinX;
      const scale = fov / (fov + z2 + 230);
      return { px: cx + x1 * scale, py: cy + y2 * scale, scale, depth: z2 };
    };

    const render = () => {
      tick += 0.02;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (
        canvas.width !== Math.floor(rect.width * dpr) ||
        canvas.height !== Math.floor(rect.height * dpr)
      ) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      if (autoRotate && !dragRef.current.active) {
        rotationRef.current.ry += 0.0055;
      }

      const cx = w / 2;
      const cy = h / 2;
      const cosY = Math.cos(rotationRef.current.ry);
      const sinY = Math.sin(rotationRef.current.ry);
      const cosX = Math.cos(rotationRef.current.rx);
      const sinX = Math.sin(rotationRef.current.rx);

      // Volumetric core radial bloom
      const bloom = ctx.createRadialGradient(
        cx,
        cy,
        8,
        cx,
        cy,
        Math.min(w, h) * 0.56
      );
      bloom.addColorStop(
        0,
        hasBreach ? "rgba(244, 63, 94, 0.28)" : "rgba(6, 182, 212, 0.24)"
      );
      bloom.addColorStop(0.45, "rgba(13, 148, 136, 0.09)");
      bloom.addColorStop(1, "rgba(3, 6, 14, 0)");
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, w, h);

      // Draw ambient depth dust
      dust.forEach((d) => {
        const p = project(d.x, d.y, d.z, cx, cy, cosY, sinY, cosX, sinX);
        ctx.beginPath();
        ctx.arc(p.px, p.py, d.r * p.scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(103, 232, 249, ${Math.max(0.08, p.scale * 0.32)})`;
        ctx.fill();
      });

      // Central Holographic Floating Pharmaceutical Capsule Core
      const capFloat = Math.sin(tick * 1.4) * 7;
      ctx.save();
      ctx.translate(cx, cy + capFloat);
      ctx.rotate(-0.42 + Math.sin(tick * 0.6) * 0.08);
      const capGrad = ctx.createLinearGradient(-28, -12, 28, 12);
      capGrad.addColorStop(0, hasBreach ? "#F43F5E" : "#0D9488");
      capGrad.addColorStop(0.5, hasBreach ? "#FB7185" : "#06B6D4");
      capGrad.addColorStop(1, "#ECFEFF");
      ctx.fillStyle = capGrad;
      ctx.globalAlpha = 0.24;
      ctx.beginPath();
      ctx.roundRect(-34, -14, 68, 28, 14);
      ctx.fill();
      ctx.globalAlpha = 0.78;
      ctx.strokeStyle = hasBreach ? "#FDA4AF" : "#67E8F9";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(0, 14);
      ctx.stroke();
      ctx.restore();

      // Tilted 3D Orbital Gyro Rings
      [-76, 0, 76].forEach((ringY, ringIdx) => {
        ctx.beginPath();
        const ringRad = ringIdx === 1 ? 148 : 118;
        for (let a = 0; a <= Math.PI * 2 + 0.12; a += 0.14) {
          const p = project(
            Math.cos(a) * ringRad,
            ringY,
            Math.sin(a) * ringRad,
            cx,
            cy,
            cosY,
            sinY,
            cosX,
            sinX
          );
          if (a === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.strokeStyle =
          ringIdx === 1
            ? hasBreach
              ? "rgba(244, 63, 94, 0.25)"
              : "rgba(6, 182, 212, 0.24)"
            : "rgba(148, 163, 184, 0.12)";
        ctx.lineWidth = ringIdx === 1 ? 1.2 : 0.9;
        ctx.stroke();
      });

      // Project Inventory Nodes
      const projected = nodes.map((n) => ({
        node: n,
        ...project(n.x, n.y, n.z, cx, cy, cosY, sinY, cosX, sinX),
      }));

      // Molecular Rungs & Backbone
      ctx.lineWidth = 1.1;
      for (let i = 0; i < projected.length; i += 2) {
        const a = projected[i];
        const b = projected[i + 1];
        if (a && b) {
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(b.px, b.py);
          ctx.strokeStyle = hasBreach
            ? "rgba(244, 63, 94, 0.32)"
            : "rgba(6, 182, 212, 0.28)";
          ctx.stroke();
        }
        const nextA = projected[i + 2];
        if (a && nextA) {
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(nextA.px, nextA.py);
          ctx.strokeStyle = "rgba(16, 185, 129, 0.28)";
          ctx.stroke();
        }
      }

      const nextHits: ProjectedHit[] = [];

      projected
        .sort((a, b) => b.depth - a.depth)
        .forEach((p) => {
          const radius = Math.max(2.5, p.node.size * p.scale);

          // Pulse halo for critical or breached nodes
          if (p.node.color === "#F43F5E") {
            const pulseR = radius * (2.2 + Math.sin(tick * 3.5) * 0.65);
            ctx.beginPath();
            ctx.arc(p.px, p.py, pulseR, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(244, 63, 94, 0.55)";
            ctx.lineWidth = 1.1;
            ctx.stroke();
          }

          // Outer glow halo
          ctx.beginPath();
          ctx.arc(p.px, p.py, radius * 2.3, 0, Math.PI * 2);
          ctx.fillStyle = `${p.node.color}26`;
          ctx.fill();

          // Core glowing orb
          ctx.beginPath();
          ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);
          ctx.fillStyle = p.node.color;
          ctx.fill();

          // Specular white highlight dot
          ctx.beginPath();
          ctx.arc(
            p.px - radius * 0.28,
            p.py - radius * 0.28,
            radius * 0.32,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fill();

          if (p.node.isPrimary) {
            nextHits.push({ px: p.px, py: p.py, r: radius + 9, node: p.node });
          }

          if (p.node.label && p.scale > 0.74) {
            ctx.font = "600 10px Inter, system-ui, sans-serif";
            ctx.fillStyle = "rgba(226, 232, 240, 0.9)";
            ctx.fillText(p.node.label, p.px + radius + 7, p.py + 3.5);
          }
        });

      hitsRef.current = nextHits;
      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [batches, zones, autoRotate, selectedZone, hasBreach]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && !dragRef.current.active) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const match = hitsRef.current.find(
        (h) => Math.hypot(h.px - mx, h.py - my) <= h.r
      );
      if (match) {
        setHovered({ x: match.px, y: match.py, node: match.node });
      } else {
        setHovered(null);
      }
    }

    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    rotationRef.current.ry += dx * 0.009;
    rotationRef.current.rx = Math.max(
      -0.85,
      Math.min(0.85, rotationRef.current.rx + dy * 0.007)
    );
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
  };

  const handlePointerUp = () => {
    dragRef.current.active = false;
  };

  return (
    <div className="glass-card holo-border overflow-hidden p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-600 dark:text-cyan-300">
            <Cpu className="h-3.5 w-3.5" />
            Volumetric 3D Spatial Inventory Twin
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold tracking-normal text-emerald-500">
              <Radio className="h-2.5 w-2.5 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Drag to orbit · Hover any molecular stock orb to inspect live FEFO telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Cryo &amp; Ambient Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setAutoRotate((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              autoRotate
                ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400"
            }`}
          >
            <RotateCw className={`h-3.5 w-3.5 ${autoRotate ? "animate-spin" : ""}`} />
            Auto-Orbit
          </button>
        </div>
      </div>

      <div className="relative h-[330px] w-full rounded-xl bg-gradient-to-b from-[#02050D] via-[#071124] to-[#03060E] border border-white/10 overflow-hidden">
        {/* Sweeping Volumetric Laser Scanline */}
        <div className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent scanline-beam" />

        {/* Aerospace Corner HUD Reticles */}
        <div className="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 border-l-2 border-t-2 border-cyan-400/50 rounded-tl-sm" />
        <div className="pointer-events-none absolute top-2.5 right-2.5 h-4 w-4 border-r-2 border-t-2 border-cyan-400/50 rounded-tr-sm" />
        <div className="pointer-events-none absolute bottom-2.5 left-2.5 h-4 w-4 border-l-2 border-b-2 border-cyan-400/50 rounded-bl-sm" />
        <div className="pointer-events-none absolute bottom-2.5 right-2.5 h-4 w-4 border-r-2 border-b-2 border-cyan-400/50 rounded-br-sm" />

        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            handlePointerUp();
            setHovered(null);
          }}
          className="h-full w-full cursor-grab active:cursor-grabbing touch-none"
        />

        {/* Interactive Node Inspection HUD Tooltip */}
        {hovered && (
          <div
            style={{
              left: Math.min(Math.max(hovered.x + 14, 12), 290),
              top: Math.max(hovered.y - 54, 12),
            }}
            className="pointer-events-none absolute z-20 w-56 rounded-xl border border-cyan-400/40 bg-[#050B17]/95 p-3 backdrop-blur-xl shadow-glow-cyan"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300">
              <span>{hovered.node.label}</span>
              <span>{hovered.node.qty} units</span>
            </div>
            <div className="mt-1 text-xs font-bold text-white truncate">
              {hovered.node.name}
            </div>
            <div className="mt-1 text-[10px] text-slate-400 truncate">
              {hovered.node.zoneLabel}
            </div>
            <div className="mt-1.5 text-[10px] font-semibold text-emerald-300">
              {hovered.node.daysLeft <= 0
                ? "EXPIRED — QUARANTINE REQUIRED"
                : `FEFO Horizon: ${hovered.node.daysLeft} days left`}
            </div>
          </div>
        )}

        {/* Top-Left Legend HUD */}
        <div className="pointer-events-none absolute top-3.5 left-4 flex flex-wrap gap-1.5">
          {[
            { label: "Safe", dot: "bg-emerald-400", text: "text-emerald-300" },
            { label: "90d Watch", dot: "bg-cyan-400", text: "text-cyan-300" },
            { label: "60d Warn", dot: "bg-amber-400", text: "text-amber-300" },
            { label: "Critical", dot: "bg-rose-500 animate-pulse", text: "text-rose-300" },
          ].map((item) => (
            <span
              key={item.label}
              className={`inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold ${item.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
              {item.label}
            </span>
          ))}
        </div>

        {/* Bottom-Right Engine Telemetry */}
        <div className="pointer-events-none absolute bottom-3.5 right-4 flex items-center gap-2 rounded-lg bg-slate-950/85 border border-white/10 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur-md">
          {hasBreach ? (
            <>
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
              <span className="text-rose-300 font-bold tracking-wide">
                THERMAL ANOMALY DETECTED
              </span>
            </>
          ) : (
            <>
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span>{batches.length} Synced Molecular Stock Nodes · 60 FPS</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
