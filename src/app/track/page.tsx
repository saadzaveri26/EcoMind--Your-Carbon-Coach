"use client";
import React, { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useActivities } from "@/lib/hooks/useActivities";
import { CARBON_FACTORS } from "@/lib/carbonData";
import CarbonGauge from "@/components/CarbonGauge";
import EmissionsChart from "@/components/EmissionsChart";
import CategoryPicker from "@/components/CategoryPicker";
import ActivityCard from "@/components/ActivityCard";
import * as Icons from "lucide-react";
import Link from "next/link";

export default function TrackPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    activities,
    totalCO2Today,
    dailyBreakdown,
    loading: activitiesLoading,
    deleteActivity,
  } = useActivities(user?.uid);

  const [category, setCategory] = useState<"Transport" | "Food" | "Energy" | "Shopping">(
    "Transport"
  );
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = React.useCallback(async (id: string) => {
    setIsDeleting(id);
    try {
      await deleteActivity(id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(null);
    }
  }, [deleteActivity]);

  const handleActivityLogged = React.useCallback(() => {
    // No-op for current design
  }, []);

  const getActivityLabel = React.useCallback((cat: string, type: string) => {
    const catFactors = CARBON_FACTORS[cat];
    if (!catFactors) return type;
    const config = catFactors[type];
    return config ? config.label : type;
  }, []);

  const getActivityUnit = React.useCallback((cat: string, type: string) => {
    const catFactors = CARBON_FACTORS[cat];
    if (!catFactors) return "";
    const config = catFactors[type];
    return config ? config.unit : "";
  }, []);

  const todayStr = React.useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const todayActivities = React.useMemo(() => {
    return activities.filter((act) => act.date === todayStr);
  }, [activities, todayStr]);

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
          <h2 className="text-xl font-bold text-on-background">Tracker Locked</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Please log in or register from the homepage to start tracking your daily carbon footprint.
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
    <main className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-8">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-primary">
          <Icons.PlusCircle className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">Logger Workspace</span>
        </div>
        <h1 className="text-2xl font-bold text-on-surface">Daily Carbon Logger</h1>
      </section>

      {/* Grid: Gauge & Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CarbonGauge totalCO2={totalCO2Today} />
        <EmissionsChart data={dailyBreakdown} />
      </div>

      {/* Logger Section */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant px-1">
          Log New Activity
        </h3>
        <CategoryPicker selectedId={category} onChange={setCategory} />
        <ActivityCard
          category={category}
          userId={user.uid}
          onActivityLogged={handleActivityLogged}
        />
      </section>

      {/* Recent Activity Logs */}
      <section className="flex flex-col gap-4 mb-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant px-1">
          Recent Logs Today
        </h3>

        {activitiesLoading ? (
          <div className="flex justify-center p-8">
            <Icons.Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : todayActivities.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-outline-variant/30 p-8 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
            <Icons.FileSpreadsheet className="w-8 h-8 opacity-60" />
            <p className="text-sm font-medium">No activities logged today. Start tracking!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {todayActivities.slice(0, 5).map((act) => (
              <div
                key={act.id}
                className="glass-panel rounded-xl border border-outline-variant/20 p-4 flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/10 shrink-0">
                    {act.category === "Transport" && <Icons.Car className="w-4 h-4 text-blue-400" />}
                    {act.category === "Food" && <Icons.UtensilsCrossed className="w-4 h-4 text-green-400" />}
                    {act.category === "Energy" && <Icons.Zap className="w-4 h-4 text-amber-400" />}
                    {act.category === "Shopping" && <Icons.ShoppingBag className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-semibold text-on-surface truncate">
                      {getActivityLabel(act.category, act.activityType)}
                    </h4>
                    <span className="text-[10px] text-on-surface-variant">
                      Logged {act.quantity} {getActivityUnit(act.category, act.activityType)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="bg-primary/10 border border-primary/20 text-primary font-bold px-2 py-0.5 rounded text-[10px]">
                    {act.co2kg.toFixed(2)} kg CO2
                  </div>
                  <button
                    onClick={() => handleDelete(act.id)}
                    disabled={isDeleting === act.id}
                    className="text-on-surface-variant hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
                    aria-label={`Delete activity ${act.activityType}`}
                  >
                    {isDeleting === act.id ? (
                      <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Icons.Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
