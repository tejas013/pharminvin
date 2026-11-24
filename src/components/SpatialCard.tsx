"use client";

import React, { useRef, useState } from "react";

interface SpatialCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glowColor?: string;
  tiltStrength?: number;
}

export default function SpatialCard({
  children,
  className = "",
  onClick,
  glowColor = "rgba(6, 182, 212, 0.22)",
  tiltStrength = 5,
}: SpatialCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState(
    "perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)"
  );
  const [spot, setSpot] = useState({ x: 50, y: 50, visible: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;

    const rotateY = ((x / rect.width) - 0.5) * (tiltStrength * 2);
    const rotateX = (0.5 - (y / rect.height)) * (tiltStrength * 2);

    setTransform(
      `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.012,1.012,1.012)`
    );
    setSpot({ x: px, y: py, visible: true });
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)");
    setSpot((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: spot.visible
          ? "transform 110ms ease-out"
          : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      className={`glass-card overflow-hidden ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {/* Dynamic Cursor Specular Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: spot.visible ? 1 : 0,
          background: `radial-gradient(320px circle at ${spot.x}% ${spot.y}%, ${glowColor}, transparent 72%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
