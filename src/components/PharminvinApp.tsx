"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Database,
  LayoutDashboard,
  LogOut,
  Moon,
  Package,
  QrCode,
  ShieldAlert,
  Sun,
  Thermometer,
  Truck,
  User,
} from "lucide-react";
import {
  AuthUser,
  DigitalPrescription,
  InventoryBatch,
  RestockOrder,
  RestockOrderItem,
  StorageZone,
  Supplier,
} from "@/types/pharminvin";
import {
  getInitialInventory,
  getInitialOrders,
  getInitialPrescriptions,
  getInitialStorageZones,
  getInitialSuppliers,
} from "@/lib/seedData";
import BrandLogo from "./BrandLogo";
import AuthPortal from "./AuthPortal";
import CommandCenter from "./CommandCenter";
import InventoryEngine from "./InventoryEngine";
import SmartStorageMonitor from "./SmartStorageMonitor";
import SupplierOptimizer from "./SupplierOptimizer";
import MarketAnalytics from "./MarketAnalytics";
import PatientPortal from "./PatientPortal";

const LS_KEY = "pharminvin_live_state_v1";

export default function PharminvinApp() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState("command");
  const [toast, setToast] = useState<string | null>(null);

  const [batches, setBatches] = useState<InventoryBatch[]>(getInitialInventory);
  const [zones, setZones] = useState<StorageZone[]>(getInitialStorageZones);
  const [suppliers, setSuppliers] = useState<Supplier[]>(getInitialSuppliers);
  const [orders, setOrders] = useState<RestockOrder[]>(getInitialOrders);
  const [prescriptions, setPrescriptions] = useState<DigitalPrescription[]>(
    getInitialPrescriptions
  );

  // Hydrate theme + persisted LocalStorage state + live API sync
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user) setUser(parsed.user);
        if (parsed.batches) setBatches(parsed.batches);
        if (parsed.zones) setZones(parsed.zones);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.prescriptions) setPrescriptions(parsed.prescriptions);
      }
    } catch {
      // Ignore storage parse issues
    }

    // Pull initial suppliers/inventory from Next.js API routes
    Promise.all([
      fetch("/api/inventory").then((r) => r.json()).catch(() => null),
      fetch("/api/orders").then((r) => r.json()).catch(() => null),
    ]).then(([invRes, ordRes]) => {
      if (invRes?.source === "supabase" && invRes.batches?.length) {
        setBatches(invRes.batches);
      }
      if (ordRes?.suppliers?.length) {
        setSuppliers(ordRes.suppliers);
      }
    });
  }, []);

  // Persist live state to LocalStorage for zero-config instant durability
  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ user, batches, zones, orders, prescriptions })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [user, batches, zones, orders, prescriptions]);

  // Sync Tailwind dark class
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const handleLogin = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    setActiveTab(loggedInUser.role === "patient" ? "patient" : "command");
    notify(`Welcome, ${loggedInUser.fullName}`);
  };

  const handleLogout = () => {
    setUser(null);
    notify("Signed out of Pharminvin");
  };

  const handleAddBatch = async (newBatchData: Omit<InventoryBatch, "id" | "status">) => {
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBatchData),
      });
      const data = await res.json();
      const created: InventoryBatch = data.batch || {
        ...newBatchData,
        id: `inv-${Date.now()}`,
        status: "active",
      };
      setBatches((prev) => [created, ...prev]);
      notify(`Batch ${created.batchId} added to FEFO Engine.`);
    } catch {
      notify("Batch saved locally.");
    }
  };

  const handleBatchAction = async (
    id: string,
    action: "dispense" | "quarantine" | "restock",
    amount = 10
  ) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (action === "dispense") {
          const nextQty = Math.max(0, b.quantity - amount);
          return {
            ...b,
            quantity: nextQty,
            status: nextQty === 0 ? "depleted" : b.status,
          };
        }
        if (action === "quarantine") {
          return { ...b, status: "quarantined" };
        }
        return { ...b, quantity: b.quantity + amount, status: "active" };
      })
    );

    await fetch("/api/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, amount }),
    }).catch(() => null);

    notify(
      action === "dispense"
        ? `Dispensed ${amount} units via FEFO protocol.`
        : action === "quarantine"
        ? "Batch moved to Bio-Quarantine vault."
        : `Restocked +${amount} units.`
    );
  };

  const handleZoneAction = async (
    zoneId: string,
    action: "breach" | "stabilize"
  ) => {
    const res = await fetch("/api/storage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zoneId, action }),
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      if (data.zone) {
        setZones((prev) =>
          prev.map((z) => (z.id === zoneId ? data.zone : z))
        );
      }
    } else {
      setZones((prev) =>
        prev.map((z) => {
          if (z.id !== zoneId) return z;
          const nowLabel = new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          if (action === "breach") {
            const spikedTemp = Number((z.maxTemp + 5.6).toFixed(1));
            return {
              ...z,
              currentTemp: spikedTemp,
              humidity: Math.min(89, z.maxHumidity + 18),
              status: "breach",
              breachReason: "Thermal excursion detected. Immediate inspection required.",
              telemetry: [
                ...z.telemetry.slice(-8),
                { time: nowLabel, temp: spikedTemp, humidity: z.maxHumidity + 18 },
              ],
            };
          }
          const nom = Number(((z.minTemp + z.maxTemp) / 2).toFixed(1));
          return {
            ...z,
            currentTemp: nom,
            humidity: z.maxHumidity - 12,
            status: "optimal",
            breachReason: undefined,
            telemetry: [
              ...z.telemetry.slice(-8),
              { time: nowLabel, temp: nom, humidity: z.maxHumidity - 12 },
            ],
          };
        })
      );
    }

    notify(
      action === "breach"
        ? "ALERT: Threshold breach simulated! Affected batches flagged."
        : "Cooling stabilized. Zone restored to nominal envelope."
    );
  };

  const handleCreateOrder = async (payload: {
    supplierId: string;
    supplierName: string;
    etaHours: number;
    items: RestockOrderItem[];
  }) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      setOrders((prev) => [data.order, ...prev]);
      notify(`Smart PO ${data.order.orderCode} dispatched to ${payload.supplierName}.`);
    }
  };

  const handleAdvanceOrder = async (orderId: string) => {
    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? data.order : o))
      );
      notify(`Order ${data.order.orderCode} updated to: ${data.order.status}`);
    }
  };

  const handleToggleDosage = async (
    prescriptionId: string,
    medId: string,
    slot: "morning" | "afternoon" | "night"
  ) => {
    setPrescriptions((prev) =>
      prev.map((rx) =>
        rx.id !== prescriptionId
          ? rx
          : {
              ...rx,
              medications: rx.medications.map((m) =>
                m.id !== medId
                  ? m
                  : {
                      ...m,
                      takenToday: {
                        ...m.takenToday,
                        [slot]: !m.takenToday[slot],
                      },
                    }
              ),
            }
      )
    );

    await fetch("/api/prescriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prescriptionId, medId, slot }),
    }).catch(() => null);
  };

  if (!user) {
    return (
      <AuthPortal
        onLogin={handleLogin}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
      />
    );
  }

  const adminNav = [
    { id: "command", label: "Command Center", icon: LayoutDashboard },
    { id: "inventory", label: "FEFO Inventory", icon: Package },
    { id: "storage", label: "Cold-Chain IoT", icon: Thermometer },
    { id: "suppliers", label: "Procurement AI", icon: Truck },
    { id: "analytics", label: "Demand Analytics", icon: BarChart3 },
    { id: "patient", label: "Patient Portal (Preview)", icon: QrCode },
  ];

  const patientNav = [
    { id: "patient", label: "My Digital Rx & Dosage", icon: QrCode },
  ];

  const navItems = user.role === "admin" ? adminNav : patientNav;
  const activeBreachCount = zones.filter((z) => z.status === "breach").length;

  return (
    <div
      className={`min-h-screen w-full ${
        isDark ? "spatial-mesh-dark" : "spatial-mesh-light"
      }`}
    >
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Spatial Glass Sidebar */}
        <aside className="w-full lg:w-68 xl:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-white/10 bg-white/75 dark:bg-slate-950/65 backdrop-blur-xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <BrandLogo size={38} />
            </div>

            <nav className="mt-6 flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex shrink-0 items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                      active
                        ? "bg-gradient-to-r from-teal-600/90 to-cyan-600/90 text-white shadow-glow-teal"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {item.id === "storage" && activeBreachCount > 0 && (
                      <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white animate-pulse">
                        {activeBreachCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom User & System Status */}
          <div className="hidden lg:block space-y-3 pt-6 border-t border-slate-200/80 dark:border-white/10">
            <div className="rounded-xl bg-slate-100/80 dark:bg-white/[0.04] p-3 text-xs">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                <User className="h-4 w-4 text-cyan-500" />
                <span className="truncate">{user.fullName}</span>
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user.facility}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Database className="h-3 w-3" />
                API + Local Sync Live
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-white/15 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-rose-400 hover:text-rose-500 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              Switch Role / Sign Out
            </button>
          </div>
        </aside>

        {/* Main Workspace Canvas */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {/* Top Utility Header */}
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-teal-600 dark:text-cyan-400">
                <Activity className="h-3.5 w-3.5" />
                {user.role === "admin"
                  ? "Pharminvin Spatial Command Center"
                  : "Patient Care & Adherence Hub"}
              </div>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              {activeBreachCount > 0 && user.role === "admin" && (
                <button
                  onClick={() => setActiveTab("storage")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white animate-pulse shadow-glow-crimson"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Cold-Chain Alert ({activeBreachCount})
                </button>
              )}

              <button
                onClick={() => setIsDark((d) => !d)}
                className="glass-card flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
                title="Toggle Dark / Light Mode"
              >
                {isDark ? (
                  <>
                    <Sun className="h-4 w-4 text-amber-300" />
                    <span className="hidden sm:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-teal-700" />
                    <span className="hidden sm:inline">Obsidian</span>
                  </>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="lg:hidden glass-card p-2 text-slate-600 dark:text-slate-300"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Active Module Router */}
          {activeTab === "command" && user.role === "admin" && (
            <CommandCenter
              batches={batches}
              zones={zones}
              orders={orders}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "inventory" && user.role === "admin" && (
            <InventoryEngine
              batches={batches}
              zones={zones}
              onAddBatch={handleAddBatch}
              onBatchAction={handleBatchAction}
            />
          )}

          {activeTab === "storage" && user.role === "admin" && (
            <SmartStorageMonitor
              zones={zones}
              batches={batches}
              onZoneAction={handleZoneAction}
            />
          )}

          {activeTab === "suppliers" && user.role === "admin" && (
            <SupplierOptimizer
              suppliers={suppliers}
              batches={batches}
              orders={orders}
              onCreateOrder={handleCreateOrder}
              onAdvanceOrder={handleAdvanceOrder}
            />
          )}

          {activeTab === "analytics" && user.role === "admin" && (
            <MarketAnalytics
              batches={batches}
              onQuickRestock={(id) => handleBatchAction(id, "restock", 100)}
            />
          )}

          {activeTab === "patient" && (
            <PatientPortal
              prescriptions={prescriptions}
              onToggleDosage={handleToggleDosage}
              isAdminPreview={user.role === "admin"}
            />
          )}
        </main>
      </div>

      {/* Spatial Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-cyan-500/40 bg-slate-950/90 px-4 py-3 text-xs font-semibold text-cyan-200 shadow-glow-cyan backdrop-blur-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
