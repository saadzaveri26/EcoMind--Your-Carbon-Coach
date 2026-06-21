import { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getMondayOfCurrentWeek } from "@/lib/carbonData";

export interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  targetCO2Saving: number;
  completed: boolean;
  completedAt?: { seconds: number; nanoseconds: number } | null;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface WeeklyChallengesDoc {
  userId: string;
  weekStart: string;
  items: ChallengeItem[];
}


export function useChallenges(userId: string | undefined) {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const weekStart = getMondayOfCurrentWeek();

  useEffect(() => {
    if (!userId) {
      setTimeout(() => {
        setChallenges([]);
        setLoading(false);
      }, 0);
      return;
    }

    setTimeout(() => setLoading(true), 0);
    const docId = `${userId}_${weekStart}`;
    const docRef = doc(db, "challenges", docId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as WeeklyChallengesDoc;
          setChallenges(data.items || []);
        } else {
          setChallenges([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to challenges:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, weekStart]);

  const markComplete = async (challengeId: string) => {
    if (!userId) return;
    const docId = `${userId}_${weekStart}`;
    const docRef = doc(db, "challenges", docId);

    try {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;

      const data = docSnap.data() as WeeklyChallengesDoc;
      const updatedItems = data.items.map((item) => {
        if (item.id === challengeId) {
          return {
            ...item,
            completed: true,
            completedAt: new Date(),
          };
        }
        return item;
      });

      await updateDoc(docRef, { items: updatedItems });

      // Update user streak & badges in profile
      const userProfileRef = doc(db, "userProfile", userId);
      const userProfileSnap = await getDoc(userProfileRef);
      if (userProfileSnap.exists()) {
        const profileData = userProfileSnap.data();
        const currentStreak = profileData.streakDays || 0;
        const currentBadges = profileData.badgesEarned || [];

        const completedCountAfter = updatedItems.filter((c) => c.completed).length;
        const newBadges = [...currentBadges];

        // Award badge for completing first challenge
        if (completedCountAfter >= 1 && !newBadges.includes("first_challenge")) {
          newBadges.push("first_challenge");
        }
        // Award badge for completing all 5 challenges
        if (completedCountAfter >= 5 && !newBadges.includes("eco_champion")) {
          newBadges.push("eco_champion");
        }

        await updateDoc(userProfileRef, {
          streakDays: currentStreak + 1, // increment streak on complete
          badgesEarned: newBadges,
        });
      }
    } catch (e) {
      console.error("Error marking challenge complete:", e);
      throw e;
    }
  };

  const completedCount = challenges.filter((c) => c.completed).length;

  return {
    challenges,
    completedCount,
    loading,
    markComplete,
  };
}
