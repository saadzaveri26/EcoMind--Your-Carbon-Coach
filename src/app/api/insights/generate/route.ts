import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getMondayOfCurrentWeek } from "@/lib/carbonData";
import { FieldValue } from "firebase-admin/firestore";

const generateSchema = z.object({
  userId: z.string().min(1),
  lifestyle: z.string().min(1),
  weekData: z.object({
    totalCO2: z.number(),
    breakdown: z.object({
      Transport: z.number(),
      Food: z.number(),
      Energy: z.number(),
      Shopping: z.number(),
    }),
  }),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip, 60)) {
    return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid payload details", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, lifestyle, weekData } = parsed.data;
    const weekStart = getMondayOfCurrentWeek();

    // Check if we already have a generated report for this user and week
    const reportDocId = `${userId}_${weekStart}`;
    const reportRef = adminDb.collection("weeklyReports").doc(reportDocId);
    const existingSnap = await reportRef.get();

    if (existingSnap.exists) {
      const data = existingSnap.data();
      return NextResponse.json(data?.insights || []);
    }

    const apiKey = process.env.GEMINI_API_KEY || "";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: "You are EcoMind, a friendly and practical carbon footprint coach. You help individuals in India understand their environmental impact and take realistic, affordable actions to reduce it. You are encouraging, never preachy or guilt-tripping. You suggest specific, actionable steps relevant to Indian lifestyle and infrastructure. You keep responses concise and motivating."
    });

    const prompt = `Analyze this carbon footprint data for an Indian user:
Weekly total: ${weekData.totalCO2} kg CO2
Breakdown: Transport: ${weekData.breakdown.Transport} kg, Food: ${weekData.breakdown.Food} kg, Energy: ${weekData.breakdown.Energy} kg, Shopping: ${weekData.breakdown.Shopping} kg
Their lifestyle focus: ${lifestyle}

Generate exactly 3 personalized, actionable insights.
Return ONLY a valid JSON array, no markdown, no backticks.
Schema: [{"title": "string", "tip": "string (max 50 words)", "estimatedWeeklySaving": number (kg CO2), "impactLevel": "High"|"Medium"|"Low", "category": "string"}]`;

    let parsedResult: unknown[] | null = null;
    let attempts = 2;

    while (attempts > 0 && !parsedResult) {
      try {
        const result = await model.generateContent(prompt);
        let text = result.response.text() || "";
        
        // Strip markdown backticks if present
        text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        parsedResult = JSON.parse(text) as unknown[];
      } catch (err) {
        console.error(`Gemini call/parse attempt failed. Attempts left: ${attempts - 1}`, err);
        attempts--;
        if (attempts === 0) throw err;
      }
    }

    // Save to Firestore weeklyReports
    await reportRef.set({
      userId,
      weekStart,
      totalCO2: weekData.totalCO2,
      breakdown: weekData.breakdown,
      insights: parsedResult,
      generatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error("Error generating insights:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
