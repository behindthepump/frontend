import React, { useState } from "react";
import { completePasswordChange, authErrorMessage } from "../auth";
import { KeyRound, AlertCircle, ShieldCheck } from "lucide-react";

interface ChangePasswordProps {
  onDone: () => void;
  onLogout: () => void;
}

// Mandatory screen after signing in with a coach-issued temporary
// password. The app is unreachable until a new password is set.
export default function ChangePassword({ onDone, onLogout }: ChangePasswordProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await completePasswordChange(password);
      onDone();
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center font-sans p-4" id="change-password-screen">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <ShieldCheck className="w-10 h-10 text-[#2ECC71] mx-auto" />
          <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
            Transformation • 12-Week Tracker
          </p>
          <h1 className="text-lg font-black uppercase tracking-wider text-white">Set Your Password</h1>
          <p className="text-xs text-gray-500">
            Welcome! You signed in with a temporary password — make this account yours by choosing your own.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 space-y-4"
        >
          {error && (
            <div className="flex items-center space-x-2 text-xs text-red-400 font-bold bg-red-950/40 px-4 py-3 rounded-xl border border-red-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="new-password" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              className="w-full bg-[#111111] border border-gray-800 focus:border-[#2ECC71] text-white font-bold px-4 py-3 rounded-xl transition outline-none text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              className="w-full bg-[#111111] border border-gray-800 focus:border-[#2ECC71] text-white font-bold px-4 py-3 rounded-xl transition outline-none text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#2ECC71] hover:bg-[#27ae60] text-[#111111] font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <KeyRound className="w-4 h-4" />
            <span>{busy ? "Saving…" : "Set Password & Continue"}</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full text-[11px] text-gray-500 hover:text-white font-bold transition cursor-pointer"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
