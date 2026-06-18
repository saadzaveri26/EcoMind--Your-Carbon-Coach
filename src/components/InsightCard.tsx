"use client";
import React from "react";
import * as Icons from "lucide-react";

export interface Insight {
  title: string;
  tip: string;
  estimatedWeeklySaving: number; // kg CO2
  impactLevel: "High" | "Medium" | "Low";
  category: string;
}

interface InsightCardProps {
  insight: Insight;
  onTryThis?: (insight: Insight) => void;
  isAdding?: boolean;
}

export default function InsightCard({ insight, onTryThis, isAdding = false }: InsightCardProps) {
  const getImpactDetails = (level: "High" | "Medium" | "Low") => {
    switch (level) {
      case "High":
        return {
          color: "border-l-red-500",
          badgeBg: "bg-red-500/15 text-red-400 border border-red-500/20",
          icon: <Icons.AlertTriangle className="w-3.5 h-3.5" />,
        };
      case "Medium":
        return {
          color: "border-l-amber-500",
          badgeBg: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
          icon: <Icons.AlertCircle className="w-3.5 h-3.5" />,
        };
      case "Low":
        return {
          color: "border-l-green-500",
          badgeBg: "bg-green-500/15 text-green-400 border border-green-500/20",
          icon: <Icons.CheckCircle className="w-3.5 h-3.5" />,
        };
    }
  };

  const details = getImpactDetails(insight.impactLevel);

  return (
    <div
      className={`glass-panel rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group border-l-4 ${details.color}`}
    >
      <div className="flex-grow space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${details.badgeBg}`}>
            {details.icon}
            {insight.impactLevel} Impact
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-lowest text-on-surface-variant border border-outline-variant/20 uppercase tracking-wider">
            {insight.category}
          </span>
        </div>

        <h4 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors duration-200">
          {insight.title}
        </h4>
        <p className="text-xs text-on-surface-variant leading-relaxed max-w-xl">
          {insight.tip}
        </p>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-green-400">
          <Icons.Leaf className="w-3.5 h-3.5" />
          <span>Saves {insight.estimatedWeeklySaving} kg CO2 / week</span>
        </div>
      </div>

      {onTryThis && (
        <button
          onClick={() => onTryThis(insight)}
          disabled={isAdding}
          className="shrink-0 w-full md:w-auto h-11 px-6 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-bright border border-outline-variant/30 transition-all duration-200 font-semibold text-sm active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          aria-label={`Try insight: ${insight.title}`}
        >
          {isAdding ? (
            <>
              <Icons.Loader2 className="w-4 h-4 animate-spin" />
              <span>Adding...</span>
            </>
          ) : (
            <>
              <Icons.Plus className="w-4 h-4" />
              <span>Try This</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
