import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getMondayOfCurrentWeek } from "@/lib/carbonData";

interface ChallengeRaw {
  id: string;
  title: string;
  description: string;
  targetCO2Saving: number;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

const generateSchema = z.object({
  userId: z.string().min(1),
  topCategories: z.array(z.string()),
  lifestyle: z.string().min(1),
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
        { message: "Invalid payload parameters", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, topCategories, lifestyle } = parsed.data;
    const weekStart = getMondayOfCurrentWeek();

    // Check if challenges already exist for this week
    const docId = `${userId}_${weekStart}`;
    const challengesRef = adminDb.collection("challenges").doc(docId);
    const existingSnap = await challengesRef.get();

    if (existingSnap.exists) {
      const data = existingSnap.data();
      return NextResponse.json(data?.items || []);
    }

    const apiKey = process.env.GEMINI_API_KEY || "";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: "You are EcoMind, a friendly and practical carbon footprint coach. You help individuals in India understand their environmental impact and take realistic, affordable actions to reduce it. You are encouraging, never preachy or guilt-tripping. You suggest specific, actionable steps relevant to Indian lifestyle and infrastructure. You keep responses concise and motivating."
    });

    const prompt = `Create exactly 5 personalized weekly eco-challenges for an Indian user whose top emission categories are: ${topCategories.join(
      ", "
    )} and lifestyle focus is: ${lifestyle}.
Return ONLY a valid JSON array, no markdown, no backticks.
Schema: [{"id": "string (unique string short ID)", "title": "string (max 8 words)", "description": "string (max 40 words)", "targetCO2Saving": number (kg CO2 per week), "category": "string (Transport|Food|Energy|Shopping)", "difficulty": "Easy"|"Medium"|"Hard"}]`;

    let parsedResult: ChallengeRaw[] | null = null;
    let attempts = 2;

    while (attempts > 0 && !parsedResult) {
      try {
        const result = await model.generateContent(prompt);
        let text = result.response.text() || "";
        
        // Strip markdown backticks if present
        text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        parsedResult = JSON.parse(text) as ChallengeRaw[];
      } catch (err) {
        console.error(`Gemini call/parse attempt failed for challenges. Attempts left: ${attempts - 1}`, err);
        attempts--;
        if (attempts === 0) throw err;
      }
    }

    // Map through array to ensure completed = false is set on all items
    const finalItems = (parsedResult || []).map((item) => ({
      ...item,
      completed: false,
    }));

    // Save to Firestore challenges collection
    await challengesRef.set({
      userId,
      weekStart,
      items: finalItems,
    });

    return NextResponse.json(finalItems);
  } catch (error) {
    console.error("Error generating challenges:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
