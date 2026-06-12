"use client";
import React from "react";
import * as Icons from "lucide-react";
import { CATEGORIES } from "@/lib/carbonData";
import { motion } from "framer-motion";

interface CategoryPickerProps {
  selectedId: string;
  onChange: (id: "Transport" | "Food" | "Energy" | "Shopping") => void;
}

export default function CategoryPicker({ selectedId, onChange }: CategoryPickerProps) {
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as unknown as Record<
      string,
      React.ComponentType<{ className?: string }>
    >)[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5 shrink-0" /> : null;
  };

  const getCategoryColor = (id: string) => {
    switch (id) {
      case "Transport":
        return "bg-blue-600 text-white shadow-lg shadow-blue-500/20";
      case "Food":
        return "bg-green-600 text-white shadow-lg shadow-green-500/20";
      case "Energy":
        return "bg-amber-600 text-white shadow-lg shadow-amber-500/20";
      case "Shopping":
        return "bg-purple-600 text-white shadow-lg shadow-purple-500/20";
      default:
        return "bg-slate-700 text-white";
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-4 gap-1 md:gap-2 bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/30">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              className={`relative flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-3 px-1 md:px-3 rounded-lg text-center font-medium transition-all duration-200 active:scale-95 cursor-pointer ${
                isSelected
                  ? getCategoryColor(cat.id)
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              }`}
              aria-label={`Select category ${cat.label}`}
            >
              {getIcon(cat.icon)}
              <span className="text-[10px] md:text-sm font-semibold truncate">{cat.label}</span>
              {isSelected && (
                <motion.div
                  layoutId="activeCategoryHighlight"
                  className="absolute inset-0 rounded-lg border border-white/20 pointer-events-none"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
