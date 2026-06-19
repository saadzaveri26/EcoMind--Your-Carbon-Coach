import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (getApps().length === 0) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  console.log("[Firebase Admin Init] Credentials present:", {
    projectId: !!projectId,
    clientEmail: !!clientEmail,
    privateKey: !!privateKey,
  });

  if (!projectId || !clientEmail || !privateKey) {
    const missingVars = [];
    if (!projectId) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    if (!clientEmail) missingVars.push("FIREBASE_CLIENT_EMAIL");
    if (!privateKey) missingVars.push("FIREBASE_PRIVATE_KEY");
    console.error(`[Firebase Admin] Missing required credentials: ${missingVars.join(", ")}`);
  }

  try {
    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      initializeApp({
        projectId: projectId || "ecomind-mock",
      });
    }
  } catch (error) {
    console.error("[Firebase Admin] Failed to initialize Firebase Admin SDK:", error);
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
