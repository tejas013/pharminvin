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
  Thermometer,
  Truck,
} from "lucide-react";
import { InventoryBatch, RestockOrder, StorageZone } from "@/types/pharminvin";
import Spatial3DVisualizer from "./Spatial3DVisualizer";

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
  const expiring30 = activeBatches.filter((b) => getDaysUntil(b.expiryDate) <= 30);
  const lowStockCount = activeBatches.filter((b) => b.quantity <= b.reorderPoint).length;
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
      sub: `${activeBatches.length} active FEFO batches`,
      icon: Box,
      accent: "from-teal-500 to-cyan-500",
      target: "inventory",
    },
    {
      label: "Stock Health Index",
      value: `${stockHealthPct}%`,
      sub: `${lowStockCount} SKU(s) below ROP`,
      icon: CheckCircle2,
      accent: "from-emerald-500 to-teal-500",
      target: "analytics",
    },
    {
      label: "Critical Expiry (≤30d)",
      value: String(expiring30.length),
      sub: "Prioritized in FEFO queue",
      icon: Clock,
      accent: "from-amber-500 to-rose-500",
      target: "inventory",
    },
    {
      label: "Cold-Chain Status",
      value: breachedZones.length > 0 ? `${breachedZones.length} BREACH` : "100% OPTIMAL",
      sub: `${zones.length} IoT monitored zones`,
      icon: breachedZones.length > 0 ? ShieldAlert : Thermometer,
      accent:
        breachedZones.length > 0
          ? "from-rose-600 to-red-500"
          : "from-cyan-500 to-blue-500",
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
      {/* Live KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.button
              key={kpi.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              onClick={() => onNavigate(kpi.target)}
              className="glass-card glass-card-hover p-5 text-left group"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.accent} text-white shadow-md`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <div className="mt-4 font-display text-2xl font-bold text-slate-900 dark:text-white">
                {kpi.value}
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                {kpi.label}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {kpi.sub}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Main Split: 3D Twin + Live Action Feeds */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Spatial3DVisualizer batches={batches} zones={zones} />
        </div>

        <div className="xl:col-span-5 space-y-6">
          {/* Immediate FEFO Priority Spotlight */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  FEFO Immediate Dispatch Watchlist
                </h3>
              </div>
              <button
                onClick={() => onNavigate("inventory")}
                className="text-xs font-semibold text-teal-600 dark:text-cyan-400 hover:underline"
              >
                Open Engine
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingExpiries.map((item) => {
                const days = getDaysUntil(item.expiryDate);
                const badgeClass =
                  days <= 0
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/40"
                    : days <= 30
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30"
                    : days <= 60
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                    : "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30";

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-slate-950/50 px-3.5 py-2.5"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.batchId} · {item.quantity} units
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass}`}
                    >
                      {days <= 0 ? `Expired (${Math.abs(days)}d)` : `${days}d left`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Cold-Chain & Procurement Snapshot */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-cyan-500" />
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Live IoT Zone Pulse
                </h3>
              </div>
              <button
                onClick={() => onNavigate("storage")}
                className="text-xs font-semibold text-teal-600 dark:text-cyan-400 hover:underline"
              >
                Telemetry
              </button>
            </div>

            <div className="space-y-2.5">
              {zones.map((z) => (
                <div
                  key={z.id}
                  className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 ${
                    z.status === "breach"
                      ? "border-rose-500/50 bg-rose-500/10"
                      : "border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-slate-950/50"
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {z.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Range: {z.minTemp}°C to {z.maxTemp}°C · RH {z.humidity}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-display text-sm font-bold ${
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
                <Truck className="h-3.5 w-3.5 text-teal-500" />
                Active Restock POs: <strong className="text-slate-800 dark:text-white">{orders.length}</strong>
              </span>
              <button
                onClick={() => onNavigate("suppliers")}
                className="font-semibold text-teal-600 dark:text-cyan-400 hover:underline"
              >
                Optimize Orders →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
