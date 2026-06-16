import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (getApps().length === 0) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  // 2. Add a null check — if any admin credential is missing, log a clear error message instead of silently failing
  if (!projectId || !clientEmail || !privateKey) {
    const missingVars = [];
    if (!projectId) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    if (!clientEmail) missingVars.push("FIREBASE_CLIENT_EMAIL");
    if (!privateKey) missingVars.push("FIREBASE_PRIVATE_KEY");
    console.error(`[Firebase Admin] Missing required credentials: ${missingVars.join(", ")}`);
  }

  // 3. Wrap initializeApp in a try/catch and log the error
  try {
    // If credentials are fully available, initialize with service account certificate
    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("[Firebase Admin] Initialized successfully with service account credentials.");
    } else {
      // During build time or when environment variables are missing, initialize with project ID only.
      // This prevents OpenSSL certificate validation errors from crashing the static optimization phase.
      initializeApp({
        projectId: projectId || "ecomind-mock",
      });
      console.log("[Firebase Admin] Initialized with fallback projectId.");
    }
  } catch (error) {
    console.error("[Firebase Admin] Failed to initialize Firebase Admin SDK:", error);
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
