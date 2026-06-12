import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (getApps().length === 0) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  // If credentials are fully available, initialize with service account certificate
  if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    // During build time or when environment variables are missing, initialize with project ID only.
    // This prevents OpenSSL certificate validation errors from crashing the static optimization phase.
    initializeApp({
      projectId: projectId || "ecomind-mock",
    });
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
