import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { INDIA_DAILY_AVERAGE } from "@/lib/carbonData";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

/**
 * @module api/activities/summary
 * @description Weekly summary endpoint — core of the "understand" pillar.
 *
 * Problem Statement Alignment:
 * - **Understand**: Aggregates N days of activities into daily breakdowns
 *   and category totals, enabling comparison bars and trend charts.
 * - **Personalized insights**: Compares the user's daily average against
 *   the India national average (11.2 kg CO2/day), providing context
 *   that makes the footprint personally meaningful.
 * - **Track**: Powers the 7-day stacked bar chart on the /track page.
 */

const querySchema = z.object({
  userId: z.string().min(1),
  days: z.preprocess((val) => (val ? Number(val) : 7), z.number().int().min(1)),
});

/**
 * GET /api/activities/summary?userId=...&days=...
 *
 * Fetches all activities for a user, groups them by date and category,
 * and returns a daily breakdown array with totals and a percentage
 * comparison against India's average daily footprint.
 *
 * @param req - NextRequest with query params: userId (required), days (optional, default 7)
 * @returns JSON { dailyBreakdown, totalCO2, byCategory, comparedToAverage }
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip, 60)) {
    return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const params = {
      userId: searchParams.get("userId"),
      days: searchParams.get("days"),
    };

    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid query parameters", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, days } = parsed.data;

    // Fetch activities
    const activitiesSnap = await adminDb
      .collection("activities")
      .where("userId", "==", userId)
      .get();

    interface ActivityDoc {
      userId: string;
      category: "Transport" | "Food" | "Energy" | "Shopping";
      activityType: string;
      quantity: number;
      co2kg: number;
      date: string;
    }

    const activities: ActivityDoc[] = [];
    activitiesSnap.docs.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as ActivityDoc;
      activities.push(data);
    });

    // Generate last N days array (including today) in YYYY-MM-DD local format
    const getLocalDateString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const dateList: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dateList.push(getLocalDateString(d));
    }

    let totalCO2 = 0;
    const byCategory = { Transport: 0, Food: 0, Energy: 0, Shopping: 0 };

    const dailyBreakdown = dateList.map((dateStr) => {
      const dayLogs = activities.filter((act) => act.date === dateStr);
      const dayCategory = { Transport: 0, Food: 0, Energy: 0, Shopping: 0 };
      let dayTotal = 0;

      dayLogs.forEach((act) => {
        const cat = act.category;
        if (cat in dayCategory) {
          dayCategory[cat] += act.co2kg || 0;
          byCategory[cat] += act.co2kg || 0;
          dayTotal += act.co2kg || 0;
          totalCO2 += act.co2kg || 0;
        }
      });

      const dateObj = new Date(dateStr + "T00:00:00");
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });

      return {
        date: dayName,
        dateStr,
        total: Number(dayTotal.toFixed(3)),
        Transport: Number(dayCategory.Transport.toFixed(3)),
        Food: Number(dayCategory.Food.toFixed(3)),
        Energy: Number(dayCategory.Energy.toFixed(3)),
        Shopping: Number(dayCategory.Shopping.toFixed(3)),
      };
    });

    // Calculate percentage compared to India average
    const userDailyAvg = totalCO2 / days;
    const pctDiff = ((userDailyAvg - INDIA_DAILY_AVERAGE) / INDIA_DAILY_AVERAGE) * 100;

    return NextResponse.json({
      dailyBreakdown,
      totalCO2: Number(totalCO2.toFixed(3)),
      byCategory: {
        Transport: Number(byCategory.Transport.toFixed(3)),
        Food: Number(byCategory.Food.toFixed(3)),
        Energy: Number(byCategory.Energy.toFixed(3)),
        Shopping: Number(byCategory.Shopping.toFixed(3)),
      },
      comparedToAverage: Number(pctDiff.toFixed(1)),
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
