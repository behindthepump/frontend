import axios, { AxiosError } from "axios";
import { auth } from "../firebase";

// Thrown for any non-2xx API response; carries the backend's message.
export class ApiError extends Error {
  status: number;
  detail?: unknown;
  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4100"
});

// Attach the Firebase ID token to every request. getIdToken() serves a
// cached token and refreshes it transparently near expiry.
api.interceptors.request.use(async (config) => {
  const token = await auth.currentUser?.getIdToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise error responses into ApiError with the backend message.
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string; detail?: unknown }>) => {
    const status = error.response?.status ?? 0;
    const message =
      error.response?.data?.message ||
      (status === 0 ? "Network error - check your connection and try again." : "Request failed.");
    return Promise.reject(new ApiError(message, status, error.response?.data?.detail));
  }
);

// Helpers that unwrap the `{ success, data }` envelope down to `data`.
export async function apiGet<T>(path: string): Promise<T> {
  return (await api.get(path)).data.data as T;
}
export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return (await api.post(path, body)).data.data as T;
}
export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return (await api.put(path, body)).data.data as T;
}
export async function apiDelete<T>(path: string): Promise<T> {
  return (await api.delete(path)).data.data as T;
}

export default api;
