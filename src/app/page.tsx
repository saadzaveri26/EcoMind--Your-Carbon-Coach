"use client";
/**
 * @file page.tsx
 * @description Landing and onboarding page — gateway to carbon footprint coaching.
 *
 * Problem Statement Alignment:
 * - **Simple actions**: Provides a frictionless one-question onboarding flow that captures the user's lifestyle focus.
 * - **Personalized insights**: Instantly triggers Gemini to generate a personalized opening insight based on their selected focus area.
 * - **Understand & Reduce**: Prepares the user's dashboard with streak tracking, badge progress, and direct navigation paths.
 */
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import Link from "next/link";
import InsightCard, { Insight } from "@/components/InsightCard";

interface UserProfile {
  userId?: string;
  lifestyle?: "Transport" | "Food" | "Energy" | "Shopping";
  targetCO2PerDay?: number;
  streakDays?: number;
  badgesEarned?: string[];
}

export default function LandingPage() {
  const { user, loading: authLoading, signInWithGoogle, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [onboardingChoice, setOnboardingChoice] = useState<"Transport" | "Food" | "Energy" | "Shopping" | null>(null);
  const [openingInsight, setOpeningInsight] = useState<Insight | null>(null);
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false);

  // Fetch profile when user logs in
  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      try {
        const profileRef = doc(db, "userProfile", user.uid);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setProfileLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  const handleOnboardingSelect = (category: "Transport" | "Food" | "Energy" | "Shopping") => {
    setOnboardingChoice(category);
  };

  const submitOnboarding = async () => {
    if (!user || !onboardingChoice) return;
    setIsSubmittingOnboarding(true);
    try {
      // Create user profile
      const res = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          lifestyle: onboardingChoice,
        }),
      });

      if (!res.ok) throw new Error("Failed to set up profile");

      // Generate opening insight
      const insightRes = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          lifestyle: onboardingChoice,
          weekData: {
            totalCO2: 0,
            breakdown: { Transport: 0, Food: 0, Energy: 0, Shopping: 0 },
          },
        }),
      });

      if (insightRes.ok) {
        const insights = await insightRes.json();
        if (insights && insights.length > 0) {
          setOpeningInsight(insights[0]);
        }
      }

      setProfile({
        userId: user.uid,
        lifestyle: onboardingChoice,
        targetCO2PerDay: 5.0,
        streakDays: 0,
        badgesEarned: [],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingOnboarding(false);
    }
  };

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Icons.Leaf className="w-12 h-12 text-primary animate-spin" />
        <span className="text-on-surface-variant font-medium">Loading EcoMind...</span>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  } as const;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } },
  } as const;

  return (
    <main className="max-w-7xl mx-auto px-6 flex flex-col gap-12 py-12">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center text-center py-12 gap-6"
      >
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-on-background max-w-4xl leading-tight">
          Know Your Carbon. <br />
          <span className="text-primary">Change Your World.</span>
        </h1>
        <p className="text-base md:text-lg text-on-surface-variant max-w-2xl">
          EcoMind tracks your footprint and coaches you toward a greener lifestyle — one action at a
          time.
        </p>

        {!user ? (
          <button
            onClick={signInWithGoogle}
            className="bg-primary text-on-primary font-semibold px-8 py-3 rounded-full min-h-[44px] hover:bg-primary-container transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center gap-2 cursor-pointer mt-4"
          >
            <Icons.LogIn className="w-5 h-5" />
            <span>Sign In with Google</span>
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <Link
              href="/track"
              className="bg-primary text-on-primary font-semibold px-8 py-3 rounded-full min-h-[44px] hover:bg-primary-container transition-all shadow-lg shadow-primary/20 active:scale-95 text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <Icons.PlusCircle className="w-5 h-5" />
              <span>Start Tracking</span>
            </Link>
            <Link
              href="/insights"
              className="bg-transparent text-on-background border border-outline-variant/60 font-semibold px-8 py-3 rounded-full min-h-[44px] hover:bg-surface-container transition-all active:scale-95 text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <Icons.BarChart3 className="w-5 h-5" />
              <span>See Insights</span>
            </Link>
          </div>
        )}
      </motion.section>

      {user && !profile && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container rounded-2xl border border-outline-variant/30 p-8 shadow-xl max-w-3xl mx-auto w-full"
        >
          <h2 className="text-xl font-bold text-on-background mb-6 flex items-center gap-2">
            <Icons.Sparkles className="text-primary w-5 h-5 animate-pulse" />
            <span>Onboarding: Customize Your Coach</span>
          </h2>
          <p className="text-sm text-on-surface-variant mb-6">
            Which category represents your biggest carbon habit? Choose one to receive your initial
            AI insight.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Transport */}
            <button
              onClick={() => handleOnboardingSelect("Transport")}
              className={`flex flex-col items-start p-5 rounded-xl border transition-all duration-200 group active:scale-95 cursor-pointer ${
                onboardingChoice === "Transport"
                  ? "bg-blue-600/10 border-blue-500 text-white"
                  : "bg-surface-container-low border-outline-variant/20 hover:border-blue-500/50"
              }`}
            >
              <div className="bg-blue-500/10 p-3 rounded-xl mb-3">
                <Icons.Car className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="font-bold text-sm text-on-background mb-1">Transport</span>
              <span className="text-xs text-on-surface-variant text-left">Commuting & travel</span>
            </button>

            {/* Food */}
            <button
              onClick={() => handleOnboardingSelect("Food")}
              className={`flex flex-col items-start p-5 rounded-xl border transition-all duration-200 group active:scale-95 cursor-pointer ${
                onboardingChoice === "Food"
                  ? "bg-green-600/10 border-green-500 text-white"
                  : "bg-surface-container-low border-outline-variant/20 hover:border-green-500/50"
              }`}
            >
              <div className="bg-green-500/10 p-3 rounded-xl mb-3">
                <Icons.UtensilsCrossed className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="font-bold text-sm text-on-background mb-1">Food</span>
              <span className="text-xs text-on-surface-variant text-left">Diet & groceries</span>
            </button>

            {/* Energy */}
            <button
              onClick={() => handleOnboardingSelect("Energy")}
              className={`flex flex-col items-start p-5 rounded-xl border transition-all duration-200 group active:scale-95 cursor-pointer ${
                onboardingChoice === "Energy"
                  ? "bg-amber-600/10 border-amber-500 text-white"
                  : "bg-surface-container-low border-outline-variant/20 hover:border-amber-500/50"
              }`}
            >
              <div className="bg-amber-500/10 p-3 rounded-xl mb-3">
                <Icons.Zap className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="font-bold text-sm text-on-background mb-1">Energy</span>
              <span className="text-xs text-on-surface-variant text-left">Home utility usage</span>
            </button>

            {/* Shopping */}
            <button
              onClick={() => handleOnboardingSelect("Shopping")}
              className={`flex flex-col items-start p-5 rounded-xl border transition-all duration-200 group active:scale-95 cursor-pointer ${
                onboardingChoice === "Shopping"
                  ? "bg-purple-600/10 border-purple-500 text-white"
                  : "bg-surface-container-low border-outline-variant/20 hover:border-purple-500/50"
              }`}
            >
              <div className="bg-purple-500/10 p-3 rounded-xl mb-3">
                <Icons.ShoppingBag className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="font-bold text-sm text-on-background mb-1">Shopping</span>
              <span className="text-xs text-on-surface-variant text-left">Goods & services</span>
            </button>
          </div>

          <button
            onClick={submitOnboarding}
            disabled={!onboardingChoice || isSubmittingOnboarding}
            className="w-full bg-primary text-on-primary font-bold py-3.5 px-6 rounded-xl hover:bg-primary-container shadow-md shadow-primary/20 transition-all duration-200 active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmittingOnboarding ? (
              <>
                <Icons.Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating custom profile...</span>
              </>
            ) : (
              <>
                <Icons.Sparkles className="w-4 h-4" />
                <span>Get My Personalized Plan</span>
              </>
            )}
          </button>
        </motion.section>
      )}

      {openingInsight && (
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl mx-auto w-full space-y-4"
        >
          <div className="flex items-center gap-2 text-primary font-bold">
            <Icons.Sparkles className="w-5 h-5 animate-spin" />
            <span>Your Custom Opening Insight</span>
          </div>
          <InsightCard insight={openingInsight} />
          <div className="flex justify-center mt-4">
            <Link
              href="/track"
              className="bg-primary text-on-primary font-bold px-8 py-3 rounded-full hover:bg-primary-container shadow-lg shadow-primary/20 transition-all duration-200 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continue to Tracker</span>
              <Icons.ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.section>
      )}

      {/* Stats and Info Row */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div
          variants={itemVariants}
          className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg"
        >
          <span className="text-2xl md:text-3xl font-display font-bold text-primary mb-1">
            2.5 Billion Tons
          </span>
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            India&apos;s annual CO2 emissions
          </span>
        </motion.div>
        <motion.div
          variants={itemVariants}
          className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg"
        >
          <span className="text-2xl md:text-3xl font-display font-bold text-tertiary mb-1">
            5.0 kg
          </span>
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Your daily target footprint
          </span>
        </motion.div>
        <motion.div
          variants={itemVariants}
          className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
          <span className="text-2xl md:text-3xl font-display font-bold text-secondary mb-1">
            40% Reduction
          </span>
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Average local potential saving
          </span>
        </motion.div>
      </motion.section>

      {/* Explore EcoMind Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="flex flex-col gap-6"
      >
        <h3 className="text-xl font-bold text-on-background px-1">Explore EcoMind</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/track"
            className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-2xl p-6 flex items-center gap-5 cursor-pointer group shadow-md transition-all duration-200"
          >
            <div className="bg-primary/10 p-4 rounded-xl shrink-0 group-hover:bg-primary/20 transition-all duration-200">
              <Icons.PlusCircle className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-grow">
              <h4 className="font-bold text-sm text-on-background mb-1">Track Daily</h4>
              <p className="text-xs text-on-surface-variant">Log activities and check real-time calculations.</p>
            </div>
            <Icons.ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-white transition-colors" />
          </Link>

          <Link
            href="/insights"
            className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-2xl p-6 flex items-center gap-5 cursor-pointer group shadow-md transition-all duration-200"
          >
            <div className="bg-tertiary/10 p-4 rounded-xl shrink-0 group-hover:bg-tertiary/20 transition-all duration-200">
              <Icons.BarChart3 className="w-6 h-6 text-tertiary group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-grow">
              <h4 className="font-bold text-sm text-on-background mb-1">AI Insights</h4>
              <p className="text-xs text-on-surface-variant">Compare trends and unlock target metrics.</p>
            </div>
            <Icons.ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-white transition-colors" />
          </Link>

          <Link
            href="/challenges"
            className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-2xl p-6 flex items-center gap-5 cursor-pointer group shadow-md transition-all duration-200"
          >
            <div className="bg-secondary/10 p-4 rounded-xl shrink-0 group-hover:bg-secondary/20 transition-all duration-200">
              <Icons.Trophy className="w-6 h-6 text-secondary group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-grow">
              <h4 className="font-bold text-sm text-on-background mb-1">Weekly Tasks</h4>
              <p className="text-xs text-on-surface-variant">Perform mini-tasks and build streaks.</p>
            </div>
            <Icons.ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-white transition-colors" />
          </Link>
        </div>
      </motion.section>

      {user && (
        <div className="flex justify-center mt-6">
          <button
            onClick={logout}
            className="text-xs font-semibold text-on-surface-variant hover:text-red-400 border border-outline-variant/30 rounded-xl px-4 py-2 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            Sign Out of Account ({user.email})
          </button>
        </div>
      )}
    </main>
  );
}
