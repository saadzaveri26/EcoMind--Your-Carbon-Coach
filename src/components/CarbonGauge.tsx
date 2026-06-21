"use client";
import React from "react";
import { motion } from "framer-motion";
import { TARGET_DAILY } from "@/lib/carbonData";

interface CarbonGaugeProps {
  totalCO2: number;
}

export default function CarbonGauge({ totalCO2 = 0 }: CarbonGaugeProps) {
  // Sustainable Target is 5kg.
  // We will map 0 to 15kg CO2 on the gauge scale for visual balance.
  const maxScale = 15;
  const percentage = Math.min(100, (totalCO2 / maxScale) * 100);

  const radius = 70;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius; // ~439.82
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine color theme based on thresholds
  const getGaugeColor = () => {
    if (totalCO2 <= TARGET_DAILY) {
      return {
        stroke: "#16a34a", // Green
        bg: "rgba(22, 163, 74, 0.1)",
        text: "text-green-500",
      };
    } else if (totalCO2 <= 10.0) {
      return {
        stroke: "#d97706", // Amber
        bg: "rgba(217, 119, 6, 0.1)",
        text: "text-amber-500",
      };
    } else {
      return {
        stroke: "#dc2626", // Red
        bg: "rgba(220, 38, 38, 0.1)",
        text: "text-red-500",
      };
    }
  };

  const theme = getGaugeColor();

  return (
    <div className="glass-panel rounded-2xl border border-outline-variant/30 p-6 flex flex-col items-center justify-center shadow-xl">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-4 text-center">
        Today&apos;s Carbon Footprint
      </h3>
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-3xl font-bold font-display ${theme.text}`}>
            {totalCO2.toFixed(2)}
          </span>
          <span className="text-xs text-on-surface-variant">kg CO2</span>
          <span className="text-[10px] text-on-surface-variant/70 mt-1 uppercase font-semibold">
            Today
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block"></span>
          <span className="text-on-surface-variant">Target (&le;5kg)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
          <span className="text-on-surface-variant">Warning (5-10kg)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
          <span className="text-on-surface-variant">High (&gt;10kg)</span>
        </div>
      </div>
    </div>
  );
}
