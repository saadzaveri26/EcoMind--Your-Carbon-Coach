"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useActivities } from "@/lib/hooks/useActivities";
import { getMondayOfCurrentWeek } from "@/lib/carbonData";
import ComparisonBar from "@/components/ComparisonBar";
import InsightCard, { Insight } from "@/components/InsightCard";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { INDIA_DAILY_AVERAGE, GLOBAL_DAILY_AVERAGE } from "@/lib/carbonData";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import * as Icons from "lucide-react";
import Link from "next/link";

export default function InsightsPage() {
  const { user, loading: authLoading } = useAuth();
  const { activities, loading: activitiesLoading } = useActivities(user?.uid);

  const [lifestyle, setLifestyle] = useState("Transport");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [addingChallengeId, setAddingChallengeId] = useState<string | null>(null);
  const [successChallenge, setSuccessChallenge] = useState("");

  const weekStart = getMondayOfCurrentWeek();

  // Load lifestyle and existing report
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        // Load userProfile to get lifestyle focus
        const profileSnap = await getDoc(doc(db, "userProfile", user.uid));
        if (profileSnap.exists()) {
          setLifestyle(profileSnap.data().lifestyle || "Transport");
        }

        // Load existing weekly report if any
        const reportSnap = await getDoc(doc(db, "weeklyReports", `${user.uid}_${weekStart}`));
        if (reportSnap.exists()) {
          setInsights(reportSnap.data().insights || []);
        }
      } catch (e) {
        console.error("Error loading insights data:", e);
      }
    }
    loadData();
  }, [user, weekStart]);

  // Calculations for 14-day comparison
  const getLocalDateString = React.useCallback((d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const { thisWeekDays, lastWeekDays } = React.useMemo(() => {
    const todayVal = new Date();
    const thisDays: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(todayVal.getDate() - i);
      thisDays.push(getLocalDateString(d));
    }
    const lastDays: string[] = [];
    for (let i = 13; i >= 7; i--) {
      const d = new Date();
      d.setDate(todayVal.getDate() - i);
      lastDays.push(getLocalDateString(d));
    }
    return { thisWeekDays: thisDays, lastWeekDays: lastDays };
  }, [getLocalDateString]);

  const thisWeekLogs = React.useMemo(() => {
    return activities.filter((a) => thisWeekDays.includes(a.date));
  }, [activities, thisWeekDays]);

  const lastWeekLogs = React.useMemo(() => {
    return activities.filter((a) => lastWeekDays.includes(a.date));
  }, [activities, lastWeekDays]);

  const thisWeekTotal = React.useMemo(() => {
    return thisWeekLogs.reduce((sum, a) => sum + a.co2kg, 0);
  }, [thisWeekLogs]);

  const lastWeekTotal = React.useMemo(() => {
    return lastWeekLogs.reduce((sum, a) => sum + a.co2kg, 0);
  }, [lastWeekLogs]);

  const weekdays = React.useMemo(() => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], []);
  
  const getDayIndex = React.useCallback((dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDay();
    return day === 0 ? 6 : day - 1;
  }, []);

  const lineChartData = React.useMemo(() => {
    return weekdays.map((dayName, idx) => {
      const thisDayLogs = thisWeekLogs.filter((a) => getDayIndex(a.date) === idx);
      const lastDayLogs = lastWeekLogs.filter((a) => getDayIndex(a.date) === idx);
      return {
        day: dayName,
        "This Week": Number(thisDayLogs.reduce((sum, a) => sum + a.co2kg, 0).toFixed(2)),
        "Last Week": Number(lastDayLogs.reduce((sum, a) => sum + a.co2kg, 0).toFixed(2)),
      };
    });
  }, [weekdays, thisWeekLogs, lastWeekLogs, getDayIndex]);

  const highestDayName = React.useMemo(() => {
    const dailyTotals = thisWeekDays.map((dateStr) => {
      const total = thisWeekLogs.filter((a) => a.date === dateStr).reduce((sum, a) => sum + a.co2kg, 0);
      return { dateStr, total };
    });
    if (dailyTotals.length > 0) {
      const maxDay = dailyTotals.reduce((max, d) => (d.total > max.total ? d : max), { dateStr: "", total: -1 });
      if (maxDay.total > 0) {
        const d = new Date(maxDay.dateStr + "T00:00:00");
        return d.toLocaleDateString("en-US", { weekday: "long" });
      }
    }
    return "None";
  }, [thisWeekDays, thisWeekLogs]);

  const biggestCat = React.useMemo(() => {
    const categories = ["Transport", "Food", "Energy", "Shopping"];
    const categoryTotals = categories.map((cat) => {
      const total = thisWeekLogs.filter((a) => a.category === cat).reduce((sum, a) => sum + a.co2kg, 0);
      return { cat, total };
    });
    return categoryTotals.reduce((max, c) => (c.total > max.total ? c : max), { cat: "None", total: 0 });
  }, [thisWeekLogs]);

  const percentageChange = React.useMemo(() => {
    if (lastWeekTotal > 0) {
      return Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100);
    }
    return 0;
  }, [thisWeekTotal, lastWeekTotal]);

  const handleGenerateReport = React.useCallback(async () => {
    if (!user) return;
    setGeneratingReport(true);
    setInsights([]);

    const breakdown = { Transport: 0, Food: 0, Energy: 0, Shopping: 0 };
    thisWeekLogs.forEach((a) => {
      if (a.category in breakdown) {
        breakdown[a.category] += a.co2kg;
      }
    });

    try {
      const res = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          lifestyle,
          weekData: {
            totalCO2: Number(thisWeekTotal.toFixed(3)),
            breakdown,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      } else {
        console.error("Failed to generate weekly report");
      }
    } catch (e) {
      console.error("Error generating weekly report:", e);
    } finally {
      setGeneratingReport(false);
    }
  }, [user, thisWeekLogs, lifestyle, thisWeekTotal]);

  const handleTryThis = React.useCallback(async (insight: Insight) => {
    if (!user) return;
    setAddingChallengeId(insight.title);
    setSuccessChallenge("");

    try {
      const challengesRef = doc(db, "challenges", `${user.uid}_${weekStart}`);
      const snap = await getDoc(challengesRef);

      const newChallenge = {
        id: `custom_${Date.now()}`,
        title: insight.title.substring(0, 40),
        description: insight.tip.substring(0, 150),
        targetCO2Saving: insight.estimatedWeeklySaving,
        completed: false,
        category: insight.category,
        difficulty: insight.impactLevel === "High" ? "Hard" : insight.impactLevel === "Medium" ? "Medium" : "Easy",
      };

      if (snap.exists()) {
        const existingData = snap.data();
        const items = existingData.items || [];
        if (!items.some((c: any) => c.title === newChallenge.title)) {
          await updateDoc(challengesRef, {
            items: [...items, newChallenge],
          });
        }
      } else {
        await setDoc(challengesRef, {
          userId: user.uid,
          weekStart,
          items: [newChallenge],
        });
      }

      setSuccessChallenge(`Added "${insight.title}" to your Challenges page!`);
    } catch (e) {
      console.error("Error adding challenge:", e);
    } finally {
      setAddingChallengeId(null);
    }
  }, [user, weekStart]);

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
          <h2 className="text-xl font-bold text-on-background">Insights Locked</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Please log in or register from the homepage to check your AI Weekly Carbon reports.
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
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-primary mb-1">
            <Icons.Sparkles className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">
              Week: {weekStart} - Today
            </span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Weekly Report & Averages</h1>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={generatingReport || activitiesLoading}
          className="h-11 px-6 rounded-xl border border-primary text-primary hover:bg-primary/10 transition-colors font-semibold text-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {generatingReport ? (
            <>
              <Icons.Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing carbon logs...</span>
            </>
          ) : (
            <>
              <Icons.RefreshCw className="w-4 h-4" />
              <span>Generate AI Report</span>
            </>
          )}
        </button>
      </section>

      {/* Comparison and stats bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7">
          {/* We show weekly totals by multiplying average by 7 */}
          <ComparisonBar
            userCO2={thisWeekTotal}
            indiaCO2={INDIA_DAILY_AVERAGE * 7}
            globalCO2={GLOBAL_DAILY_AVERAGE * 7}
          />
        </div>

        <div className="md:col-span-5 grid grid-cols-2 gap-4">
          <div className="glass-panel rounded-xl p-4 flex flex-col justify-center gap-1">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Weekly Total
            </span>
            <span className="text-lg font-bold text-primary">{thisWeekTotal.toFixed(1)} kg</span>
          </div>

          <div className="glass-panel rounded-xl p-4 flex flex-col justify-center gap-1">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Highest Day
            </span>
            <span className="text-lg font-bold text-on-surface">{highestDayName}</span>
          </div>

          <div className="glass-panel rounded-xl p-4 flex flex-col justify-center gap-1">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Biggest Category
            </span>
            <span className="text-lg font-bold text-amber-500 truncate">
              {biggestCat.total > 0 ? biggestCat.cat : "None"}
            </span>
          </div>

          <div className="glass-panel rounded-xl p-4 flex flex-col justify-center gap-1">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Vs Last Week
            </span>
            {lastWeekTotal > 0 ? (
              <span
                className={`text-lg font-bold flex items-center gap-1 ${
                  percentageChange <= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {percentageChange <= 0 ? (
                  <Icons.ArrowDown className="w-4 h-4" />
                ) : (
                  <Icons.ArrowUp className="w-4 h-4" />
                )}
                {Math.abs(percentageChange)}%
              </span>
            ) : (
              <span className="text-lg font-bold text-on-surface-variant">--</span>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Trend Line Chart */}
      <section className="glass-panel rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            Weekly Trend (This Week vs Last Week)
          </h3>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
              <span className="text-on-surface-variant">This Week</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-outline inline-block"></span>
              <span className="text-on-surface-variant">Last Week</span>
            </div>
          </div>
        </div>

        <div className="w-full" style={{ height: "200px" }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit="kg" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#d7e3fc",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="This Week"
                stroke="#62df7d"
                strokeWidth={3}
                dot={{ stroke: "#62df7d", strokeWidth: 2, r: 3, fill: "#0A1628" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="Last Week"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ stroke: "#64748b", strokeWidth: 1.5, r: 2, fill: "#0A1628" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* AI Recommendations */}
      <section className="flex flex-col gap-4 mb-8">
        <div className="flex items-center gap-1.5 text-tertiary">
          <Icons.Brain className="w-5 h-5 animate-pulse" />
          <h2 className="text-lg font-semibold text-on-surface">AI Insights & Actions</h2>
        </div>

        {successChallenge && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Icons.Check className="w-4 h-4 shrink-0" />
            <span>{successChallenge}</span>
          </div>
        )}

        {generatingReport ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-28 rounded-2xl bg-surface-container animate-pulse border border-outline-variant/10"
              />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-outline-variant/30 p-8 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
            <Icons.Sparkles className="w-8 h-8 opacity-60 animate-pulse" />
            <p className="text-sm font-medium">No active report generated. Click "Generate AI Report" above.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {insights.map((insight, idx) => (
              <InsightCard
                key={idx}
                insight={insight}
                onTryThis={handleTryThis}
                isAdding={addingChallengeId === insight.title}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
