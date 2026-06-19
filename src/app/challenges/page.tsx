"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useChallenges } from "@/lib/hooks/useChallenges";
import { useActivities } from "@/lib/hooks/useActivities";
import { getMondayOfCurrentWeek } from "@/lib/carbonData";
import ChallengeCard from "@/components/ChallengeCard";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import Link from "next/link";

interface BadgeConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export default function ChallengesPage() {
  const { user, loading: authLoading } = useAuth();
  const { challenges, completedCount, loading: challengesLoading, markComplete } = useChallenges(
    user?.uid
  );
  const { activities } = useActivities(user?.uid);

  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [generatingChallenges, setGeneratingChallenges] = useState(false);

  const weekStart = getMondayOfCurrentWeek();

  // Listen to profile updates for streaks and badges
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const profileRef = doc(db, "userProfile", user.uid);
    const unsubscribe = onSnapshot(
      profileRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          setProfile(null);
        }
        setProfileLoading(false);
      },
      (error) => {
        console.error("Error loading user profile:", error);
        setProfileLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleGenerateChallenges = React.useCallback(async () => {
    if (!user) return;
    setGeneratingChallenges(true);

    const categories = ["Transport", "Food", "Energy", "Shopping"];
    const categoryTotals = categories.map((cat) => {
      const total = activities.filter((a) => a.category === cat).reduce((sum, a) => sum + a.co2kg, 0);
      return { cat, total };
    });
    categoryTotals.sort((a, b) => b.total - a.total);
    let topCategories = categoryTotals.filter((c) => c.total > 0).map((c) => c.cat);

    if (topCategories.length === 0) {
      topCategories = [profile?.lifestyle || "Transport"];
    }

    try {
      const res = await fetch("/api/challenges/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          topCategories,
          lifestyle: profile?.lifestyle || "Transport",
        }),
      });

      if (!res.ok) {
        console.error("Failed to generate challenges");
      }
    } catch (e) {
      console.error("Error generating challenges:", e);
    } finally {
      setGeneratingChallenges(false);
    }
  }, [user, activities, profile]);

  const badgeTemplates = React.useMemo<BadgeConfig[]>(() => [
    {
      id: "first_challenge",
      name: "Carbon Cutter",
      description: "Completed your first eco-challenge task.",
      icon: <Icons.Leaf className="w-6 h-6" />,
      color: "bg-green-500/10 text-green-400 border-green-500/30",
    },
    {
      id: "eco_champion",
      name: "Plant Power",
      description: "Completed all 5 weekly challenges.",
      icon: <Icons.Award className="w-6 h-6" />,
      color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    {
      id: "streak_3",
      name: "Daily Green",
      description: "Logged daily activities 3 days in a row.",
      icon: <Icons.Flame className="w-6 h-6" />,
      color: "bg-red-500/10 text-red-400 border-red-500/30",
    },
  ], []);

  const { currentBadges, streak } = React.useMemo(() => {
    const list = profile?.badgesEarned ? [...profile.badgesEarned] : [];
    const strk = profile?.streakDays || 0;
    if (strk >= 3 && !list.includes("streak_3")) {
      list.push("streak_3");
    }
    return { currentBadges: list, streak: strk };
  }, [profile]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Icons.Leaf className="w-12 h-12 text-primary animate-spin" />
        <span className="text-on-surface-variant font-medium">Loading auth...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-6 py-20 text-center flex flex-col items-center gap-6">
        <div className="bg-surface-container rounded-2xl border border-outline-variant/30 p-8 shadow-xl w-full flex flex-col items-center gap-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <Icons.Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-on-background">Challenges Locked</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Please log in or register from the homepage to check your custom Eco Challenges.
          </p>
          <Link
            href="/"
            className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:bg-primary-container shadow-md transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <Icons.Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-6 flex flex-col gap-8">
      {/* Header Row */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-primary mb-1">
            <Icons.Trophy className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">
              Weekly Task Assignments
            </span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Weekly Challenges</h1>
        </div>

        {streak > 0 && (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="self-start sm:self-auto bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5"
          >
            <Icons.Flame className="w-4.5 h-4.5 fill-red-400" />
            <span>🔥 {streak} Day Streak</span>
          </motion.div>
        )}
      </section>

      {/* Progress Bar */}
      {challenges.length > 0 && (
        <section className="glass-panel rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            <span>Weekly Target Completion</span>
            <span>
              {completedCount} / {challenges.length} Tasks
            </span>
          </div>
          <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden border border-outline-variant/10">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / challenges.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </section>
      )}

      {/* Challenge List */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant px-1">
            Your Active Tasks
          </h3>
          {challenges.length === 0 && (
            <button
              onClick={handleGenerateChallenges}
              disabled={generatingChallenges}
              className="h-10 px-5 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-semibold text-xs active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
            >
              {generatingChallenges ? (
                <>
                  <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Configuring tasks...</span>
                </>
              ) : (
                <>
                  <Icons.Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Weekly Challenges</span>
                </>
              )}
            </button>
          )}
        </div>

        {challengesLoading ? (
          <div className="flex justify-center p-8">
            <Icons.Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-outline-variant/30 p-10 flex flex-col items-center justify-center text-center gap-4 text-on-surface-variant">
            <div className="bg-primary/5 p-4 rounded-full border border-primary/10">
              <Icons.Leaf className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <p className="text-sm font-semibold max-w-sm leading-relaxed">
              No active challenges set. Generate your weekly personalized plan to get started!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} onComplete={markComplete} />
            ))}
          </div>
        )}
      </section>

      {/* Badges Grid */}
      <section className="flex flex-col gap-4 mb-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant px-1">
          Earned Eco-Badges
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {badgeTemplates.map((badge) => {
            const isEarned = currentBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`glass-panel rounded-2xl p-5 border flex flex-col items-center text-center gap-3 transition-all duration-300 relative group ${
                  isEarned ? badge.color : "border-outline-variant/10 opacity-30 select-none"
                }`}
              >
                <div className="p-3 rounded-full bg-surface-container">{badge.icon}</div>
                <div>
                  <h4 className="text-sm font-bold text-on-surface">{badge.name}</h4>
                  <p className="text-[10px] text-on-surface-variant/80 mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
                {!isEarned && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center pointer-events-none">
                    <Icons.Lock className="w-5 h-5 text-on-surface-variant/40" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
