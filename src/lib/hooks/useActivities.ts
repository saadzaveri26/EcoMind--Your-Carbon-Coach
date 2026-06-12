import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ActivityLog {
  id: string;
  userId: string;
  category: "Transport" | "Food" | "Energy" | "Shopping";
  activityType: string;
  quantity: number;
  co2kg: number;
  date: string; // YYYY-MM-DD
  timestamp: { seconds: number; nanoseconds: number } | null;
}

export function useActivities(userId: string | undefined) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "activities"),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logs: ActivityLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          logs.push({
            id: doc.id,
            userId: data.userId || "",
            category: data.category || "Transport",
            activityType: data.activityType || "",
            quantity: data.quantity || 0,
            co2kg: data.co2kg || 0,
            date: data.date || "",
            timestamp: data.timestamp || null,
          });
        });

        // Client-side sort by timestamp desc or date desc to avoid index build requirements
        logs.sort((a, b) => {
          const timeA = a.timestamp?.seconds || 0;
          const timeB = b.timestamp?.seconds || 0;
          return timeB - timeA;
        });

        setActivities(logs);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to activities: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Utility to get YYYY-MM-DD
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const todayStr = getLocalDateString(today);

  // Generate last 7 days list (including today)
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    last7Days.push(getLocalDateString(d));
  }

  // Filter last 7 days logs
  const last7DaysActivities = activities.filter((act) =>
    last7Days.includes(act.date)
  );

  const totalCO2Today = activities
    .filter((act) => act.date === todayStr)
    .reduce((sum, act) => sum + act.co2kg, 0);

  const totalCO2Week = last7DaysActivities.reduce((sum, act) => sum + act.co2kg, 0);

  const dailyBreakdown = last7Days.map((dateStr) => {
    const dayLogs = activities.filter((act) => act.date === dateStr);
    const byCategory = { Transport: 0, Food: 0, Energy: 0, Shopping: 0 };
    let dayTotal = 0;
    dayLogs.forEach((act) => {
      if (act.category in byCategory) {
        byCategory[act.category] += act.co2kg;
        dayTotal += act.co2kg;
      }
    });

    const dateObj = new Date(dateStr + "T00:00:00");
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });

    return {
      date: dayName,
      dateStr,
      total: Number(dayTotal.toFixed(3)),
      byCategory: {
        Transport: Number(byCategory.Transport.toFixed(3)),
        Food: Number(byCategory.Food.toFixed(3)),
        Energy: Number(byCategory.Energy.toFixed(3)),
        Shopping: Number(byCategory.Shopping.toFixed(3)),
      },
    };
  });

  const deleteActivity = async (activityId: string) => {
    try {
      await deleteDoc(doc(db, "activities", activityId));
    } catch (e) {
      console.error("Error deleting activity:", e);
      throw e;
    }
  };

  return {
    activities,
    totalCO2Today: Number(totalCO2Today.toFixed(3)),
    totalCO2Week: Number(totalCO2Week.toFixed(3)),
    dailyBreakdown,
    loading,
    deleteActivity,
  };
}
