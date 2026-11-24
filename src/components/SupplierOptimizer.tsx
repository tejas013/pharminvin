"use client";

import React, { useMemo, useState } from "react";
import {
  BadgeCheck,
  Clock,
  MapPin,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";
import {
  InventoryBatch,
  RestockOrder,
  RestockOrderItem,
  Supplier,
} from "@/types/pharminvin";

interface SupplierOptimizerProps {
  suppliers: Supplier[];
  batches: InventoryBatch[];
  orders: RestockOrder[];
  onCreateOrder: (payload: {
    supplierId: string;
    supplierName: string;
    etaHours: number;
    items: RestockOrderItem[];
  }) => Promise<void>;
  onAdvanceOrder: (orderId: string) => Promise<void>;
}

export default function SupplierOptimizer({
  suppliers,
  batches,
  orders,
  onCreateOrder,
  onAdvanceOrder,
}: SupplierOptimizerProps) {
  const [priority, setPriority] = useState<"balanced" | "speed" | "price">(
    "balanced"
  );
  const [generating, setGenerating] = useState(false);

  // Algorithmic Multi-Factor Supplier Scoring Engine
  const rankedSuppliers = useMemo(() => {
    const weights =
      priority === "speed"
        ? { price: 0.2, proximity: 0.5, trust: 0.3 }
        : priority === "price"
        ? { price: 0.55, proximity: 0.15, trust: 0.3 }
        : { price: 0.35, proximity: 0.3, trust: 0.35 };

    return [...suppliers]
      .map((s) => {
        const priceScore = Math.max(0, Math.min(100, (1.15 - s.unitPriceMultiplier) * 280));
        const proximityScore = Math.max(15, 100 - s.distanceKm * 0.12);
        const composite =
          priceScore * weights.price +
          proximityScore * weights.proximity +
          s.aiTrustScore * weights.trust;
        return {
          ...s,
          compositeScore: Number(composite.toFixed(1)),
        };
      })
      .sort((a, b) => b.compositeScore - a.compositeScore);
  }, [suppliers, priority]);

  // Auto-detect low-stock or expiring (<45d) medicines for One-Click Smart Restock
  const autoRestockItems: RestockOrderItem[] = useMemo(() => {
    const candidates = batches.filter((b) => {
      const days = Math.ceil(
        (new Date(b.expiryDate).getTime() - Date.now()) / 86400000
      );
      return b.status === "active" && (b.quantity <= b.reorderPoint || days <= 45);
    });

    const topSupplier = rankedSuppliers[0];
    const multiplier = topSupplier ? topSupplier.unitPriceMultiplier : 0.94;

    return candidates.map((b) => {
      const days = Math.ceil(
        (new Date(b.expiryDate).getTime() - Date.now()) / 86400000
      );
      const orderQty = Math.max(60, b.reorderPoint * 2 - b.quantity);
      return {
        batchName: b.name,
        genericName: b.genericName,
        quantity: orderQty,
        unitPrice: Math.round(b.unitPrice * multiplier),
        reason:
          days <= 45
            ? `Expiring in ${Math.max(0, days)}d (FEFO Replacement)`
            : `Below ROP (${b.quantity}/${b.reorderPoint})`,
      };
    });
  }, [batches, rankedSuppliers]);

  const estimatedTotal = autoRestockItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const handleOneClickRestock = async (supplier: Supplier) => {
    if (autoRestockItems.length === 0) return;
    setGenerating(true);
    const adjustedItems = autoRestockItems.map((item) => ({
      ...item,
      unitPrice: Math.round(
        item.unitPrice *
          (supplier.unitPriceMultiplier /
            (rankedSuppliers[0]?.unitPriceMultiplier || 1))
      ),
    }));
    await onCreateOrder({
      supplierId: supplier.id,
      supplierName: supplier.name,
      etaHours: supplier.estDeliveryHours,
      items: adjustedItems,
    });
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* One-Click Smart Restock Banner */}
      <div className="glass-card p-5 border-cyan-500/35">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-cyan-400">
              <Sparkles className="h-3.5 w-3.5" />
              AI Smart Restock Generator
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-1">
              {autoRestockItems.length} Critical / Low-Stock Medicines Ready for Auto-PO
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Optimal Partner:{" "}
              <strong className="text-teal-600 dark:text-cyan-300">
                {rankedSuppliers[0]?.name}
              </strong>{" "}
              · Estimated PO Value:{" "}
              <strong className="text-slate-900 dark:text-white">
                ₹{estimatedTotal.toLocaleString("en-IN")}
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950/70 p-1 text-xs">
              {(["balanced", "speed", "price"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPriority(mode)}
                  className={`rounded-lg px-3 py-1.5 font-semibold capitalize transition ${
                    priority === mode
                      ? "bg-white dark:bg-slate-800 text-teal-700 dark:text-cyan-300 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {rankedSuppliers[0] && (
              <button
                disabled={generating || autoRestockItems.length === 0}
                onClick={() => handleOneClickRestock(rankedSuppliers[0])}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-glow-cyan hover:brightness-110 disabled:opacity-50"
              >
                <Zap className="h-3.5 w-3.5" />
                {generating
                  ? "Generating PO..."
                  : "1-Click Smart Restock Order"}
              </button>
            )}
          </div>
        </div>

        {/* Auto-Populated Line Items Preview */}
        {autoRestockItems.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {autoRestockItems.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-slate-950/50 p-3 text-xs"
              >
                <div className="font-semibold truncate text-slate-900 dark:text-white">
                  {item.batchName}
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-300 mt-0.5">
                  {item.reason}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Qty: {item.quantity}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ₹{(item.quantity * item.unitPrice).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Algorithmic Ranked Suppliers Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rankedSuppliers.map((sup, index) => (
          <div
            key={sup.id}
            className={`glass-card glass-card-hover p-5 ${
              index === 0 ? "border-teal-500/45 dark:border-cyan-400/40" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 text-xs font-bold text-white">
                    #{index + 1}
                  </span>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    {sup.name}
                  </h3>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                    {sup.city} ({sup.distanceKm} km)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-teal-500" />
                    ETA {sup.estDeliveryHours}h
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Optimizer Score
                </div>
                <div className="font-display text-2xl font-bold text-teal-600 dark:text-cyan-300">
                  {sup.compositeScore}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-xl bg-slate-100/80 dark:bg-slate-950/60 p-2.5">
                <div className="text-[10px] text-slate-500">AI Trust Score</div>
                <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  {sup.aiTrustScore}%
                </div>
              </div>
              <div className="rounded-xl bg-slate-100/80 dark:bg-slate-950/60 p-2.5">
                <div className="text-[10px] text-slate-500">Price Index</div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {Math.round(sup.unitPriceMultiplier * 100)}% MRP
                </div>
              </div>
              <div className="rounded-xl bg-slate-100/80 dark:bg-slate-950/60 p-2.5">
                <div className="text-[10px] text-slate-500">Cold-Chain</div>
                <div className="inline-flex items-center gap-1 font-bold text-xs text-cyan-600 dark:text-cyan-300">
                  <BadgeCheck className="h-3.5 w-3.5" /> GDP Cert
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {sup.specialties.map((sp) => (
                  <span
                    key={sp}
                    className="rounded-md bg-slate-200/70 dark:bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300"
                  >
                    {sp}
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleOneClickRestock(sup)}
                disabled={generating || autoRestockItems.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-cyan-300 hover:bg-cyan-500/20"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                Order via Supplier
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Live Restock Orders Tracker */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-cyan-500" />
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Live Procurement &amp; Dispatch Pipeline
            </h3>
          </div>
          <span className="text-xs text-slate-500">{orders.length} order(s)</span>
        </div>

        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-950/50 p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-300">
                    {order.orderCode}
                  </span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {order.supplierName}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {order.items.length} SKU line(s) · Total:{" "}
                  <strong className="text-slate-800 dark:text-white">
                    ₹{order.totalCost.toLocaleString("en-IN")}
                  </strong>{" "}
                  · ETA: {order.etaHours === 0 ? "Arrived" : `${order.etaHours} hrs`}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    order.status === "Delivered"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                      : "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                  }`}
                >
                  {order.status}
                </span>

                {order.status !== "Delivered" && (
                  <button
                    onClick={() => onAdvanceOrder(order.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-white/15 px-3 py-1.5 text-[11px] font-semibold hover:border-cyan-400"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Advance Status
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
