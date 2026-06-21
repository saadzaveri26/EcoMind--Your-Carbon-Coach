import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { FieldValue } from "firebase-admin/firestore";

/**
 * @module api/profile/setup
 * @description User profile onboarding endpoint — enables personalization.
 *
 * Problem Statement Alignment:
 * - **Personalized insights**: Captures the user's lifestyle focus category
 *   (Transport/Food/Energy/Shopping) during onboarding, which Gemini uses
 *   to generate tailored insights and challenges.
 * - **Simple actions**: One-question setup makes onboarding frictionless.
 */

const profileSchema = z.object({
  userId: z.string().min(1).max(100),
  lifestyle: z.enum(["Transport", "Food", "Energy", "Shopping"]),
});

/**
 * POST /api/profile/setup
 *
 * Creates or updates a user's profile with their lifestyle focus category.
 * New profiles are initialized with a 5.0 kg daily CO2 target, zero streak,
 * and empty badge collection.
 *
 * @param req - NextRequest with JSON body: { userId, lifestyle }
 * @returns JSON { ok: true } on success
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip, 60)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", message: "Too many requests. Please try again later.", code: "RATE_LIMIT_EXCEEDED" },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload parameters", message: "Invalid payload parameters", errors: parsed.error.flatten(), code: "VALIDATION_ERROR" },
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
    return NextResponse.json(
      { error: msg, message: msg, code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
