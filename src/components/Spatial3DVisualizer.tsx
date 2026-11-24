"use client";

import React, { useEffect, useRef, useState } from "react";
import { InventoryBatch, StorageZone } from "@/types/pharminvin";
import { Cpu, Layers, RotateCw, ShieldAlert } from "lucide-react";

interface Spatial3DVisualizerProps {
  batches: InventoryBatch[];
  zones: StorageZone[];
}

interface Node3D {
  x: number;
  y: number;
  z: number;
  label: string;
  color: string;
  size: number;
  zoneId: string;
}

export default function Spatial3DVisualizer({
  batches,
  zones,
}: Spatial3DVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const rotationRef = useRef({ rx: 0.25, ry: 0.4 });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });

  const hasBreach = zones.some((z) => z.status === "breach");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;

    // Build 3D Holographic Molecular Helix + Smart Rack Nodes from Live Inventory
    const buildNodes = (): Node3D[] => {
      const filtered =
        selectedZone === "all"
          ? batches
          : batches.filter((b) => b.shelfZoneId === selectedZone);

      const nodes: Node3D[] = [];
      const count = Math.max(filtered.length, 8);

      for (let i = 0; i < count; i++) {
        const batch = filtered[i % Math.max(filtered.length, 1)];
        const angle = (i / count) * Math.PI * 3.2;
        const radius = 105 + (i % 2 === 0 ? 18 : -16);
        const y = ((i / (count - 1 || 1)) - 0.5) * 165;

        const daysLeft = batch
          ? Math.ceil(
              (new Date(batch.expiryDate).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          : 120;

        const zoneBreached = batch
          ? zones.find((z) => z.id === batch.shelfZoneId)?.status === "breach"
          : false;

        let color = "#10B981"; // Electric Emerald
        if (zoneBreached || daysLeft <= 30) color = "#F43F5E"; // Critical Crimson
        else if (daysLeft <= 60) color = "#F59E0B"; // Warning Amber
        else if (daysLeft <= 90) color = "#06B6D4"; // Watch Cyan

        nodes.push({
          x: Math.cos(angle) * radius,
          y,
          z: Math.sin(angle) * radius,
          label: batch ? batch.batchId : `NODE-${i + 1}`,
          color,
          size: batch ? Math.min(10, Math.max(5, batch.quantity / 85)) : 6,
          zoneId: batch?.shelfZoneId || "zone-ambient-c",
        });

        // Complementary double-helix molecular node
        nodes.push({
          x: Math.cos(angle + Math.PI) * (radius * 0.72),
          y: y * 0.92,
          z: Math.sin(angle + Math.PI) * (radius * 0.72),
          label: "",
          color: zoneBreached ? "#FB7185" : "#0D9488",
          size: 3.4,
          zoneId: batch?.shelfZoneId || "zone-ambient-c",
        });
      }
      return nodes;
    };

    const nodes = buildNodes();

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      if (autoRotate && !dragRef.current.active) {
        rotationRef.current.ry += 0.0065;
      }

      const cx = w / 2;
      const cy = h / 2;
      const fov = 390;

      const cosY = Math.cos(rotationRef.current.ry);
      const sinY = Math.sin(rotationRef.current.ry);
      const cosX = Math.cos(rotationRef.current.rx);
      const sinX = Math.sin(rotationRef.current.rx);

      // Ambient holographic core glow
      const radial = ctx.createRadialGradient(cx, cy, 12, cx, cy, Math.min(w, h) * 0.48);
      radial.addColorStop(
        0,
        hasBreach ? "rgba(244, 63, 94, 0.22)" : "rgba(6, 182, 212, 0.18)"
      );
      radial.addColorStop(1, "rgba(6, 9, 19, 0)");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, w, h);

      // Project 3D coordinates to 2D perspective
      const projected = nodes.map((n) => {
        const x1 = n.x * cosY - n.z * sinY;
        const z1 = n.z * cosY + n.x * sinY;
        const y2 = n.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + n.y * sinX;

        const scale = fov / (fov + z2 + 210);
        return {
          ...n,
          px: cx + x1 * scale,
          py: cy + y2 * scale,
          scale,
          depth: z2,
        };
      });

      // Draw holographic molecular bonds between paired nodes & spine
      ctx.lineWidth = 1;
      for (let i = 0; i < projected.length; i += 2) {
        const a = projected[i];
        const b = projected[i + 1];
        if (a && b) {
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(b.px, b.py);
          ctx.strokeStyle = hasBreach
            ? "rgba(244, 63, 94, 0.34)"
            : "rgba(6, 182, 212, 0.28)";
          ctx.stroke();
        }
        const nextA = projected[i + 2];
        if (a && nextA) {
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(nextA.px, nextA.py);
          ctx.strokeStyle = "rgba(13, 148, 136, 0.32)";
          ctx.stroke();
        }
      }

      // Draw translucent 3D storage rings
      [-70, 0, 70].forEach((ringY) => {
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.2) {
          const rx3 = Math.cos(a) * 130;
          const rz3 = Math.sin(a) * 130;
          const x1 = rx3 * cosY - rz3 * sinY;
          const z1 = rz3 * cosY + rx3 * sinY;
          const y2 = ringY * cosX - z1 * sinX;
          const z2 = z1 * cosX + ringY * sinX;
          const s = fov / (fov + z2 + 210);
          const px = cx + x1 * s;
          const py = cy + y2 * s;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
        ctx.stroke();
      });

      // Depth-sorted nodes
      projected
        .sort((a, b) => b.depth - a.depth)
        .forEach((p) => {
          const radius = Math.max(2.2, p.size * p.scale);
          ctx.beginPath();
          ctx.arc(p.px, p.py, radius * 2.1, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}28`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();

          if (p.label && p.scale > 0.72) {
            ctx.font = "600 10px Inter, system-ui, sans-serif";
            ctx.fillStyle = "rgba(226, 232, 240, 0.86)";
            ctx.fillText(p.label, p.px + radius + 6, p.py + 3);
          }
        });

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
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    rotationRef.current.ry += dx * 0.009;
    rotationRef.current.rx = Math.max(
      -0.9,
      Math.min(0.9, rotationRef.current.rx + dy * 0.007)
    );
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
  };

  const handlePointerUp = () => {
    dragRef.current.active = false;
  };

  return (
    <div className="glass-card overflow-hidden p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-cyan-400">
            <Cpu className="h-3.5 w-3.5" />
            Interactive 3D Spatial Inventory Twin
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Drag to orbit molecular stock matrix — node colors reflect live FEFO expiry &amp; cold-chain telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/70 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Storage Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setAutoRotate((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              autoRotate
                ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400"
            }`}
          >
            <RotateCw className={`h-3.5 w-3.5 ${autoRotate ? "animate-spin" : ""}`} />
            Orbit
          </button>
        </div>
      </div>

      <div className="relative h-[290px] w-full rounded-xl bg-gradient-to-b from-[#040711] via-[#091224] to-[#060913] border border-white/10 overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="h-full w-full cursor-grab active:cursor-grabbing touch-none"
        />

        {/* Floating HUD Telemetry Overlay */}
        <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 border border-white/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Safe (&gt;90d)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 border border-white/10 px-2.5 py-1 text-[11px] font-medium text-cyan-300">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            Watch (90d)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 border border-white/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Warning (60d)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 border border-white/10 px-2.5 py-1 text-[11px] font-medium text-rose-300">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            Critical / Breach
          </span>
        </div>

        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2 rounded-lg bg-slate-950/80 border border-white/10 px-3 py-1.5 text-[11px] text-slate-300">
          {hasBreach ? (
            <>
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
              <span className="text-rose-300 font-semibold">
                THERMAL BREACH DETECTED IN TWIN
              </span>
            </>
          ) : (
            <>
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span>{batches.length} Active Molecular Stock Nodes</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
