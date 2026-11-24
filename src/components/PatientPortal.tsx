"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  FilePlus2,
  Pill,
  QrCode,
  ShieldCheck,
  Thermometer,
  X,
} from "lucide-react";
import { AuthUser, DigitalPrescription } from "@/types/pharminvin";
import { getStoredAccounts } from "@/lib/authStorage";

interface PatientPortalProps {
  prescriptions: DigitalPrescription[];
  onToggleDosage: (
    prescriptionId: string,
    medId: string,
    slot: "morning" | "afternoon" | "night"
  ) => Promise<void>;
  onCreatePrescription?: (rx: DigitalPrescription) => void;
  currentUser?: AuthUser | null;
  isAdminPreview?: boolean;
}

function PrescriptionQRCode({ value }: { value: string }) {
  const size = 21;
  const cells = useMemo(() => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const matrix: boolean[][] = Array.from({ length: size }, () =>
      Array(size).fill(false)
    );

    const drawFinder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const border = r === 0 || r === 6 || c === 0 || c === 6;
          const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          matrix[r0 + r][c0 + c] = border || inner;
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const inFinder =
          (r < 8 && c < 8) ||
          (r < 8 && c >= size - 8) ||
          (r >= size - 8 && c < 8);
        if (!inFinder) {
          hash = Math.imul(hash ^ (r * 31 + c * 17), 2246822519);
          matrix[r][c] = ((hash >>> 15) & 1) === 1;
        }
      }
    }
    return matrix;
  }, [value]);

  return (
    <svg
      viewBox={`0 0 ${size + 2} ${size + 2}`}
      className="h-36 w-36 rounded-xl bg-white p-2 shadow-md"
      role="img"
      aria-label={`QR Code for ${value}`}
    >
      <rect width={size + 2} height={size + 2} fill="#FFFFFF" />
      {cells.map((row, r) =>
        row.map(
          (filled, c) =>
            filled && (
              <rect
                key={`${r}-${c}`}
                x={c + 1}
                y={r + 1}
                width={1}
                height={1}
                fill="#060913"
              />
            )
        )
      )}
    </svg>
  );
}

export default function PatientPortal({
  prescriptions,
  onToggleDosage,
  onCreatePrescription,
  currentUser,
  isAdminPreview = false,
}: PatientPortalProps) {
  const [selectedRxId, setSelectedRxId] = useState<string>(
    prescriptions[0]?.id || ""
  );
  const [qrScannedToast, setQrScannedToast] = useState(false);
  const [showRxModal, setShowRxModal] = useState(false);
  const [registeredPatients, setRegisteredPatients] = useState<
    { fullName: string; email: string; age?: number }[]
  >([]);

  const [rxForm, setRxForm] = useState({
    patientName: "",
    patientEmail: "",
    age: 30,
    diagnosis: "Upper Respiratory Recovery Protocol",
    medName: "Augmentin 625 Duo",
    composition: "Amoxicillin 500mg + Clavulanic Acid 125mg",
    dosageText: "1 Tablet Oral",
    morning: true,
    afternoon: false,
    night: true,
    withFood: "Take immediately after breakfast and dinner.",
    storageTip: "Keep sealed in blister strip below 25°C.",
  });

  useEffect(() => {
    const accounts = getStoredAccounts().filter((a) => a.role === "patient");
    setRegisteredPatients(
      accounts.map((a) => ({ fullName: a.fullName, email: a.email, age: a.age }))
    );
  }, [showRxModal]);

  const canIssueRx =
    currentUser?.role === "doctor" || currentUser?.role === "admin";

  // Match newly registered patient to their own prescription (or build a personalized welcome Rx)
  const activeRx: DigitalPrescription | null = useMemo(() => {
    if (currentUser?.role === "patient") {
      const matched = prescriptions.find(
        (p) =>
          (p.patientEmail &&
            p.patientEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
          p.patientName.toLowerCase() === currentUser.fullName.toLowerCase()
      );
      if (matched) return matched;

      // Personalized Digital Care Card for newly registered patients
      const today = new Date().toISOString().split("T")[0];
      const nextMonth = new Date(Date.now() + 30 * 86400000)
        .toISOString()
        .split("T")[0];
      return {
        ...prescriptions[0],
        id: `rx-user-${currentUser.id}`,
        rxCode: `RX-PHV-${Math.abs(
          currentUser.email.split("").reduce((a, c) => a + c.charCodeAt(0), 1000)
        )}`,
        patientName: currentUser.fullName,
        patientId: `PAT-${currentUser.id.slice(-5).toUpperCase()}`,
        patientEmail: currentUser.email,
        age: currentUser.age || 28,
        issuedDate: today,
        validUntil: nextMonth,
      };
    }

    return (
      prescriptions.find((p) => p.id === selectedRxId) ||
      prescriptions[0] ||
      null
    );
  }, [prescriptions, selectedRxId, currentUser]);

  if (!activeRx) return null;

  let totalScheduled = 0;
  let totalTaken = 0;
  activeRx.medications.forEach((m) => {
    (["morning", "afternoon", "night"] as const).forEach((slot) => {
      if (m.frequency[slot]) {
        totalScheduled += 1;
        if (m.takenToday[slot]) totalTaken += 1;
      }
    });
  });

  const adherencePct =
    totalScheduled === 0
      ? 100
      : Math.round((totalTaken / totalScheduled) * 100);

  const qrPayload = JSON.stringify({
    rx: activeRx.rxCode,
    patient: activeRx.patientName,
    verifiedBy: "Pharminvin Smart Pharmacy",
    meds: activeRx.medications.map((m) => m.name),
  });

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreatePrescription || !rxForm.patientName.trim()) return;

    const today = new Date().toISOString().split("T")[0];
    const validUntil = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split("T")[0];

    const newRx: DigitalPrescription = {
      id: `rx-${Date.now()}`,
      rxCode: `RX-PHV-${Math.floor(10000 + Math.random() * 89999)}-IN`,
      patientName: rxForm.patientName.trim(),
      patientId: `PAT-${Math.floor(10000 + Math.random() * 89999)}`,
      patientEmail: rxForm.patientEmail.trim() || undefined,
      age: Number(rxForm.age) || 30,
      doctorName: currentUser?.fullName || "Dr. Meera Kulkarni, MD",
      hospital: currentUser?.facility || "Pharminvin Clinical Network",
      issuedDate: today,
      validUntil,
      diagnosis: rxForm.diagnosis.trim(),
      medications: [
        {
          id: `med-${Date.now()}`,
          name: rxForm.medName.trim(),
          composition: rxForm.composition.trim(),
          dosageText: rxForm.dosageText.trim(),
          frequency: {
            morning: rxForm.morning,
            afternoon: rxForm.afternoon,
            night: rxForm.night,
          },
          takenToday: { morning: false, afternoon: false, night: false },
          sideEffects: [
            "Complete the full prescribed course without skipping doses",
            "Contact prescribing clinician if rash or unusual fatigue occurs",
          ],
          storageTip: rxForm.storageTip.trim(),
          withFood: rxForm.withFood.trim(),
        },
      ],
    };

    onCreatePrescription(newRx);
    setSelectedRxId(newRx.id);
    setShowRxModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Clinician / Admin Top Toolbar */}
      {(isAdminPreview || canIssueRx) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-4 py-3 text-xs text-teal-800 dark:text-cyan-200">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-cyan-500 shrink-0" />
            <span>
              <strong>
                {currentUser?.role === "doctor"
                  ? "Doctor Clinical Rx Console:"
                  : "Admin Preview Mode:"}
              </strong>{" "}
              Viewing prescription for <strong>{activeRx.patientName}</strong> (
              {activeRx.rxCode})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {prescriptions.length > 1 && (
              <select
                value={activeRx.id}
                onChange={(e) => setSelectedRxId(e.target.value)}
                className="rounded-lg border border-cyan-500/35 bg-white/80 dark:bg-slate-950/80 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-white"
              >
                {prescriptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.patientName} ({p.rxCode})
                  </option>
                ))}
              </select>
            )}

            {canIssueRx && onCreatePrescription && (
              <button
                onClick={() => setShowRxModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:brightness-110 transition"
              >
                <FilePlus2 className="h-3.5 w-3.5" />
                Issue New Digital Rx
              </button>
            )}
          </div>
        </div>
      )}

      {/* Digital Prescription + Scannable QR Card */}
      <div className="glass-card p-6 border-teal-500/30 dark:border-cyan-400/25">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                CDSCO Verified Digital Rx
              </span>
              <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-300">
                {activeRx.rxCode}
              </span>
            </div>

            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {activeRx.patientName}{" "}
              <span className="text-sm font-normal text-slate-500">
                ({activeRx.age} yrs · ID: {activeRx.patientId})
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-slate-100/80 dark:bg-slate-950/60 p-3">
                <div className="text-[10px] uppercase text-slate-400">
                  Prescribing Clinician
                </div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {activeRx.doctorName}
                </div>
                <div className="text-[11px] text-slate-500">
                  {activeRx.hospital}
                </div>
              </div>
              <div className="rounded-xl bg-slate-100/80 dark:bg-slate-950/60 p-3">
                <div className="text-[10px] uppercase text-slate-400">
                  Clinical Protocol
                </div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {activeRx.diagnosis}
                </div>
                <div className="text-[11px] text-slate-500">
                  Valid until {activeRx.validUntil}
                </div>
              </div>
              <div className="rounded-xl bg-slate-100/80 dark:bg-slate-950/60 p-3">
                <div className="text-[10px] uppercase text-slate-400">
                  Today&apos;s Adherence
                </div>
                <div className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {adherencePct}% ({totalTaken}/{totalScheduled})
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${adherencePct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-slate-950/65 p-4 text-center">
            <PrescriptionQRCode value={qrPayload} />
            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-white">
              <QrCode className="h-3.5 w-3.5 text-cyan-500" />
              Scan at Pharminvin Kiosk
            </div>
            <button
              onClick={() => {
                setQrScannedToast(true);
                setTimeout(() => setQrScannedToast(false), 3000);
              }}
              className="mt-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-teal-700 dark:text-cyan-300 hover:bg-cyan-500/20"
            >
              Simulate Pharmacist QR Verify
            </button>
            {qrScannedToast && (
              <div className="mt-2 text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Rx Authenticity Verified
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prescribed Medicines & Dosage Schedule */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {activeRx.medications.map((med) => (
          <div
            key={med.id}
            className="glass-card p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 text-teal-600 dark:text-cyan-300 border border-cyan-500/30">
                  <Pill className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  {med.dosageText}
                </span>
              </div>

              <h3 className="mt-3 font-display text-base font-bold text-slate-900 dark:text-white">
                {med.name}
              </h3>
              <p className="text-xs text-teal-700 dark:text-cyan-300/90 font-medium mt-0.5">
                {med.composition}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {med.withFood}
              </p>

              <div className="mt-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Daily Dosage Schedule (Tap to Mark Taken)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["morning", "afternoon", "night"] as const).map((slot) => {
                    const scheduled = med.frequency[slot];
                    const taken = med.takenToday[slot];
                    return (
                      <button
                        key={slot}
                        disabled={!scheduled}
                        onClick={() => onToggleDosage(activeRx.id, med.id, slot)}
                        className={`rounded-xl border p-2.5 text-center transition ${
                          !scheduled
                            ? "border-slate-200/50 dark:border-white/5 opacity-40 cursor-not-allowed"
                            : taken
                            ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "border-slate-200 dark:border-white/15 hover:border-cyan-400 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <div className="text-[11px] font-semibold capitalize">
                          {slot}
                        </div>
                        <div className="mt-1 flex justify-center">
                          {!scheduled ? (
                            <span className="text-[10px] text-slate-400">
                              Skip
                            </span>
                          ) : taken ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold">
                              <Check className="h-3 w-3" /> Taken
                            </span>
                          ) : (
                            <span className="text-[10px] text-cyan-600 dark:text-cyan-300">
                              Mark Done
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-200/70 dark:border-white/10 text-[11px]">
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-2.5">
                <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Safety &amp; Side-Effect Watch
                </div>
                <ul className="mt-1 list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-300">
                  {med.sideEffects.map((se, i) => (
                    <li key={i}>{se}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/25 p-2.5">
                <div className="flex items-center gap-1.5 font-semibold text-teal-700 dark:text-cyan-300">
                  <Thermometer className="h-3.5 w-3.5" />
                  Storage Guidance
                </div>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  {med.storageTip}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Doctor / Admin Issue New Prescription Modal */}
      {showRxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
          <div className="glass-card holo-border w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Issue New Digital Prescription (QR Verified)
              </h3>
              <button
                onClick={() => setShowRxModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleIssueSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs"
            >
              {registeredPatients.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="block font-medium mb-1">
                    Select Registered Patient (Optional Quick-Fill)
                  </label>
                  <select
                    onChange={(e) => {
                      const found = registeredPatients.find(
                        (p) => p.email === e.target.value
                      );
                      if (found) {
                        setRxForm((prev) => ({
                          ...prev,
                          patientName: found.fullName,
                          patientEmail: found.email,
                          age: found.age || 30,
                        }));
                      }
                    }}
                    defaultValue=""
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                  >
                    <option value="">-- Choose registered patient --</option>
                    {registeredPatients.map((p) => (
                      <option key={p.email} value={p.email}>
                        {p.fullName} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-medium mb-1">Patient Name *</label>
                <input
                  required
                  value={rxForm.patientName}
                  onChange={(e) =>
                    setRxForm({ ...rxForm, patientName: e.target.value })
                  }
                  placeholder="Riya Deshpande"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">
                  Patient Email (Links to Patient Portal)
                </label>
                <input
                  type="email"
                  value={rxForm.patientEmail}
                  onChange={(e) =>
                    setRxForm({ ...rxForm, patientEmail: e.target.value })
                  }
                  placeholder="patient@example.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Diagnosis *</label>
                <input
                  required
                  value={rxForm.diagnosis}
                  onChange={(e) =>
                    setRxForm({ ...rxForm, diagnosis: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Medicine Name *</label>
                <input
                  required
                  value={rxForm.medName}
                  onChange={(e) =>
                    setRxForm({ ...rxForm, medName: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Composition *</label>
                <input
                  required
                  value={rxForm.composition}
                  onChange={(e) =>
                    setRxForm({ ...rxForm, composition: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Dosage *</label>
                <input
                  required
                  value={rxForm.dosageText}
                  onChange={(e) =>
                    setRxForm({ ...rxForm, dosageText: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-4 pt-1">
                <span className="font-medium">Schedule:</span>
                {(["morning", "afternoon", "night"] as const).map((slot) => (
                  <label
                    key={slot}
                    className="inline-flex items-center gap-1.5 capitalize cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={rxForm[slot]}
                      onChange={(e) =>
                        setRxForm({ ...rxForm, [slot]: e.target.checked })
                      }
                    />
                    {slot}
                  </label>
                ))}
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRxModal(false)}
                  className="rounded-xl border border-slate-300 dark:border-white/15 px-4 py-2 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-2 font-bold text-slate-950"
                >
                  Publish Digital Rx
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
