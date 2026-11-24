"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  PackagePlus,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { InventoryBatch, StorageZone } from "@/types/pharminvin";

interface InventoryEngineProps {
  batches: InventoryBatch[];
  zones: StorageZone[];
  onAddBatch: (batch: Omit<InventoryBatch, "id" | "status">) => Promise<void>;
  onBatchAction: (
    id: string,
    action: "dispense" | "quarantine" | "restock",
    amount?: number
  ) => Promise<void>;
}

function daysToExpiry(expiryDate: string): number {
  return Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

export default function InventoryEngine({
  batches,
  zones,
  onAddBatch,
  onBatchAction,
}: InventoryEngineProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [expiryFilter, setExpiryFilter] = useState<
    "all" | "30" | "60" | "90" | "quarantined"
  >("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    batchId: `PHV-${Math.floor(1000 + Math.random() * 9000)}`,
    name: "",
    genericName: "",
    manufacturer: "Cipla Ltd.",
    category: "Antibiotics" as InventoryBatch["category"],
    manufactureDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
    quantity: 120,
    reorderPoint: 80,
    unitPrice: 245,
    shelfZoneId: "zone-ambient-c",
    velocity: "fast" as InventoryBatch["velocity"],
  });

  const categories = [
    "All",
    "Biologics & Insulin",
    "Vaccines",
    "Cardiology",
    "Antibiotics",
    "Analgesics",
    "Oncology",
    "Respiratory",
  ];

  // Automated FEFO Queue: Active non-expired batches sorted strictly by nearest expiry
  const fefoQueue = useMemo(() => {
    return batches
      .filter((b) => b.status === "active" && b.quantity > 0 && daysToExpiry(b.expiryDate) > 0)
      .sort(
        (a, b) =>
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      );
  }, [batches]);

  const expiredActiveBatches = useMemo(
    () =>
      batches.filter(
        (b) => b.status === "active" && daysToExpiry(b.expiryDate) <= 0
      ),
    [batches]
  );

  const filteredBatches = useMemo(() => {
    return batches
      .filter((b) => {
        const q = search.toLowerCase();
        const matchesSearch =
          b.name.toLowerCase().includes(q) ||
          b.genericName.toLowerCase().includes(q) ||
          b.batchId.toLowerCase().includes(q) ||
          b.manufacturer.toLowerCase().includes(q);
        const matchesCategory =
          categoryFilter === "All" || b.category === categoryFilter;

        const d = daysToExpiry(b.expiryDate);
        let matchesExpiry = true;
        if (expiryFilter === "30") matchesExpiry = d <= 30 && b.status === "active";
        else if (expiryFilter === "60")
          matchesExpiry = d > 30 && d <= 60 && b.status === "active";
        else if (expiryFilter === "90")
          matchesExpiry = d > 60 && d <= 90 && b.status === "active";
        else if (expiryFilter === "quarantined")
          matchesExpiry = b.status === "quarantined";

        return matchesSearch && matchesCategory && matchesExpiry;
      })
      .sort(
        (a, b) =>
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      );
  }, [batches, search, categoryFilter, expiryFilter]);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const zone = zones.find((z) => z.id === form.shelfZoneId) || zones[0];
    await onAddBatch({
      ...form,
      quantity: Number(form.quantity),
      reorderPoint: Number(form.reorderPoint),
      unitPrice: Number(form.unitPrice),
      shelfZoneLabel: `${zone.name} [${zone.minTemp}°C–${zone.maxTemp}°C]`,
    });
    setSubmitting(false);
    setShowAddModal(false);
    setForm((prev) => ({
      ...prev,
      batchId: `PHV-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "",
      genericName: "",
    }));
  };

  const handleQuarantineAllExpired = async () => {
    for (const batch of expiredActiveBatches) {
      await onBatchAction(batch.id, "quarantine");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top FEFO Dispatch Spotlight */}
      <div className="glass-card p-5 border-teal-500/30 dark:border-cyan-400/25">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-cyan-400">
              <Sparkles className="h-3.5 w-3.5" />
              Automated FEFO (First-Expired, First-Out) Priority Queue
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-1">
              {fefoQueue[0]
                ? `Next Mandatory Dispatch: ${fefoQueue[0].name} (${fefoQueue[0].batchId})`
                : "All FEFO queues cleared"}
            </h2>
            {fefoQueue[0] && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Expires in{" "}
                <strong className="text-rose-500">
                  {daysToExpiry(fefoQueue[0].expiryDate)} days
                </strong>{" "}
                · Located in {fefoQueue[0].shelfZoneLabel} · Remaining:{" "}
                {fefoQueue[0].quantity} units
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {fefoQueue[0] && (
              <button
                onClick={() => onBatchAction(fefoQueue[0].id, "dispense", 10)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-glow-teal hover:brightness-110 transition"
              >
                Dispense 10 Units (FEFO #1)
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}

            {expiredActiveBatches.length > 0 && (
              <button
                onClick={handleQuarantineAllExpired}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-500/25 transition"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Quarantine Expired ({expiredActiveBatches.length})
              </button>
            )}

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-white hover:border-cyan-400 transition"
            >
              <PackagePlus className="h-3.5 w-3.5 text-cyan-500" />
              Add New Batch
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Expiry Tier Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by medicine, generic composition, Batch ID, or manufacturer..."
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 px-3 py-2 text-xs font-medium focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {(
            [
              { id: "all", label: "All Batches", cls: "border-slate-300 dark:border-white/15" },
              { id: "30", label: "30d Critical", cls: "border-rose-500/40 text-rose-500" },
              { id: "60", label: "60d Warning", cls: "border-amber-500/40 text-amber-500" },
              { id: "90", label: "90d Watch", cls: "border-cyan-500/40 text-cyan-500" },
              { id: "quarantined", label: "Quarantined", cls: "border-slate-500/40 text-slate-400" },
            ] as const
          ).map((pill) => (
            <button
              key={pill.id}
              onClick={() => setExpiryFilter(pill.id)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                expiryFilter === pill.id
                  ? "bg-cyan-500/20 border-cyan-500 text-teal-800 dark:text-cyan-200"
                  : `bg-white/60 dark:bg-slate-900/50 ${pill.cls}`
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Batch Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">FEFO / Batch ID</th>
                <th className="py-3.5 px-4">Medicine &amp; Manufacturer</th>
                <th className="py-3.5 px-4">Shelf Zone</th>
                <th className="py-3.5 px-4">Mfg / Expiry</th>
                <th className="py-3.5 px-4">Stock Level</th>
                <th className="py-3.5 px-4">Alert Tier</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/5 text-xs">
              {filteredBatches.map((batch) => {
                const days = daysToExpiry(batch.expiryDate);
                const isNextFefo = fefoQueue[0]?.id === batch.id;

                let alertBadge = (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
                    Safe ({days}d)
                  </span>
                );

                if (batch.status === "quarantined") {
                  alertBadge = (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                      Quarantined
                    </span>
                  );
                } else if (days <= 0) {
                  alertBadge = (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-600/25 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-300 animate-pulse">
                      <AlertTriangle className="h-3 w-3" /> EXPIRED
                    </span>
                  );
                } else if (days <= 30) {
                  alertBadge = (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-300">
                      30d Critical ({days}d)
                    </span>
                  );
                } else if (days <= 60) {
                  alertBadge = (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                      60d Warning ({days}d)
                    </span>
                  );
                } else if (days <= 90) {
                  alertBadge = (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
                      90d Watch ({days}d)
                    </span>
                  );
                }

                return (
                  <tr
                    key={batch.id}
                    className={`transition hover:bg-slate-50/70 dark:hover:bg-white/[0.03] ${
                      isNextFefo ? "bg-teal-500/[0.06] dark:bg-cyan-500/[0.06]" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 dark:text-cyan-200">
                      <div>{batch.batchId}</div>
                      {isNextFefo && (
                        <span className="mt-1 inline-block rounded bg-teal-600 px-1.5 py-0.5 text-[9px] font-sans font-bold uppercase text-white">
                          FEFO #1 NEXT
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {batch.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {batch.genericName} · {batch.manufacturer}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div>{batch.shelfZoneLabel}</div>
                      <div className="text-[11px] text-slate-400">{batch.category}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      <div>Mfg: {batch.manufactureDate}</div>
                      <div className="font-semibold text-slate-800 dark:text-white">
                        Exp: {batch.expiryDate}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {batch.quantity}{" "}
                        <span className="font-normal text-slate-400">units</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        ROP: {batch.reorderPoint} · ₹{batch.unitPrice}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{alertBadge}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {batch.status === "active" && days > 0 && (
                          <button
                            onClick={() => onBatchAction(batch.id, "dispense", 10)}
                            className="rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-teal-700 dark:text-cyan-300 hover:bg-cyan-500/20"
                          >
                            Dispense -10
                          </button>
                        )}
                        {batch.status !== "quarantined" && (
                          <button
                            onClick={() => onBatchAction(batch.id, "quarantine")}
                            className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-500/20"
                          >
                            Quarantine
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-xl p-6 border-cyan-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Register New Pharmaceutical Batch
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1">Batch ID</label>
                <input
                  required
                  value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Brand / Medicine Name</label>
                <input
                  required
                  placeholder="e.g. Azithral 500mg"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Generic Composition</label>
                <input
                  required
                  placeholder="e.g. Azithromycin IP 500mg"
                  value={form.genericName}
                  onChange={(e) => setForm({ ...form, genericName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Manufacturer</label>
                <input
                  required
                  value={form.manufacturer}
                  onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value as InventoryBatch["category"],
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                >
                  {categories
                    .filter((c) => c !== "All")
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Storage Zone</label>
                <select
                  value={form.shelfZoneId}
                  onChange={(e) => setForm({ ...form, shelfZoneId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Manufacture Date</label>
                <input
                  type="date"
                  required
                  value={form.manufactureDate}
                  onChange={(e) =>
                    setForm({ ...form, manufactureDate: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Quantity (Units)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Unit Price (INR ₹)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm({ ...form, unitPrice: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-300 dark:border-white/15 px-4 py-2 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-2 font-semibold text-white shadow-glow-teal"
                >
                  {submitting ? "Saving..." : "Add Batch to FEFO Engine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
