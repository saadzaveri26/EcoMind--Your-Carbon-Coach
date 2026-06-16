import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { calculateCO2 } from "@/lib/carbonData";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { FieldValue, QueryDocumentSnapshot } from "firebase-admin/firestore";

const logSchema = z.object({
  userId: z.string().min(1),
  category: z.enum(["Transport", "Food", "Energy", "Shopping"]),
  activityType: z.string().min(1),
  quantity: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

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
