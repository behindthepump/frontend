import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "./firebase";
import { apiGet, apiPost, ApiError } from "./api/client";

// The signed-in session. Firebase Auth handles the login and issues the
// token; the backend builds the session (role from the custom claim, name +
// forced-change flag from the user doc) at GET /v1/me.
export interface Session {
  role: "coach" | "client";
  userId: string;
  name: string;
  permissions: string[];
  mustChangePassword: boolean;
}

// UI gating only - the backend is the real gate. Mirrors the API's authz.
const COACH_PERMISSIONS = [
  "clients:read",
  "clients:create",
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
  mustChangePassword: boolean;
}

// Ask the backend who we are (the token is attached by the API client).
async function fetchSession(): Promise<Session> {
  const me = await apiGet<MeResponse>("/v1/me");
  return {
    role: me.role,
    userId: me.userId,
    name: me.name,
    permissions: permissionsForRole(me.role),
    mustChangePassword: me.mustChangePassword
  };
}

// Called from the auth-state listener; the user arg is unused because the
// session is derived from the token server-side.
export async function sessionFromFirebaseUser(_user: FirebaseUser): Promise<Session> {
  return fetchSession();
}

export async function login(email: string, password: string): Promise<Session> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
  return fetchSession();
}

export function logout(): Promise<void> {
  return signOut(auth);
}

// Deliberately silent when the email has no account, so the reset flow
// doesn't reveal which emails are registered.
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (err) {
    if (err instanceof FirebaseError && err.code === "auth/user-not-found") return;
    throw err;
  }
}

// Set the new password and clear the forced-change flag (backend does both
// with the Admin SDK - no re-auth needed).
export async function completePasswordChange(newPassword: string): Promise<void> {
  await apiPost("/v1/me/password", { newPassword });
}

// Friendly message for auth + API failures.
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
      case "auth/weak-password":
        return "Password is too weak - use at least 8 characters.";
      case "auth/network-request-failed":
        return "Network error - check your internet connection and try again.";
      default:
        return `Something went wrong (${err.code}).`;
    }
  }
  // Backend errors carry a ready-to-show message.
  if (err instanceof ApiError) return err.message;
  return "Something went wrong.";
}

// Guards against blank names in the create/rename forms.
export function clientNameError(name: string): string | null {
  if (!name.trim()) return "Name is required.";
  return null;
}
