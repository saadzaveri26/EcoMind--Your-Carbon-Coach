"use client";
import React, { useState, useEffect } from "react";
import { CARBON_FACTORS, calculateCO2 } from "@/lib/carbonData";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";

interface ActivityCardProps {
  category: "Transport" | "Food" | "Energy" | "Shopping";
  userId: string;
  onActivityLogged: () => void;
}

function ActivityCard({ category, userId, onActivityLogged }: ActivityCardProps) {
  const factors = CARBON_FACTORS[category] || {};
  const activityKeys = Object.keys(factors);
  const defaultActivity = activityKeys[0] || "";

  const [activityType, setActivityType] = useState(defaultActivity);
  const [quantity, setQuantity] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Reset inputs when category changes
  useEffect(() => {
    const keys = Object.keys(CARBON_FACTORS[category] || {});
    setTimeout(() => {
      setActivityType(keys[0] || "");
      setQuantity(0);
      setErrorMsg("");
      setSuccessMsg("");
    }, 0);
  }, [category]);

  const currentConfig = factors[activityType];
  const unitLabel = currentConfig ? currentConfig.unit : "";
  const calculatedCO2Val = calculateCO2(category, activityType, quantity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setErrorMsg("Please enter a quantity greater than zero.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const response = await fetch("/api/activities/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          category,
          activityType,
          quantity,
          date: dateStr,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to log activity");
      }

      setSuccessMsg(`Logged successfully! Saved ${data.co2kg} kg CO2.`);
      setQuantity(0);
      onActivityLogged();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColorTheme = () => {
    switch (category) {
      case "Transport": return "text-blue-400 border-blue-500/30 focus:border-blue-500";
      case "Food": return "text-green-400 border-green-500/30 focus:border-green-500";
      case "Energy": return "text-amber-400 border-amber-500/30 focus:border-amber-500";
      case "Shopping": return "text-purple-400 border-purple-500/30 focus:border-purple-500";
    }
  };

  const getButtonBg = () => {
    switch (category) {
      case "Transport": return "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20";
      case "Food": return "bg-green-600 hover:bg-green-700 shadow-green-500/20";
      case "Energy": return "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20";
      case "Shopping": return "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20";
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={category}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="glass-panel rounded-2xl border border-outline-variant/30 p-6 shadow-xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
            <span>Log {category} Activity</span>
          </h3>
          <div className="bg-primary/10 border border-primary/20 text-primary font-semibold px-3 py-1 rounded-full text-xs flex items-center gap-1.5 animate-pulse">
            <Icons.Leaf className="w-3.5 h-3.5" />
            <span>{calculatedCO2Val} kg CO2</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Activity Type
            </label>
            <div className="relative">
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className={`w-full bg-surface-container-lowest text-on-background border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer ${getCategoryColorTheme()}`}
              >
                {activityKeys.map((key) => (
                  <option key={key} value={key} className="bg-surface-container text-on-background">
                    {factors[key].label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-on-surface-variant">
                <Icons.ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Quantity ({unitLabel})
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                placeholder={`Enter amount in ${unitLabel}`}
                value={quantity || ""}
                onChange={(e) => setQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`w-full bg-surface-container-lowest text-on-background border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${getCategoryColorTheme()}`}
                required
              />
              <span className="absolute inset-y-0 right-4 flex items-center text-xs font-medium text-on-surface-variant">
                {unitLabel}
              </span>
            </div>
          </div>

          {errorMsg && <p className="text-error text-xs font-medium">{errorMsg}</p>}
          {successMsg && <p className="text-primary text-xs font-medium">{successMsg}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all duration-200 active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${getButtonBg()}`}
          >
            {isSubmitting ? (
              <>
                <Icons.Loader2 className="w-4 h-4 animate-spin" />
                <span>Logging...</span>
              </>
            ) : (
              <>
                <Icons.PlusCircle className="w-4 h-4" />
                <span>Log Activity</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}

export default React.memo(ActivityCard);
