"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  Pill,
  QrCode,
  ShieldCheck,
  Thermometer,
} from "lucide-react";
import { DigitalPrescription } from "@/types/pharminvin";

interface PatientPortalProps {
  prescriptions: DigitalPrescription[];
  onToggleDosage: (
    prescriptionId: string,
    medId: string,
    slot: "morning" | "afternoon" | "night"
  ) => Promise<void>;
  isAdminPreview?: boolean;
}

// Deterministic crisp SVG QR Matrix with standard 7x7 finder patterns
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
  isAdminPreview = false,
}: PatientPortalProps) {
  const rx = prescriptions[0];
  const [qrScannedToast, setQrScannedToast] = useState(false);

  if (!rx) return null;

  // Calculate Today's Adherence %
  let totalScheduled = 0;
  let totalTaken = 0;
  rx.medications.forEach((m) => {
    (["morning", "afternoon", "night"] as const).forEach((slot) => {
      if (m.frequency[slot]) {
        totalScheduled += 1;
        if (m.takenToday[slot]) totalTaken += 1;
      }
    });
  });

  const adherencePct =
    totalScheduled === 0 ? 100 : Math.round((totalTaken / totalScheduled) * 100);

  const qrPayload = JSON.stringify({
    rx: rx.rxCode,
    patient: rx.patientName,
    verifiedBy: "Pharminvin Smart Pharmacy",
    meds: rx.medications.map((m) => m.name),
  });

  return (
    <div className="space-y-6">
      {isAdminPreview && (
        <div className="rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-4 py-2.5 text-xs text-teal-800 dark:text-cyan-200 flex items-center gap-2">
          <Eye className="h-4 w-4 text-cyan-500" />
          <span>
            <strong>Admin Preview Mode:</strong> Viewing live Patient Care &amp;
            Digital Prescription experience for{" "}
            <strong>{rx.patientName}</strong> ({rx.rxCode}).
          </span>
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
                {rx.rxCode}
              </span>
            </div>

            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {rx.patientName}{" "}
              <span className="text-sm font-normal text-slate-500">
                ({rx.age} yrs · ID: {rx.patientId})
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-slate-100/80 dark:bg-slate-950/60 p-3">
                <div className="text-[10px] uppercase text-slate-400">
                  Prescribing Clinician
                </div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {rx.doctorName}
                </div>
                <div className="text-[11px] text-slate-500">{rx.hospital}</div>
              </div>
              <div className="rounded-xl bg-slate-100/80 dark:bg-slate-950/60 p-3">
                <div className="text-[10px] uppercase text-slate-400">
                  Clinical Protocol
                </div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {rx.diagnosis}
                </div>
                <div className="text-[11px] text-slate-500">
                  Valid until {rx.validUntil}
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

          {/* Scannable QR Verification Card */}
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

      {/* Prescribed Medicines & Interactive Dosage Schedule */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {rx.medications.map((med) => (
          <div key={med.id} className="glass-card p-5 flex flex-col justify-between">
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

              {/* Morning / Afternoon / Night Interactive Adherence Toggles */}
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
                        onClick={() => onToggleDosage(rx.id, med.id, slot)}
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
                            <span className="text-[10px] text-slate-400">Skip</span>
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

            {/* Side Effects & Storage Guidance */}
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
    </div>
  );
}
