"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Lock,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
} from "lucide-react";
import BrandLogo from "./BrandLogo";
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
      <div className="pointer-events-none absolute inset-0 spatial-grid opacity-70" />

      {/* Top Theme Toggle */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={onToggleTheme}
          className="glass-card flex items-center gap-2 px-3.5 py-2 text-xs font-semibold hover:border-cyan-400/50"
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

      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-12 items-center">
        {/* Left Spatial Showcase */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-6 space-y-6"
        >
          <BrandLogo size={52} subtitle="NATIONAL SMART PHARMACY OS" />

          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08] text-slate-900 dark:text-white">
            Zero-Waste Pharma Inventory &amp;{" "}
            <span className="bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Cold-Chain Intelligence.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300/90 leading-relaxed max-w-xl">
            Automate FEFO batch dispatch, monitor IoT cryo-vault telemetry in
            real time, optimize supplier procurement with AI trust scoring, and
            empower patients with interactive QR digital prescriptions.
          </p>

          {/* 1-Click Instant Demo Access Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin("admin")}
              className="group glass-card glass-card-hover p-4 text-left border-teal-500/30 dark:border-cyan-400/25"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-glow-teal">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-cyan-500 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="mt-3 font-display font-bold text-slate-900 dark:text-white">
                1-Click Admin / Pharmacist
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Full access to 3D Twin, FEFO Engine, Cold-Chain IoT, Procurement
                &amp; Analytics.
              </p>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin("patient")}
              className="group glass-card glass-card-hover p-4 text-left border-emerald-500/30"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-glow-teal">
                  <UserCheck className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-emerald-500 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="mt-3 font-display font-bold text-slate-900 dark:text-white">
                1-Click Customer / Patient
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Access QR Digital Prescriptions, dosage adherence toggles &amp;
                safety guidance.
              </p>
            </button>
          </div>
        </motion.div>

        {/* Right Glassmorphic Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="lg:col-span-6"
        >
          <div className="glass-card p-6 sm:p-8 border-white/20 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  {mode === "login" ? "Authenticate Workspace" : "Create Account"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Supabase Cloud Auth + Instant Local Persistence Enabled
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 px-2.5 py-1 text-[11px] font-semibold text-teal-600 dark:text-cyan-300">
                <Sparkles className="h-3 w-3" />
                Live v2.6
              </span>
            </div>

            {/* Mode Switch */}
            <div className="grid grid-cols-2 rounded-xl bg-slate-100 dark:bg-slate-950/70 p-1 mb-5">
              {(["login", "signup"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMode(tab)}
                  className={`rounded-lg py-2 text-xs font-semibold transition ${
                    mode === tab
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {tab === "login" ? "Sign In" : "Register"}
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
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/70 px-3.5 py-2.5 text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Portal Role
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
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        role === item.id
                          ? "border-cyan-500 bg-cyan-500/15 text-teal-700 dark:text-cyan-300"
                          : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400"
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
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/70 px-3.5 py-2.5 text-sm focus:border-cyan-500 focus:outline-none"
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
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/70 px-3.5 py-2.5 pr-10 text-sm focus:border-cyan-500 focus:outline-none"
                  />
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
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
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-glow-cyan transition hover:brightness-110 disabled:opacity-50"
              >
                {loading
                  ? "Connecting to Pharminvin..."
                  : mode === "login"
                  ? "Launch Command Workspace"
                  : "Create & Enter Workspace"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
