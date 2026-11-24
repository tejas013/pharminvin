"use client";

import React from "react";

interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  subtitle?: string;
}

export default function BrandLogo({
  size = 40,
  showWordmark = true,
  subtitle = "SMART PHARMA OS",
}: BrandLogoProps) {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="relative flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-xl bg-gradient-to-tr from-teal-500/40 via-cyan-400/35 to-emerald-400/30 blur-md"
          aria-hidden="true"
        />
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]"
        >
          <defs>
            <linearGradient
              id="pharminvinGrad"
              x1="6"
              y1="6"
              x2="58"
              y2="58"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#0D9488" />
              <stop offset="55%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient
              id="pharminvinCore"
              x1="18"
              y1="14"
              x2="46"
              y2="50"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#ECFEFF" />
              <stop offset="100%" stopColor="#67E8F9" />
            </linearGradient>
          </defs>

          {/* Outer Hexagonal Molecular Shield */}
          <path
            d="M32 4L55.5 17.5V46.5L32 60L8.5 46.5V17.5L32 4Z"
            fill="#07111F"
            fillOpacity="0.92"
            stroke="url(#pharminvinGrad)"
            strokeWidth="2.5"
          />

          {/* Futuristic Geometric Medical Cross */}
          <path
            d="M27 16H37V27H48V37H37V48H27V37H16V27H27V16Z"
            fill="url(#pharminvinGrad)"
            fillOpacity="0.22"
            stroke="url(#pharminvinCore)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Live Data Pulse Waveform across Cross */}
          <path
            d="M15 32H24L27.5 24.5L32 40L36.5 28L39.5 32H49"
            stroke="#34D399"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Molecular Orbital Nodes */}
          <circle cx="32" cy="10" r="2.6" fill="#06B6D4" />
          <circle cx="51" cy="21" r="2.2" fill="#10B981" />
          <circle cx="13" cy="43" r="2.2" fill="#0D9488" />
        </svg>
      </div>

      {showWordmark && (
        <div className="leading-none">
          <div className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-teal-700 to-cyan-600 dark:from-white dark:via-cyan-200 dark:to-teal-300 bg-clip-text text-transparent">
            Pharminvin
          </div>
          <div className="mt-1 text-[10px] font-semibold tracking-[0.22em] text-teal-600 dark:text-cyan-400/90 uppercase">
            {subtitle}
          </div>
        </div>
      )}
    </div>
  );
}
