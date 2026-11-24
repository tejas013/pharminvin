"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  Box,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sparkles,
  Thermometer,
  Truck,
  Zap,
} from "lucide-react";
import { InventoryBatch, RestockOrder, StorageZone } from "@/types/pharminvin";
import Spatial3DVisualizer from "./Spatial3DVisualizer";
import SpatialCard from "./SpatialCard";

interface CommandCenterProps {
  batches: InventoryBatch[];
  zones: StorageZone[];
  orders: RestockOrder[];
  onNavigate: (tab: string) => void;
}

function getDaysUntil(dateStr: string): number {
  return Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

export default function CommandCenter({
  batches,
  zones,
  orders,
  onNavigate,
}: CommandCenterProps) {
  const activeBatches = batches.filter((b) => b.status === "active");
  const totalUnits = activeBatches.reduce((sum, b) => sum + b.quantity, 0);
  const totalValuation = activeBatches.reduce(
    (sum, b) => sum + b.quantity * b.unitPrice,
    0
  );
  const expiring30 = activeBatches.filter(
    (b) => getDaysUntil(b.expiryDate) <= 30
  );
  const lowStockCount = activeBatches.filter(
    (b) => b.quantity <= b.reorderPoint
  ).length;
  const breachedZones = zones.filter((z) => z.status === "breach");
  const stockHealthPct = Math.max(
    42,
    Math.min(
      99,
      Math.round(
        ((activeBatches.length - expiring30.length * 0.6 - lowStockCount * 0.4) /
          Math.max(1, activeBatches.length)) *
          100
      )
    )
  );

  const kpis = [
    {
      label: "Active Stock Units",
      value: totalUnits.toLocaleString("en-IN"),
      sub: `Portfolio Value: ₹${(totalValuation / 100000).toFixed(2)}L`,
      icon: Box,
      accent: "from-teal-400 to-cyan-500",
      glow: "rgba(6, 182, 212, 0.25)",
      bars: [42, 58, 65, 74, 88, 95],
      target: "inventory",
    },
    {
      label: "AI Stock Health Index",
      value: `${stockHealthPct}%`,
      sub: `${lowStockCount} SKU(s) queued for ROP`,
      icon: CheckCircle2,
      accent: "from-emerald-400 to-teal-500",
      glow: "rgba(16, 185, 129, 0.25)",
      bars: [78, 82, 80, 86, 91, stockHealthPct],
      target: "analytics",
    },
    {
      label: "Critical Expiry (≤30d)",
      value: String(expiring30.length),
      sub: "Auto-locked at top of FEFO queue",
      icon: Clock,
      accent: "from-amber-400 to-rose-500",
      glow: "rgba(245, 158, 11, 0.25)",
      bars: [22, 35, 50, 44, 68, 82],
      target: "inventory",
    },
    {
      label: "Cold-Chain Telemetry",
      value:
        breachedZones.length > 0
          ? `${breachedZones.length} BREACH`
          : "100% OPTIMAL",
      sub: `${zones.length} IoT vaults reporting @ 12ms`,
      icon: breachedZones.length > 0 ? ShieldAlert : Thermometer,
      accent:
        breachedZones.length > 0
          ? "from-rose-500 to-red-600"
          : "from-cyan-400 to-blue-500",
      glow:
        breachedZones.length > 0
          ? "rgba(244, 63, 94, 0.32)"
          : "rgba(6, 182, 212, 0.25)",
      bars: [88, 92, 90, 94, 91, breachedZones.length > 0 ? 35 : 98],
      target: "storage",
    },
  ];

  const upcomingExpiries = [...activeBatches]
    .sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    )
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Executive Spatial Hero Strip */}
      <div className="glass-card p-5 sm:p-6 overflow-hidden">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-teal-700 dark:text-cyan-300">
              <Sparkles className="h-3 w-3" />
              Autonomous Pharmacy Intelligence Active
            </div>
            <h2 className="mt-2 font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Real-Time Inventory, Cryo-Vault &amp; FEFO Operations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Zero-waste expiry tracking synced across {activeBatches.length}{" "}
              active batches and {zones.length} IoT thermal chambers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate("storage")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 transition"
            >
              <Thermometer className="h-3.5 w-3.5" />
              Test IoT Breach
            </button>
            <button
              onClick={() => onNavigate("suppliers")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-glow-cyan hover:brightness-110 transition"
            >
              <Zap className="h-3.5 w-3.5" />
              1-Click Smart Restock
            </button>
          </div>
        </div>
      </div>

      {/* 3D Spotlight KPI Bento Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
            >
              <SpatialCard
                onClick={() => onNavigate(kpi.target)}
                glowColor={kpi.glow}
                className="p-5 h-full group"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.accent} text-slate-950 shadow-md`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>

                <div className="mt-4 flex items-end justify-between gap-2">
                  <div>
                    <div className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {kpi.value}
                    </div>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                      {kpi.label}
                    </div>
                  </div>

                  {/* Mini Telemetry Spark-Bars */}
                  <div className="flex items-end gap-1 h-8">
                    {kpi.bars.map((height, bIdx) => (
                      <span
                        key={bIdx}
                        style={{ height: `${Math.max(18, height)}%` }}
                        className={`w-1.5 rounded-full bg-gradient-to-t ${kpi.accent} opacity-75 group-hover:opacity-100 transition-all`}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/[0.07]">
                  {kpi.sub}
                </div>
              </SpatialCard>
            </motion.div>
          );
        })}
      </div>

      {/* Main Spatial Split: 3D Volumetric Twin + Live Action Feeds */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Spatial3DVisualizer batches={batches} zones={zones} />
        </div>

        <div className="xl:col-span-5 space-y-6">
          {/* Immediate FEFO Priority Spotlight */}
          <SpatialCard className="p-5" tiltStrength={3}>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  FEFO Immediate Dispatch Watchlist
                </h3>
              </div>
              <button
                onClick={() => onNavigate("inventory")}
                className="text-xs font-semibold text-teal-600 dark:text-cyan-400 hover:underline"
              >
                Open Engine →
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingExpiries.map((item) => {
                const days = getDaysUntil(item.expiryDate);
                const badgeClass =
                  days <= 0
                    ? "bg-rose-500/20 text-rose-500 dark:text-rose-300 border-rose-500/40"
                    : days <= 30
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30"
                    : days <= 60
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                    : "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30";

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200/70 dark:border-white/[0.08] bg-slate-50/70 dark:bg-slate-950/60 px-3.5 py-2.5 transition hover:border-cyan-400/35"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {item.batchId} · {item.quantity} units
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass}`}
                    >
                      {days <= 0
                        ? `Expired (${Math.abs(days)}d)`
                        : `${days}d left`}
                    </span>
                  </div>
                );
              })}
            </div>
          </SpatialCard>

          {/* Live Cold-Chain & Procurement Snapshot */}
          <SpatialCard className="p-5" tiltStrength={3}>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-cyan-400" />
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Live IoT Zone Pulse
                </h3>
              </div>
              <button
                onClick={() => onNavigate("storage")}
                className="text-xs font-semibold text-teal-600 dark:text-cyan-400 hover:underline"
              >
                Telemetry →
              </button>
            </div>

            <div className="space-y-2.5">
              {zones.map((z) => (
                <div
                  key={z.id}
                  className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 ${
                    z.status === "breach"
                      ? "border-rose-500/50 bg-rose-500/10"
                      : "border-slate-200/70 dark:border-white/[0.08] bg-slate-50/70 dark:bg-slate-950/60"
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {z.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {z.minTemp}°C to {z.maxTemp}°C · RH {z.humidity}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-display text-base font-bold ${
                        z.status === "breach"
                          ? "text-rose-500 animate-pulse"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {z.currentTemp}°C
                    </div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                      {z.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Truck className="h-3.5 w-3.5 text-teal-400" />
                Active Restock POs:{" "}
                <strong className="text-slate-800 dark:text-white">
                  {orders.length}
                </strong>
              </span>
              <button
                onClick={() => onNavigate("suppliers")}
                className="font-semibold text-teal-600 dark:text-cyan-400 hover:underline"
              >
                Optimize Orders →
              </button>
            </div>
          </SpatialCard>
        </div>
      </div>
    </div>
  );
}
