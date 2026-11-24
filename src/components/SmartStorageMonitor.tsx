"use client";

import React, { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Flame,
  ShieldAlert,
  Thermometer,
  Volume2,
} from "lucide-react";
import { InventoryBatch, StorageZone } from "@/types/pharminvin";

interface SmartStorageMonitorProps {
  zones: StorageZone[];
  batches: InventoryBatch[];
  onZoneAction: (zoneId: string, action: "breach" | "stabilize") => Promise<void>;
}

function playBreachAlarm() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    [0, 0.22, 0.44].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, ctx.currentTime + offset);
      osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + offset + 0.16);
      gain.gain.setValueAtTime(0.09, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.18);
    });
  } catch {
    // Audio playback silently ignored if blocked by browser policy
  }
}

export default function SmartStorageMonitor({
  zones,
  batches,
  onZoneAction,
}: SmartStorageMonitorProps) {
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id || "zone-cryo-a");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const selectedZone =
    zones.find((z) => z.id === selectedZoneId) || zones[0];

  const affectedBatches = batches.filter(
    (b) => b.shelfZoneId === selectedZone?.id && b.status === "active"
  );

  const handleSimulateBreach = async (zoneId: string) => {
    setSelectedZoneId(zoneId);
    if (soundEnabled) playBreachAlarm();
    await onZoneAction(zoneId, "breach");
  };

  return (
    <div className="space-y-6">
      {/* Global Thermal Alert Banner if any zone breached */}
      {zones.some((z) => z.status === "breach") && (
        <div className="rounded-2xl border border-rose-500/50 bg-rose-500/15 p-4 flex flex-wrap items-center justify-between gap-4 shadow-glow-crimson">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 text-rose-500 shrink-0 animate-bounce" />
            <div>
              <h3 className="font-display text-sm font-bold text-rose-600 dark:text-rose-200">
                CRITICAL COLD-CHAIN THRESHOLD BREACH ACTIVE
              </h3>
              <p className="text-xs text-rose-700/90 dark:text-rose-300 mt-0.5">
                Affected batches have been flagged for potency inspection. Engage
                backup cryo-compressor immediately.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              zones
                .filter((z) => z.status === "breach")
                .forEach((z) => onZoneAction(z.id, "stabilize"));
            }}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition"
          >
            Engage Backup Cooling &amp; Stabilize All
          </button>
        </div>
      )}

      {/* Storage Zone Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {zones.map((zone) => {
          const zoneBatches = batches.filter(
            (b) => b.shelfZoneId === zone.id && b.status === "active"
          );
          const isSelected = selectedZone?.id === zone.id;
          const isBreach = zone.status === "breach";

          return (
            <div
              key={zone.id}
              onClick={() => setSelectedZoneId(zone.id)}
              className={`glass-card cursor-pointer p-5 transition ${
                isBreach
                  ? "border-rose-500/60 shadow-glow-crimson bg-rose-500/[0.06]"
                  : isSelected
                  ? "border-cyan-500/60 shadow-glow-cyan"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {zone.code}
                  </span>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {zone.name}
                  </h3>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    isBreach
                      ? "bg-rose-500/20 text-rose-500 animate-pulse"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                  }`}
                >
                  {isBreach ? (
                    <>
                      <AlertTriangle className="h-3 w-3" /> BREACH
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> Optimal
                    </>
                  )}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-100/80 dark:bg-slate-950/60 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Thermometer className="h-3.5 w-3.5 text-cyan-500" />
                    Temperature
                  </div>
                  <div
                    className={`mt-1 font-display text-2xl font-bold ${
                      isBreach
                        ? "text-rose-500"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {zone.currentTemp}°C
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Limit: {zone.minTemp}°C to {zone.maxTemp}°C
                  </div>
                </div>

                <div className="rounded-xl bg-slate-100/80 dark:bg-slate-950/60 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Droplets className="h-3.5 w-3.5 text-teal-500" />
                    Humidity
                  </div>
                  <div className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">
                    {zone.humidity}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Ceiling: ≤{zone.maxHumidity}% RH
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {zoneBatches.length} active batch(es) stored
                </span>

                {isBreach ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onZoneAction(zone.id, "stabilize");
                    }}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500"
                  >
                    Stabilize Zone
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSimulateBreach(zone.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-500/20"
                  >
                    <Flame className="h-3 w-3" />
                    Simulate Breach
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Telemetry Wave Chart + Mapped Affected Batches */}
      {selectedZone && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="glass-card p-5 xl:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  {selectedZone.name} — Live IoT Telemetry Wave
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time sensor feed (°C &amp; %RH) with upper threshold limit line
                </p>
              </div>
              <button
                onClick={() => setSoundEnabled((s) => !s)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                  soundEnabled
                    ? "border-cyan-500/40 bg-cyan-500/15 text-teal-700 dark:text-cyan-300"
                    : "border-slate-300 dark:border-white/10 text-slate-400"
                }`}
              >
                <Volume2 className="h-3.5 w-3.5" />
                Audio Alarm: {soundEnabled ? "ON" : "MUTED"}
              </button>
            </div>

            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedZone.telemetry}>
                  <defs>
                    <linearGradient id="tempWave" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={
                          selectedZone.status === "breach" ? "#F43F5E" : "#06B6D4"
                        }
                        stopOpacity={0.45}
                      />
                      <stop
                        offset="95%"
                        stopColor={
                          selectedZone.status === "breach" ? "#F43F5E" : "#06B6D4"
                        }
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                    <linearGradient id="humWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0B1120",
                      borderColor: "rgba(255,255,255,0.12)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#F8FAFC",
                    }}
                  />
                  <ReferenceLine
                    y={selectedZone.maxTemp}
                    stroke="#F43F5E"
                    strokeDasharray="4 4"
                    label={{
                      value: `Max ${selectedZone.maxTemp}°C`,
                      fill: "#F43F5E",
                      fontSize: 11,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="temp"
                    name="Temperature (°C)"
                    stroke={selectedZone.status === "breach" ? "#F43F5E" : "#06B6D4"}
                    strokeWidth={2.5}
                    fill="url(#tempWave)"
                  />
                  <Area
                    type="monotone"
                    dataKey="humidity"
                    name="Humidity (%)"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#humWave)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Exact Affected Batches Mapped to Zone */}
          <div className="glass-card p-5 xl:col-span-4">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Batches Mapped to {selectedZone.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
              {selectedZone.status === "breach"
                ? selectedZone.breachReason
                : "All stored formulations operating inside validated stability envelope."}
            </p>

            <div className="space-y-2.5">
              {affectedBatches.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-xl border p-3 ${
                    selectedZone.status === "breach"
                      ? "border-rose-500/40 bg-rose-500/10"
                      : "border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-slate-950/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {b.name}
                    </span>
                    <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-300">
                      {b.batchId}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{b.quantity} units at risk</span>
                    <span className="font-semibold">
                      Value: ₹{(b.quantity * b.unitPrice).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
