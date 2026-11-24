"use client";

import React, { useState } from "react";
import {
  Cpu,
  Layers,
  QrCode,
  Radio,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Truck,
} from "lucide-react";
import { InventoryBatch, RestockOrder, StorageZone } from "@/types/pharminvin";

interface IsometricPipelineProps {
  batches: InventoryBatch[];
  zones: StorageZone[];
  orders: RestockOrder[];
  onNavigate: (tab: string) => void;
}

type MaterialFinish = "obsidian" | "titanium" | "carbon" | "chrome";

export default function IsometricPipeline({
  batches,
  zones,
  orders,
  onNavigate,
}: IsometricPipelineProps) {
  const [material, setMaterial] = useState<MaterialFinish>("titanium");
  const [activeNode, setActiveNode] = useState<string>("iot");

  const cryoZone = zones[0];
  const isBreach = zones.some((z) => z.status === "breach");
  const activeBatchCount = batches.filter((b) => b.status === "active").length;

  const materialClasses: Record<MaterialFinish, string> = {
    obsidian: "glass-card",
    titanium: "glass-card mat-titanium",
    carbon: "glass-card mat-carbon",
    chrome: "glass-card mat-chrome",
  };

  const pipelineNodes = [
    {
      id: "iot",
      title: "IoT Cryo-Vaults",
      metric: `${cryoZone?.currentTemp ?? 4.3}°C`,
      sub: `${zones.length} thermal zones live`,
      target: "storage",
      x: 56,
      y: 126,
      color: isBreach ? "#F43F5E" : "#06B6D4",
      icon: Thermometer,
    },
    {
      id: "fefo",
      title: "Neural FEFO Core",
      metric: `${activeBatchCount} Batches`,
      sub: "Auto-sorted by expiry",
      target: "inventory",
      x: 196,
      y: 74,
      color: "#10B981",
      icon: Cpu,
    },
    {
      id: "supply",
      title: "AI Procurement",
      metric: `${orders.length} Active POs`,
      sub: "Multi-factor trust score",
      target: "suppliers",
      x: 336,
      y: 126,
      color: "#0D9488",
      icon: Truck,
    },
    {
      id: "patient",
      title: "Patient QR Care",
      metric: "Verified Rx",
      sub: "Adherence telemetry",
      target: "patient",
      x: 196,
      y: 184,
      color: "#818CF8",
      icon: QrCode,
    },
  ];

  const selectedDetail =
    pipelineNodes.find((n) => n.id === activeNode) || pipelineNodes[0];

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* LEFT: Isometric 3D System Architecture Diagram */}
      <div className="glass-card p-5 xl:col-span-7 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-600 dark:text-cyan-300">
              <Layers className="h-3.5 w-3.5" />
              3D Isometric System Architecture
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any isometric module to inspect live data flow or jump directly into its engine
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-mono font-semibold text-teal-700 dark:text-cyan-300">
            <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
            PIPELINE SYNC: 14ms
          </span>
        </div>

        {/* True Isometric SVG Scene */}
        <div className="relative rounded-xl border border-slate-200/70 dark:border-white/10 bg-gradient-to-b from-[#040915] via-[#071326] to-[#040812] p-3 overflow-hidden">
          <svg
            viewBox="0 0 490 265"
            className="w-full h-[235px] sm:h-[250px]"
            role="img"
            aria-label="Pharminvin 3D Isometric System Diagram"
          >
            <defs>
              <linearGradient id="isoTop" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1E293B" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="isoBaseGrid" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.06" />
              </linearGradient>
              <filter id="neonGlow">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Isometric Floor Platform Slab */}
            <polygon
              points="245,24 468,132 245,242 22,132"
              fill="rgba(6, 182, 212, 0.04)"
              stroke="url(#isoBaseGrid)"
              strokeWidth="1.2"
            />
            <polygon
              points="245,42 435,132 245,224 55,132"
              fill="none"
              stroke="rgba(148, 163, 184, 0.12)"
              strokeDasharray="4 6"
            />

            {/* Animated Fiber-Optic Isometric Data Pipelines */}
            <g fill="none" strokeWidth="2" filter="url(#neonGlow)">
              <path
                id="pipe1"
                d="M 106 142 L 245 92"
                stroke="#06B6D4"
                strokeOpacity="0.6"
              />
              <path
                id="pipe2"
                d="M 245 92 L 384 142"
                stroke="#10B981"
                strokeOpacity="0.6"
              />
              <path
                id="pipe3"
                d="M 384 142 L 245 200"
                stroke="#0D9488"
                strokeOpacity="0.6"
              />
              <path
                id="pipe4"
                d="M 245 200 L 106 142"
                stroke="#818CF8"
                strokeOpacity="0.55"
              />
            </g>

            {/* Traveling Glowing Data Packets */}
            {[
              { path: "#pipe1", color: "#67E8F9", dur: "2.4s" },
              { path: "#pipe2", color: "#34D399", dur: "2.8s" },
              { path: "#pipe3", color: "#2DD4BF", dur: "2.6s" },
              { path: "#pipe4", color: "#A5B4FC", dur: "3.1s" },
            ].map((pkt, idx) => (
              <circle key={idx} r="3.2" fill={pkt.color} filter="url(#neonGlow)">
                <animateMotion dur={pkt.dur} repeatCount="indefinite">
                  <mpath href={pkt.path} />
                </animateMotion>
              </circle>
            ))}

            {/* 4 Isometric 3D Architectural Module Blocks */}
            {pipelineNodes.map((node) => {
              const selected = activeNode === node.id;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setActiveNode(node.id)}
                  className="cursor-pointer group"
                >
                  {/* Drop Glow */}
                  <ellipse
                    cx="48"
                    cy="42"
                    rx="42"
                    ry="18"
                    fill={node.color}
                    fillOpacity={selected ? "0.26" : "0.1"}
                  />
                  {/* Left Face */}
                  <polygon
                    points="4,18 48,38 48,54 4,34"
                    fill="#081122"
                    stroke={node.color}
                    strokeOpacity={selected ? "0.95" : "0.45"}
                    strokeWidth="1.2"
                  />
                  {/* Right Face */}
                  <polygon
                    points="92,18 48,38 48,54 92,34"
                    fill="#0D192F"
                    stroke={node.color}
                    strokeOpacity={selected ? "0.95" : "0.45"}
                    strokeWidth="1.2"
                  />
                  {/* Top Isometric Deck */}
                  <polygon
                    points="48,-2 92,18 48,38 4,18"
                    fill="url(#isoTop)"
                    stroke={node.color}
                    strokeWidth={selected ? "1.8" : "1.1"}
                  />
                  {/* Floating Hologram Core */}
                  <circle
                    cx="48"
                    cy="16"
                    r="5.5"
                    fill={node.color}
                    filter="url(#neonGlow)"
                  />
                  <text
                    x="48"
                    y="-10"
                    textAnchor="middle"
                    fill="#F8FAFC"
                    fontSize="9.5"
                    fontWeight="700"
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    {node.title}
                  </text>
                  <text
                    x="48"
                    y="67"
                    textAnchor="middle"
                    fill={node.color}
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {node.metric}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Selected Pipeline Node Bar */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: selectedDetail.color }}
              />
              <span className="font-bold text-white">{selectedDetail.title}:</span>
              <span className="text-slate-300">{selectedDetail.sub}</span>
            </div>
            <button
              onClick={() => onNavigate(selectedDetail.target)}
              className="font-semibold text-cyan-400 hover:text-cyan-300 transition"
            >
              Launch Module →
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: 3D Floating Studio Hardware Mockup + Material Swatch Studio */}
      <div className={`${materialClasses[material]} p-5 xl:col-span-5 flex flex-col justify-between`}>
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-600 dark:text-cyan-300">
                <Sparkles className="h-3.5 w-3.5" />
                3D Cryo-Pod Hardware Twin
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sculptural IoT Edge Sensor · Live Studio Finish Selector
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>

          {/* 3D Floating Hardware Monolith Device */}
          <div className="relative my-4 flex items-center justify-center py-4">
            <div
              className={`absolute h-36 w-36 rounded-full blur-3xl ${
                isBreach ? "bg-rose-500/35" : "bg-cyan-500/30"
              }`}
            />

            <div
              className="relative w-full max-w-[290px] rounded-[26px] border border-white/25 bg-gradient-to-br from-slate-800/90 via-slate-950/95 to-slate-900/95 p-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.45)] animate-float"
              style={{
                transform: "perspective(900px) rotateY(-10deg) rotateX(6deg)",
              }}
            >
              {/* Brushed Metallic Top Rim Light */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="inline-flex items-center gap-1.5 text-cyan-300">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isBreach ? "bg-rose-500 animate-ping" : "bg-emerald-400"
                    }`}
                  />
                  PHV-NODE-01
                </span>
                <span>WHO GDP · BLE 5.3</span>
              </div>

              {/* Translucent OLED Hardware Display */}
              <div className="mt-3 rounded-2xl border border-cyan-400/25 bg-[#030916]/90 p-3.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">
                      {cryoZone?.name || "Cryo-Fridge A"}
                    </div>
                    <div
                      className={`font-display text-3xl font-bold tracking-tight mt-0.5 ${
                        isBreach ? "text-rose-400 animate-pulse" : "text-white"
                      }`}
                    >
                      {cryoZone?.currentTemp ?? 4.3}°C
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Humidity</div>
                    <div className="font-mono text-sm font-bold text-cyan-300">
                      {cryoZone?.humidity ?? 44}% RH
                    </div>
                  </div>
                </div>

                {/* Live Mini Optical Waveform */}
                <div className="mt-3 flex items-end gap-1 h-7">
                  {[35, 48, 42, 60, 52, 74, 65, 82, 58, 70, 62, 78].map(
                    (v, i) => (
                      <div
                        key={i}
                        style={{ height: `${v}%` }}
                        className={`flex-1 rounded-full ${
                          isBreach
                            ? "bg-gradient-to-t from-rose-600 to-amber-400"
                            : "bg-gradient-to-t from-teal-500 to-cyan-300"
                        }`}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Hardware Spec Footer */}
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>BATTERY 98%</span>
                <span className="text-emerald-400">SEAL LOCKED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Material & Texture Swatch Selector */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-white/10">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            <span>Chassis Material Swatch</span>
            <span className="text-cyan-400 capitalize">{material}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                { id: "obsidian", label: "Obsidian", swatch: "from-slate-900 to-slate-800" },
                { id: "titanium", label: "Titanium", swatch: "from-slate-400 via-slate-600 to-slate-800" },
                { id: "carbon", label: "Carbon", swatch: "from-zinc-900 via-slate-800 to-cyan-950" },
                { id: "chrome", label: "Chrome", swatch: "from-cyan-200 via-slate-300 to-indigo-300" },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => setMaterial(s.id)}
                className={`rounded-xl border p-1.5 text-center transition ${
                  material === s.id
                    ? "border-cyan-400 bg-cyan-500/15"
                    : "border-slate-300/60 dark:border-white/10 hover:border-white/30"
                }`}
              >
                <div
                  className={`h-4 w-full rounded-md bg-gradient-to-br ${s.swatch} border border-white/20`}
                />
                <div className="mt-1 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                  {s.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
