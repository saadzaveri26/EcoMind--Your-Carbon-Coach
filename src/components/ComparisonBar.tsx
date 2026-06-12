"use client";
import React from "react";
import { motion } from "framer-motion";

interface ComparisonBarProps {
  userCO2: number;
  indiaCO2: number;
  globalCO2: number;
}

export default function ComparisonBar({ userCO2, indiaCO2, globalCO2 }: ComparisonBarProps) {
  // Find maximum to scale widths relative to it
  const maxValue = Math.max(userCO2, indiaCO2, globalCO2, 1);

  const userPercent = (userCO2 / maxValue) * 100;
  const indiaPercent = (indiaCO2 / maxValue) * 100;
  const globalPercent = (globalCO2 / maxValue) * 100;

  const isBelowIndiaAvg = userCO2 < indiaCO2;
  const percentBelow = indiaCO2 > 0 ? Math.round(((indiaCO2 - userCO2) / indiaCO2) * 100) : 0;

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
        How You Compare
      </h3>

      <div className="flex flex-col gap-4 mt-2">
        {/* User bar */}
        <div className="flex items-center gap-3">
          <span className="w-20 text-xs font-semibold text-on-surface-variant truncate">You</span>
          <div className="flex-grow h-6 bg-surface-container-lowest rounded-full overflow-hidden relative">
            <motion.div
              className={`h-full rounded-full ${isBelowIndiaAvg ? "bg-primary" : "bg-error"}`}
              initial={{ width: 0 }}
              animate={{ width: `${userPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <span className="w-16 text-right text-xs font-bold text-on-surface">
            {userCO2.toFixed(1)} kg
          </span>
        </div>

        {/* India Average bar */}
        <div className="flex items-center gap-3">
          <span className="w-20 text-xs font-semibold text-on-surface-variant truncate">India Avg</span>
          <div className="flex-grow h-6 bg-surface-container-lowest rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${indiaPercent}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
            />
          </div>
          <span className="w-16 text-right text-xs font-bold text-on-surface-variant">
            {indiaCO2.toFixed(1)} kg
          </span>
        </div>

        {/* Global Average bar */}
        <div className="flex items-center gap-3">
          <span className="w-20 text-xs font-semibold text-on-surface-variant truncate">Global Avg</span>
          <div className="flex-grow h-6 bg-surface-container-lowest rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-red-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${globalPercent}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />
          </div>
          <span className="w-16 text-right text-xs font-bold text-on-surface-variant">
            {globalCO2.toFixed(1)} kg
          </span>
        </div>
      </div>

      <div className="mt-2 pt-4 border-t border-outline-variant/30 flex items-center justify-center">
        <div
          className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
            isBelowIndiaAvg
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {isBelowIndiaAvg ? (
            <span>🎉 You're {percentBelow}% below the India daily average!</span>
          ) : (
            <span>⚠️ You're {Math.abs(percentBelow)}% above the India daily average.</span>
          )}
        </div>
      </div>
    </div>
  );
}
