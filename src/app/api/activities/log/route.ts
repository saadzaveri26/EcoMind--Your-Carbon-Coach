import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { calculateCO2 } from "@/lib/carbonData";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { FieldValue, QueryDocumentSnapshot } from "firebase-admin/firestore";

/**
 * @module api/activities/log
 * @description Activity logging endpoint — core of the "track" pillar.
 *
 * Problem Statement Alignment:
 * - **Track**: Persists each user activity with its computed CO2 to Firestore,
 *   enabling daily and weekly footprint tracking.
 * - **Simple actions**: Accepts a single activity log (category + type + quantity)
 *   making one-tap logging possible from the UI.
 * - **Understand**: Returns the running daily total so the user sees their
 *   cumulative impact in real time via the Carbon Gauge.
 */

const logSchema = z.object({
  userId: z.string().min(1),
  category: z.enum(["Transport", "Food", "Energy", "Shopping"]),
  activityType: z.string().min(1),
  quantity: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * POST /api/activities/log
 *
 * Validates and logs a single carbon-producing activity for a user.
 * Calculates CO2 using India-specific emission factors, saves to Firestore,
 * and returns the activity's CO2 plus the user's running daily total.
 *
 * @param req - NextRequest with JSON body: { userId, category, activityType, quantity, date }
 * @returns JSON { ok, co2kg, totalToday } on success, or error with status 400/429/500
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip, 60)) {
    return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = logSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input data", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, category, activityType, quantity, date } = parsed.data;

    // Calculate CO2
    const co2kg = calculateCO2(category, activityType, quantity);

    // Save to Firestore activities collection
    const activityRef = adminDb.collection("activities").doc();
    await activityRef.set({
      userId,
      category,
      activityType,
      quantity,
      co2kg,
      date,
      timestamp: FieldValue.serverTimestamp(),
    });

    // Query total today
    const activitiesSnap = await adminDb
      .collection("activities")
      .where("userId", "==", userId)
      .where("date", "==", date)
      .get();

    let totalToday = 0;
    activitiesSnap.docs.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as { co2kg?: number };
      totalToday += data.co2kg || 0;
    });

    return NextResponse.json({
      ok: true,
      co2kg,
      totalToday: Number(totalToday.toFixed(3)),
    });
  } catch (error) {
    console.error("Error logging activity inside app/api/activities/log/route.ts:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error("Unknown error object:", error);
    }
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
