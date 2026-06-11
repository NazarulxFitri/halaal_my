import { readFileSync } from "node:fs";
import path from "node:path";

import type { Firestore } from "firebase-admin/firestore";

export const KEYWORDS_COLLECTION = "halal-scanner";
export const KEYWORDS_DOC = "keywords";

type ServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

type ServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function parseServiceAccountJson(
  parsed: ServiceAccountJson,
): ServiceAccount | null {
  if (parsed.project_id && parsed.client_email && parsed.private_key) {
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    };
  }
  return null;
}

function readServiceAccountFromFile(filePath: string): ServiceAccount | null {
  try {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    const parsed = JSON.parse(
      readFileSync(absolutePath, "utf-8"),
    ) as ServiceAccountJson;
    return parseServiceAccountJson(parsed);
  } catch {
    return null;
  }
}

function parseServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      return parseServiceAccountJson(JSON.parse(raw) as ServiceAccountJson);
    } catch {
      return null;
    }
  }

  const accountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (accountPath) {
    const fromFile = readServiceAccountFromFile(accountPath);
    if (fromFile) {
      return fromFile;
    }
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return { projectId, clientEmail, privateKey };
}

export function isFirebaseConfigured(): boolean {
  return parseServiceAccount() !== null;
}

export function getFirebaseConfigError(): string {
  const accountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (accountPath) {
    return `Could not read Firebase service account at "${accountPath}". Download it from Firebase Console → Project settings → Service accounts → Generate new private key, save as firebase-service-account.json, then restart the dev server.`;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return "FIREBASE_SERVICE_ACCOUNT is set but invalid. Check that the JSON is on one line and correctly formatted.";
  }

  return "Firebase is not configured. Add FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json to .env.local and place your service account JSON in the project root.";
}

let dbPromise: Promise<Firestore> | null = null;

export function getFirebaseDb(): Promise<Firestore> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const serviceAccount = parseServiceAccount();
      if (!serviceAccount) {
        throw new Error(getFirebaseConfigError());
      }

      const { cert, getApps, initializeApp } = await import("firebase-admin/app");
      const { getFirestore } = await import("firebase-admin/firestore");

      const app =
        getApps()[0] ??
        initializeApp({
          credential: cert(serviceAccount),
        });

      return getFirestore(app);
    })();
  }

  return dbPromise;
}
