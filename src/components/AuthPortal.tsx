"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Cpu,
  Lock,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import SpatialCard from "./SpatialCard";
import { AuthUser, UserRole } from "@/types/pharminvin";

interface AuthPortalProps {
  onLogin: (user: AuthUser) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export default function AuthPortal({
  onLogin,
  isDark,
  onToggleTheme,
}: AuthPortalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("dr.sharma@pharminvin.ai");
  const [password, setPassword] = useState("Pharminvin@2026");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, email, password, fullName, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");
      onLogin(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "demo", role: demoRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Demo login failed");
      onLogin(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full relative overflow-hidden flex items-center justify-center p-4 sm:p-8 ${
        isDark ? "spatial-mesh-dark" : "spatial-mesh-light"
      }`}
    >
      {/* Volumetric Background Grid + Ambient Floating Orbs + Film Grain */}
      <div className="pointer-events-none absolute inset-0 spatial-grid opacity-80" />
      <div className="pointer-events-none absolute inset-0 cinema-noise" />
      <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px] animate-pulse-slow" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-teal-500/20 blur-[120px] animate-pulse-slow" />

      {/* Top Glass Header Strip */}
      <div className="absolute top-5 inset-x-5 sm:inset-x-8 z-20 flex items-center justify-between">
        <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl px-3.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-cyan-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          CDSCO &amp; WHO GDP Cold-Chain Architecture · v2.6 Spatial
        </div>

        <button
          onClick={onToggleTheme}
          className="ml-auto glass-card flex items-center gap-2 px-3.5 py-2 text-xs font-semibold hover:border-cyan-400/50"
        >
          {isDark ? (
            <>
              <Sun className="h-4 w-4 text-amber-300" />
              <span>Clinical Light</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-teal-700" />
              <span>Spatial Obsidian</span>
            </>
          )}
        </button>
      </div>

      <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 gap-10 lg:grid-cols-12 items-center pt-10 sm:pt-0">
        {/* Left Spatial Studio Hero */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-6 space-y-6"
        >
          <BrandLogo size={54} subtitle="NATIONAL SMART PHARMACY OS" />

          <h1 className="font-display text-4xl sm:text-5xl xl:text-[54px] font-bold tracking-tight leading-[1.04] text-slate-900 dark:text-white">
            Zero-Waste Pharma Inventory &amp;{" "}
            <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Cold-Chain Intelligence.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300/85 leading-relaxed max-w-xl">
            An autonomous spatial operating system engineered for FEFO expiry
            elimination, live IoT cryo-vault telemetry, algorithmic procurement
            scoring, and QR-verified digital patient care.
          </p>

          {/* Live Micro-Metric Telemetry Strip */}
          <div className="flex flex-wrap gap-2.5">
            {[
              { icon: Cpu, label: "3D Spatial Digital Twin" },
              { icon: Activity, label: "99.98% Cold-Chain SLA" },
              { icon: Sparkles, label: "AI Demand & ROP Engine" },
            ].map((chip) => {
              const Icon = chip.icon;
              return (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 backdrop-blur-md"
                >
                  <Icon className="h-3.5 w-3.5 text-cyan-500" />
                  {chip.label}
                </span>
              );
            })}
          </div>

          {/* 3D Spotlight 1-Click Instant Demo Portals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <SpatialCard
              onClick={() => !loading && handleDemoLogin("admin")}
              glowColor="rgba(6, 182, 212, 0.28)"
              className="p-4 border-teal-500/35 dark:border-cyan-400/30 group"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-glow-cyan">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-cyan-400 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="mt-3.5 font-display text-sm font-bold text-slate-900 dark:text-white">
                1-Click Admin / Pharmacist
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-snug">
                Full command center, 3D Twin, FEFO automation, IoT sensors &amp;
                procurement AI.
              </p>
            </SpatialCard>

            <SpatialCard
              onClick={() => !loading && handleDemoLogin("patient")}
              glowColor="rgba(16, 185, 129, 0.28)"
              className="p-4 border-emerald-500/35 group"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-glow-teal">
                  <UserCheck className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-emerald-400 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="mt-3.5 font-display text-sm font-bold text-slate-900 dark:text-white">
                1-Click Customer / Patient
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-snug">
                Interactive QR Digital Prescription, dosage adherence tracker &amp;
                safety alerts.
              </p>
            </SpatialCard>
          </div>
        </motion.div>

        {/* Right Holographic Laser-Border Auth Monolith */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="lg:col-span-6"
        >
          <div className="glass-card holo-border p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  {mode === "login"
                    ? "Authenticate Workspace"
                    : "Provision New Access"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Encrypted Supabase Auth · Live Instant Sync Enabled
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 text-[11px] font-semibold text-teal-700 dark:text-cyan-300">
                <Sparkles className="h-3 w-3" />
                Studio OS
              </span>
            </div>

            {/* Segmented Mode Switch */}
            <div className="grid grid-cols-2 rounded-xl bg-slate-100/90 dark:bg-slate-950/80 p-1 mb-5 border border-slate-200/70 dark:border-white/5">
              {(["login", "signup"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMode(tab)}
                  className={`rounded-lg py-2 text-xs font-semibold transition ${
                    mode === tab
                      ? "bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {tab === "login" ? "Sign In" : "Register Account"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Ananya Nair"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/75 px-3.5 py-2.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Access Role
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(
                    [
                      { id: "admin", label: "Admin / Pharmacist" },
                      { id: "patient", label: "Customer / Patient" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRole(item.id)}
                      className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                        role === item.id
                          ? "border-cyan-400 bg-cyan-500/15 text-teal-700 dark:text-cyan-200 shadow-[0_0_20px_-6px_rgba(6,182,212,0.45)]"
                          : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-white/25"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/75 px-3.5 py-2.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/75 px-3.5 py-2.5 pr-10 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <Lock className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-600 dark:text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-glow-cyan transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
              >
                {loading
                  ? "Initializing Spatial Engine..."
                  : mode === "login"
                  ? "Launch Command Workspace"
                  : "Provision & Enter Workspace"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
