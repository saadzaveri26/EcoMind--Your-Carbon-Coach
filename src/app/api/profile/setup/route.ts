import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { FieldValue } from "firebase-admin/firestore";

const profileSchema = z.object({
  userId: z.string().min(1),
  lifestyle: z.enum(["Transport", "Food", "Energy", "Shopping"]),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip, 60)) {
    return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid payload parameters", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, lifestyle } = parsed.data;

    const profileRef = adminDb.collection("userProfile").doc(userId);
    const existingSnap = await profileRef.get();

    if (existingSnap.exists) {
      await profileRef.update({
        lifestyle,
      });
    } else {
      await profileRef.set({
        userId,
        lifestyle,
        targetCO2PerDay: 5.0,
        streakDays: 0,
        badgesEarned: [],
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error setting up profile:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
