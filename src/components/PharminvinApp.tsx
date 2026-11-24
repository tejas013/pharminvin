"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Command,
  Database,
  Flame,
  LayoutDashboard,
  LogOut,
  Moon,
  Package,
  QrCode,
  Search,
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
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [clock, setClock] = useState("");

  const [batches, setBatches] = useState<InventoryBatch[]>(getInitialInventory);
  const [zones, setZones] = useState<StorageZone[]>(getInitialStorageZones);
  const [suppliers, setSuppliers] = useState<Supplier[]>(getInitialSuppliers);
  const [orders, setOrders] = useState<RestockOrder[]>(getInitialOrders);
  const [prescriptions, setPrescriptions] = useState<DigitalPrescription[]>(
    getInitialPrescriptions
  );

  // Live Telemetry Clock
  useEffect(() => {
    const updateClock = () => {
      setClock(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Ctrl+K / Cmd+K Command Palette Shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((open) => !open);
      } else if (e.key === "Escape") {
        setCmdOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Hydrate persisted LocalStorage state + API sync
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
    setCmdOpen(false);
    notify("Signed out of Pharminvin");
  };

  const handleAddBatch = async (
    newBatchData: Omit<InventoryBatch, "id" | "status">
  ) => {
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
              breachReason:
                "Thermal excursion detected. Immediate inspection required.",
              telemetry: [
                ...z.telemetry.slice(-8),
                {
                  time: nowLabel,
                  temp: spikedTemp,
                  humidity: z.maxHumidity + 18,
                },
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
      notify(
        `Smart PO ${data.order.orderCode} dispatched to ${payload.supplierName}.`
      );
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

  const matchedBatches = useMemo(() => {
    if (!cmdQuery.trim()) return batches.slice(0, 3);
    const q = cmdQuery.toLowerCase();
    return batches
      .filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.batchId.toLowerCase().includes(q) ||
          b.genericName.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [batches, cmdQuery]);

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
      className={`min-h-screen w-full relative ${
        isDark ? "spatial-mesh-dark" : "spatial-mesh-light"
      }`}
    >
      <div className="pointer-events-none fixed inset-0 spatial-grid opacity-55" />
      <div className="pointer-events-none fixed inset-0 cinema-noise" />

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        {/* Spatial Glass Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-white/[0.08] bg-white/75 dark:bg-[#050A15]/80 backdrop-blur-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <BrandLogo size={40} />
            </div>

            <nav className="mt-6 flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex shrink-0 items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                      active
                        ? "bg-gradient-to-r from-teal-500/95 via-cyan-500/95 to-emerald-500/90 text-slate-950 shadow-glow-cyan"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {item.id === "storage" && activeBreachCount > 0 && (
                      <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white animate-pulse">
                        {activeBreachCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom User & Encrypted Sync Status */}
          <div className="hidden lg:block space-y-3 pt-6 border-t border-slate-200/80 dark:border-white/[0.08]">
            <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/80 dark:bg-white/[0.03] p-3.5 text-xs">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-500">
                  <User className="h-4 w-4" />
                </span>
                <span className="truncate">{user.fullName}</span>
              </div>
              <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user.facility}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                <span className="inline-flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  SYNC ACTIVE
                </span>
                <span className="text-slate-400">{clock} IST</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-white/15 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-rose-400 hover:text-rose-400 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              Switch Role / Sign Out
            </button>
          </div>
        </aside>

        {/* Main Workspace Canvas */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {/* Top Utility Command Header */}
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-600 dark:text-cyan-400">
                <Activity className="h-3.5 w-3.5" />
                {user.role === "admin"
                  ? "Pharminvin Spatial Command OS"
                  : "Patient Care & Adherence Hub"}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Command Palette Trigger */}
              {user.role === "admin" && (
                <button
                  onClick={() => setCmdOpen(true)}
                  className="glass-card hidden md:inline-flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-500 dark:text-slate-300 hover:border-cyan-400/50"
                >
                  <Search className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Quick Command or Search SKU...</span>
                  <kbd className="inline-flex items-center gap-0.5 rounded-md border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                    <Command className="h-2.5 w-2.5" />K
                  </kbd>
                </button>
              )}

              {activeBreachCount > 0 && user.role === "admin" && (
                <button
                  onClick={() => setActiveTab("storage")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white animate-pulse shadow-glow-crimson"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Cold-Chain Alert ({activeBreachCount})
                </button>
              )}

              <button
                onClick={() => setIsDark((d) => !d)}
                className="glass-card flex items-center gap-1.5 px-3 py-2 text-xs font-semibold hover:border-cyan-400/50"
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

          {/* Smooth Animated Module Transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
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
                  onQuickRestock={(id) =>
                    handleBatchAction(id, "restock", 100)
                  }
                />
              )}

              {activeTab === "patient" && (
                <PatientPortal
                  prescriptions={prescriptions}
                  onToggleDosage={handleToggleDosage}
                  isAdminPreview={user.role === "admin"}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Linear/Raycast Style Ctrl+K Spatial Command Palette */}
      {cmdOpen && (
        <div
          onClick={() => setCmdOpen(false)}
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 backdrop-blur-md pt-20 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card holo-border w-full max-w-xl overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-slate-200/80 dark:border-white/10 px-4 py-3.5">
              <Search className="h-4 w-4 text-cyan-400" />
              <input
                autoFocus
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                placeholder="Jump to module, search medicine batch, or trigger simulation..."
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                ESC
              </kbd>
            </div>

            <div className="p-3 space-y-3 max-h-[380px] overflow-y-auto text-xs">
              <div>
                <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Instant Actions
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setActiveTab("storage");
                      handleZoneAction("zone-cryo-a", "breach");
                      setCmdOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-rose-500 dark:text-rose-300 hover:bg-rose-500/15 transition"
                  >
                    <Flame className="h-3.5 w-3.5" />
                    Simulate Cryo-Fridge Breach
                  </button>
                  <button
                    onClick={() => {
                      setIsDark((d) => !d);
                      setCmdOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-cyan-500/15 transition"
                  >
                    {isDark ? (
                      <Sun className="h-3.5 w-3.5 text-amber-300" />
                    ) : (
                      <Moon className="h-3.5 w-3.5 text-teal-600" />
                    )}
                    Toggle Spatial Dark / Light
                  </button>
                </div>
              </div>

              <div>
                <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Matching Inventory Batches
                </div>
                <div className="space-y-1">
                  {matchedBatches.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setActiveTab("inventory");
                        setCmdOpen(false);
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-cyan-500/15 transition"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {b.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {b.batchId} · {b.shelfZoneLabel}
                        </div>
                      </div>
                      <span className="font-bold text-cyan-500">
                        {b.quantity} units
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spatial Glass Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-cyan-400/40 bg-[#050C1B]/95 px-4 py-3 text-xs font-semibold text-cyan-200 shadow-glow-cyan backdrop-blur-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
