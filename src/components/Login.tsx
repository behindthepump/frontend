import React, { useState } from "react";
import { login, loginWithGoogle, requestPasswordReset, authErrorMessage, Session } from "../auth";
import Expand from "./Expand";
import { LogIn, AlertCircle, MailCheck, ChevronDown } from "lucide-react";

interface LoginProps {
  onLogin: (session: Session) => void;
  notice?: string; // e.g. why the app just signed the user out
}

export default function Login({ onLogin, notice: initialNotice }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialNotice ?? "");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  // Clients (everyone but one person) sign in with Google - the coach's
  // email/password form stays collapsed until asked for.
  const [coachOpen, setCoachOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      onLogin(await login(email, password));
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      onLogin(await loginWithGoogle());
    } catch (err) {
      setError(authErrorMessage(err)); // "" when the user closed the popup
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email above first, then press Forgot password.");
      return;
    }
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setNotice("If that email has an account, a reset link has been sent.");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center font-sans p-4" id="login-screen">
      <div className="w-full max-w-sm space-y-6 animate-fadeIn">
        {/* Brand */}
        <div className="text-center space-y-2">
          <img src="/brand-logo.png" alt="Behind the Pump" className="h-14 w-auto mx-auto" />
          <h1 className="text-lg font-black uppercase tracking-wider text-white">Transformation</h1>
          <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">12-Week Tracker</p>
        </div>

        {/* Login card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 space-y-4"
        >
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Sign In</h2>

          {/* Clients sign in (and sign up) with Google */}
          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={busy}
            className="w-full bg-white hover:bg-gray-100 text-[#111111] font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.44 1.14-4.07 1.14-3.13 0-5.78-2.11-6.72-4.95H1.29v3.1A12 12 0 0 0 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.99-3.1z" />
              <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.99 3.1C6.22 6.88 8.87 4.77 12 4.77z" />
            </svg>
            <span>Continue with Google</span>
          </button>
          <p className="text-[10px] text-gray-500 text-center font-medium">
            New here? Google sign-in also creates your account.
          </p>

          {error && (
            <div className="flex items-center space-x-2 text-xs text-red-400 font-bold bg-red-950/40 px-4 py-3 rounded-xl border border-red-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div className="flex items-center space-x-2 text-xs text-[#FEC63F] font-bold bg-[#FEC63F]/10 px-4 py-3 rounded-xl border border-[#FEC63F]/20">
              <MailCheck className="w-4 h-4 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* One person uses this - collapsed until asked for */}
          <button
            type="button"
            onClick={() => setCoachOpen((o) => !o)}
            className="w-full flex items-center space-x-3 cursor-pointer group"
          >
            <div className="flex-1 h-px bg-gray-800" />
            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-600 group-hover:text-gray-400 uppercase tracking-widest transition">
              Coach sign-in
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${coachOpen ? "rotate-180" : ""}`}
              />
            </span>
            <div className="flex-1 h-px bg-gray-800" />
          </button>

          {/* -mt-4/pt-4 cancels the form's space-y-4 while collapsed */}
          <div className="-mt-4">
          <Expand open={coachOpen}>
          <div className="pt-4 space-y-4">
          <div>
            <label htmlFor="email" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full bg-[#111111] border border-gray-800 focus:border-[#FEC63F] text-white font-bold px-4 py-3 rounded-xl transition outline-none text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full bg-[#111111] border border-gray-800 focus:border-[#FEC63F] text-white font-bold px-4 py-3 rounded-xl transition outline-none text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#FEC63F] hover:bg-[#F0B41E] text-[#111111] font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-4 h-4" />
            <span>{busy ? "Signing in…" : "Sign In"}</span>
          </button>

          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={busy}
            className="w-full text-[11px] text-gray-500 hover:text-[#FEC63F] font-bold transition cursor-pointer disabled:opacity-50"
          >
            Forgot password?
          </button>
          </div>
          </Expand>
          </div>
        </form>
      </div>
    </div>
  );
}
