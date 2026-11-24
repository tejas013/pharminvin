"use client";

import React from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { BarChart3, Crosshair, TrendingUp } from "lucide-react";
import { DEMAND_FORECAST_DATA, VELOCITY_MATRIX_DATA } from "@/lib/seedData";
import { InventoryBatch } from "@/types/pharminvin";

interface MarketAnalyticsProps {
  batches: InventoryBatch[];
  onQuickRestock: (batchId: string) => Promise<void>;
}

const QUADRANT_COLORS: Record<string, string> = {
  "Fast-Mover": "#10B981",
  "Core Steady": "#06B6D4",
  "Slow-Mover": "#8B5CF6",
  "Critical Watch": "#F43F5E",
};

export default function MarketAnalytics({
  batches,
  onQuickRestock,
}: MarketAnalyticsProps) {
  // Automated Reorder Point (ROP) Analytics Table
  const ropRecommendations = batches
    .filter((b) => b.status === "active")
    .map((b) => {
      const avgDailyUsage =
        b.velocity === "fast" ? 18 : b.velocity === "medium" ? 8 : 3;
      const leadTimeDays = b.shelfZoneId === "zone-ambient-c" ? 3 : 5;
      const safetyStock = Math.round(avgDailyUsage * 3.5);
      const aiRop = avgDailyUsage * leadTimeDays + safetyStock;
      const daysCover = Math.max(0, Math.round(b.quantity / avgDailyUsage));
      const needsOrder = b.quantity <= aiRop;

      return {
        ...b,
        avgDailyUsage,
        aiRop,
        daysCover,
        needsOrder,
      };
    })
    .sort((a, b) => a.daysCover - b.daysCover);

  return (
    <div className="space-y-6">
      {/* Top Charts Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* 12-Month Seasonal Demand Forecast */}
        <div className="glass-card p-5 xl:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-cyan-400">
                <TrendingUp className="h-3.5 w-3.5" />
                12-Month AI Seasonal Demand Forecast
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Monsoon &amp; Winter Surge Predictive Volume (Units)
              </h3>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
              MAPE Accuracy: 96.4%
            </span>
          </div>

          <div className="h-[290px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={DEMAND_FORECAST_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
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
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar
                  dataKey="actual"
                  name="Actual Dispensed"
                  fill="#0D9488"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="coldChainDemand"
                  name="Cold-Chain Share"
                  fill="#06B6D4"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="AI Forecast Curve"
                  stroke="#10B981"
                  strokeWidth={2.6}
                  dot={{ r: 3.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fast-Moving vs Slow-Moving Matrix */}
        <div className="glass-card p-5 xl:col-span-5">
          <div className="mb-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-cyan-400">
              <BarChart3 className="h-3.5 w-3.5" />
              Fast-Moving vs. Slow-Moving Matrix
            </div>
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Monthly Turnover vs. Margin (%)
            </h3>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 14, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis
                  type="number"
                  dataKey="monthlyTurnover"
                  name="Monthly Units"
                  stroke="#94A3B8"
                  fontSize={11}
                />
                <YAxis
                  type="number"
                  dataKey="marginPercent"
                  name="Margin %"
                  unit="%"
                  stroke="#94A3B8"
                  fontSize={11}
                />
                <ZAxis type="number" dataKey="daysOfCover" range={[70, 260]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    backgroundColor: "#0B1120",
                    borderColor: "rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#F8FAFC",
                  }}
                />
                <Scatter name="SKU Portfolio" data={VELOCITY_MATRIX_DATA}>
                  {VELOCITY_MATRIX_DATA.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={QUADRANT_COLORS[entry.quadrant] || "#06B6D4"}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
            {Object.entries(QUADRANT_COLORS).map(([label, hex]) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-300">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: hex }}
                />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Automated Reorder-Point (ROP) Recommendations */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-cyan-400">
              <Crosshair className="h-3.5 w-3.5" />
              Automated Reorder-Point (ROP) Engine
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Calculated via $ROP = (Daily\ Usage \times Lead\ Time) + Safety\ Stock$
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Medicine</th>
                <th className="py-3 px-4">Velocity</th>
                <th className="py-3 px-4">Current Qty</th>
                <th className="py-3 px-4">AI Reorder Point</th>
                <th className="py-3 px-4">Days of Cover</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
              {ropRecommendations.slice(0, 7).map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {row.name}
                    <div className="text-[11px] font-normal text-slate-400">
                      {row.batchId}
                    </div>
                  </td>
                  <td className="py-3 px-4 capitalize">
                    <span className="rounded-full bg-slate-200/70 dark:bg-white/10 px-2.5 py-0.5 text-[11px] font-medium">
                      {row.velocity} ({row.avgDailyUsage}/day)
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold">{row.quantity}</td>
                  <td className="py-3 px-4 font-mono text-cyan-600 dark:text-cyan-300">
                    {row.aiRop} units
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-bold ${
                        row.daysCover <= 7
                          ? "text-rose-500"
                          : row.daysCover <= 14
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {row.daysCover} days
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {row.needsOrder ? (
                      <button
                        onClick={() => onQuickRestock(row.id)}
                        className="rounded-lg bg-teal-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-teal-500 transition"
                      >
                        Top-Up +100
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-500 font-semibold">
                        Healthy Buffer
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
