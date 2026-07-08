import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase is used for authentication only - all data goes through the
// backend API. Web app config comes from .env.local (see .env.example).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey) {
  throw new Error(
    "Missing Firebase config. Copy frontend/.env.example to .env.local and fill in the web app config."
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
