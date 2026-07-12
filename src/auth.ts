import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "./firebase";
import { apiGet, ApiError } from "./api/client";
import { UserStatus } from "./types";

// The signed-in session. Firebase Auth handles the login and issues the
// token; the backend builds the session (role from the custom claim, name +
// status from the user doc) at GET /v1/me.
export interface Session {
  role: "coach" | "client";
  userId: string;
  name: string;
  permissions: string[];
  // "new" = authed but no user doc yet (Google signup before onboarding)
  status: UserStatus | "new";
}

// UI gating only - the backend is the real gate. Mirrors the API's authz.
const COACH_PERMISSIONS = [
  "clients:read",
  "clients:approve",
  "clients:delete",
  "profile:write",
  "logs:write"
];
const CLIENT_PERMISSIONS = ["logs:write"];

function permissionsForRole(role: "coach" | "client"): string[] {
  return role === "coach" ? [...COACH_PERMISSIONS] : [...CLIENT_PERMISSIONS];
}

interface MeResponse {
  userId: string;
  role: "coach" | "client";
  name: string;
  status: UserStatus | "new";
}

// Ask the backend who we are (the token is attached by the API client).
async function fetchSession(): Promise<Session> {
  const me = await apiGet<MeResponse>("/v1/me");
  return {
    role: me.role,
    userId: me.userId,
    name: me.name,
    permissions: permissionsForRole(me.role),
    status: me.status
  };
}

// Called from the auth-state listener; the user arg is unused because the
// session is derived from the token server-side.
export async function sessionFromFirebaseUser(_user: FirebaseUser): Promise<Session> {
  return fetchSession();
}

// Coach sign-in. Clients use Google.
export async function login(email: string, password: string): Promise<Session> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
  return fetchSession();
}

// Client sign-in AND signup: a first-time Google account lands on the
// onboarding screen (session.status === "new").
export async function loginWithGoogle(): Promise<Session> {
  await signInWithPopup(auth, new GoogleAuthProvider());
  return fetchSession();
}

export function logout(): Promise<void> {
  return signOut(auth);
}

// Deliberately silent when the email has no account, so the reset flow
// doesn't reveal which emails are registered. Coach-only in practice.
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (err) {
    if (err instanceof FirebaseError && err.code === "auth/user-not-found") return;
    throw err;
  }
}

// Friendly message for auth + API failures. Returns "" for a cancelled
// Google popup - not an error worth showing.
export function authErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password.";
      case "auth/invalid-email":
        return "That is not a valid email address.";
      case "auth/too-many-requests":
        return "Too many attempts - try again in a few minutes.";
      case "auth/network-request-failed":
        return "Network error - check your internet connection and try again.";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return "";
      case "auth/popup-blocked":
        return "Your browser blocked the sign-in popup - allow popups and try again.";
      default:
        return `Something went wrong (${err.code}).`;
    }
  }
  // Backend errors carry a ready-to-show message.
  if (err instanceof ApiError) return err.message;
  return "Something went wrong.";
}

// Guards against blank names in the onboarding/rename forms.
export function clientNameError(name: string): string | null {
  if (!name.trim()) return "Name is required.";
  return null;
}
