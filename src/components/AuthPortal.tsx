"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  Lock,
  Moon,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  UserCheck,
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import SpatialCard from "./SpatialCard";
import CyberBackground from "./CyberBackground";
import { getStoredAccounts, saveStoredAccount } from "@/lib/authStorage";
import { AuthUser, StoredAccount, UserRole } from "@/types/pharminvin";

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
  const [role, setRole] = useState<UserRole>("patient");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("dr.sharma@pharminvin.ai");
  const [password, setPassword] = useState("Pharminvin@2026");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [facility, setFacility] = useState("");
  const [licenseId, setLicenseId] = useState("");
  const [age, setAge] = useState("28");
  const [showPassword, setShowPassword] = useState(false);

  const [savedAccounts, setSavedAccounts] = useState<StoredAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setSavedAccounts(getStoredAccounts());
  }, []);

  const switchMode = (nextMode: "login" | "signup") => {
    setMode(nextMode);
    setError(null);
    setSuccessMsg(null);
    if (nextMode === "signup") {
      // Clear pre-filled demo credentials so new Patient/Doctor registration is effortless
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFacility("");
      setLicenseId("");
      setAge("28");
    } else {
      setEmail("");
      setPassword("");
    }
  };

  const handleQuickFill = (acc: StoredAccount) => {
    setMode("login");
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === "signup") {
      if (fullName.trim().length < 2) {
        setError("Please enter your full name.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please re-enter carefully.");
        return;
      }
    }

    setLoading(true);
    try {
      const clientAccounts = getStoredAccounts();
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          role,
          facility: facility.trim(),
          licenseId: licenseId.trim(),
          age: role === "patient" ? Number(age) || 28 : undefined,
          clientAccounts,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Please try again.");
      }

      if (mode === "signup" && data.account) {
        const updatedList = saveStoredAccount(data.account as StoredAccount);
        setSavedAccounts(updatedList);
        setSuccessMsg(
          `Registration successful for ${data.user.fullName} (${data.user.role.toUpperCase()})! Launching your portal...`
        );
        setTimeout(() => {
          onLogin(data.user as AuthUser);
        }, 650);
      } else {
        onLogin(data.user as AuthUser);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole: UserRole) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "demo", role: demoRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Demo login failed");
      onLogin(data.user as AuthUser);
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
      <CyberBackground isDark={isDark} variant="hero" />

      {/* Top Glass Header Strip */}
      <div className="absolute top-5 inset-x-5 sm:inset-x-8 z-20 flex items-center justify-between">
        <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/60 dark:bg-[#050C1B]/70 backdrop-blur-xl px-4 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-cyan-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          CDSCO &amp; WHO GDP Cold-Chain Architecture · Spatial OS v3.0
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

      <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 gap-10 lg:grid-cols-12 items-center pt-14 sm:pt-6">
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
            Register new <strong>Patients</strong>, <strong>Doctors</strong>, or{" "}
            <strong>Pharmacists</strong> with real credential validation—or
            jump straight in with 1-click role previews below.
          </p>

          <div className="fiber-divider max-w-md" />

          <div className="flex flex-wrap gap-2">
            {[
              { icon: Cpu, label: "3D Spatial Digital Twin" },
              { icon: Activity, label: "99.98% Cold-Chain SLA" },
              { icon: Sparkles, label: "Live Doctor → Patient Rx" },
            ].map((chip) => {
              const Icon = chip.icon;
              return (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/15 bg-white/75 dark:bg-[#081224]/75 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 backdrop-blur-xl"
                >
                  <Icon className="h-3.5 w-3.5 text-cyan-400" />
                  {chip.label}
                </span>
              );
            })}
          </div>

          {/* 1-Click Instant Demo Access for All 3 Roles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <SpatialCard
              onClick={() => !loading && handleDemoLogin("admin")}
              glowColor="rgba(6, 182, 212, 0.3)"
              className="p-3.5 border-teal-500/35 dark:border-cyan-400/35 group"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-950">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-cyan-400 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="mt-3 font-display text-xs font-bold text-slate-900 dark:text-white">
                Demo Admin
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Full 6-Module OS
              </p>
            </SpatialCard>

            <SpatialCard
              onClick={() => !loading && handleDemoLogin("doctor")}
              glowColor="rgba(129, 140, 248, 0.3)"
              className="p-3.5 border-indigo-500/35 group"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-cyan-500 text-slate-950">
                  <Stethoscope className="h-4 w-4" />
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="mt-3 font-display text-xs font-bold text-slate-900 dark:text-white">
                Demo Doctor
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Clinical &amp; Issue Rx
              </p>
            </SpatialCard>

            <SpatialCard
              onClick={() => !loading && handleDemoLogin("patient")}
              glowColor="rgba(16, 185, 129, 0.3)"
              className="p-3.5 border-emerald-500/35 group"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950">
                  <UserCheck className="h-4 w-4" />
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-emerald-400 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="mt-3 font-display text-xs font-bold text-slate-900 dark:text-white">
                Demo Patient
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                QR Rx &amp; Dosage
              </p>
            </SpatialCard>
          </div>
        </motion.div>

        {/* Right Holographic Registration & Login Monolith */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="lg:col-span-6"
        >
          <div className="glass-card holo-border p-6 sm:p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  {mode === "login"
                    ? "Sign In to Pharminvin"
                    : "Create New Account"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {mode === "login"
                    ? "Role is automatically detected from your registered account"
                    : "Register a new Patient, Doctor, or Pharmacist account"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/35 bg-cyan-500/15 px-3 py-1 text-[11px] font-semibold text-teal-700 dark:text-cyan-300">
                <Sparkles className="h-3 w-3" />
                Auth Live
              </span>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 rounded-xl bg-slate-100/90 dark:bg-slate-950/80 p-1 mb-5 border border-slate-200/70 dark:border-white/5">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  mode === "login"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  mode === "signup"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Register Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === "signup" && (
                <>
                  {/* 3-Way Role Selector */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                      Register As
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: "patient", label: "Patient", icon: UserCheck },
                          { id: "doctor", label: "Doctor", icon: Stethoscope },
                          { id: "admin", label: "Pharmacist", icon: ShieldCheck },
                        ] as const
                      ).map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setRole(item.id)}
                            className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2.5 text-xs font-semibold transition ${
                              role === item.id
                                ? "border-cyan-400 bg-cyan-500/15 text-teal-700 dark:text-cyan-200 shadow-[0_0_20px_-6px_rgba(6,182,212,0.45)]"
                                : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-white/25"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Full Name + Role-Specific Field */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={
                          role === "doctor"
                            ? "Dr. Ananya Nair"
                            : role === "patient"
                            ? "Riya Deshpande"
                            : "Vikram Joshi"
                        }
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/75 px-3.5 py-2.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    {role === "patient" ? (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Age (Years)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="28"
                          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/75 px-3.5 py-2.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                          {role === "doctor"
                            ? "Medical License / MCI ID"
                            : "Pharmacy License ID"}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={licenseId}
                            onChange={(e) => setLicenseId(e.target.value)}
                            placeholder={
                              role === "doctor" ? "MCI-MH-90412" : "PHARM-2026-08"
                            }
                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/75 px-3.5 py-2.5 pr-9 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                          />
                          <BadgeCheck className="absolute right-3 top-3 h-4 w-4 text-cyan-500/70" />
                        </div>
                      </div>
                    )}
                  </div>

                  {role !== "patient" && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        {role === "doctor"
                          ? "Hospital / Clinic Name"
                          : "Pharmacy Hub / Facility Name"}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={facility}
                          onChange={(e) => setFacility(e.target.value)}
                          placeholder={
                            role === "doctor"
                              ? "Fortis Hospital, Navi Mumbai"
                              : "Pharminvin Central Hub"
                          }
                          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/75 px-3.5 py-2.5 pr-9 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        />
                        <Building2 className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/75 px-3.5 py-2.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              {/* Password + Confirm Password */}
              <div
                className={
                  mode === "signup"
                    ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
                    : ""
                }
              >
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/75 px-3.5 py-2.5 pr-10 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-cyan-400"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/75 px-3.5 py-2.5 pr-9 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      />
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-600 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/15 px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 shadow-glow-cyan transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
              >
                {loading
                  ? mode === "signup"
                    ? "Creating Account..."
                    : "Verifying Credentials..."
                  : mode === "login"
                  ? "Sign In & Launch Workspace"
                  : `Register ${
                      role === "doctor"
                        ? "Doctor"
                        : role === "admin"
                        ? "Pharmacist"
                        : "Patient"
                    } Account`}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick-Fill Registered Accounts Bar (On Sign-In Tab) */}
            {mode === "login" && savedAccounts.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-white/10">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Registered Accounts (Tap to Auto-Fill Login)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {savedAccounts.slice(0, 5).map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleQuickFill(acc)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 hover:border-cyan-400/50 transition"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          acc.role === "doctor"
                            ? "bg-indigo-400"
                            : acc.role === "admin"
                            ? "bg-cyan-400"
                            : "bg-emerald-400"
                        }`}
                      />
                      <span className="font-semibold">{acc.fullName}</span>
                      <span className="text-[10px] uppercase text-slate-400">
                        ({acc.role})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
