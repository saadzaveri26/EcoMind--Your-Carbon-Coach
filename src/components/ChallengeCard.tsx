"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";

export interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  targetCO2Saving: number;
  completed: boolean;
  completedAt?: { seconds: number; nanoseconds: number } | null;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

interface ChallengeCardProps {
  challenge: ChallengeItem;
  onComplete: (id: string) => Promise<void>;
}

export default function ChallengeCard({ challenge, onComplete }: ChallengeCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete(challenge.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCompleting(false);
    }
  };

  const getDifficultyDetails = (diff: "Easy" | "Medium" | "Hard") => {
    switch (diff) {
      case "Easy":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Hard":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Transport":
        return <Icons.Car className="w-5 h-5 text-blue-400" />;
      case "Food":
        return <Icons.UtensilsCrossed className="w-5 h-5 text-green-400" />;
      case "Energy":
        return <Icons.Zap className="w-5 h-5 text-amber-400" />;
      case "Shopping":
        return <Icons.ShoppingBag className="w-5 h-5 text-purple-400" />;
      default:
        return <Icons.Leaf className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <motion.div
      layout
      className={`glass-panel rounded-2xl p-5 border relative overflow-hidden transition-all duration-300 ${
        challenge.completed
          ? "border-green-500/40 bg-green-950/10 opacity-80"
          : "border-outline-variant/30 hover:border-outline-variant"
      }`}
    >
      {/* Complete Checkmark Overlay */}
      <AnimatePresence>
        {challenge.completed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 right-4 flex items-center gap-1.5 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30"
          >
            <Icons.Check className="w-3.5 h-3.5" />
            <span>Completed</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-4 pr-16">
        <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 shrink-0">
          {getCategoryIcon(challenge.category)}
        </div>

        <div className="space-y-2 flex-grow">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getDifficultyDetails(
                challenge.difficulty
              )}`}
            >
              {challenge.difficulty}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider flex items-center gap-1">
              <Icons.Leaf className="w-3 h-3" />
              Saves {challenge.targetCO2Saving} kg CO2
            </span>
          </div>

          <h4
            className={`text-base font-bold text-on-surface transition-all duration-300 ${
              challenge.completed ? "line-through text-on-surface-variant" : ""
            }`}
          >
            {challenge.title}
          </h4>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {challenge.description}
          </p>
        </div>
      </div>

      {!challenge.completed && (
        <div className="mt-4 pt-4 border-t border-outline-variant/20 flex justify-end">
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="h-10 px-5 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all duration-200 font-semibold text-xs active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            {isCompleting ? (
              <>
                <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Marking...</span>
              </>
            ) : (
              <>
                <Icons.CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Complete</span>
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}
