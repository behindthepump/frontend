import React, { useState } from "react";
import { clientNameError, authErrorMessage } from "../auth";
import { clientMetricsError } from "../data";
import { submitOnboarding } from "../store";
import { auth } from "../firebase";
import { Dumbbell, ClipboardList, AlertCircle } from "lucide-react";

interface OnboardingProps {
  onDone: (name: string) => void; // parent flips the session to "pending"
  onLogout: () => void;
}

// First screen after a fresh Google signup: the client's own profile
// baseline. The backend computes BMR from it; the coach approves the
// request and sets the program start date + workout frequency.
export default function Onboarding({ onDone, onLogout }: OnboardingProps) {
  const [name, setName] = useState(auth.currentUser?.displayName ?? "");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("Male");
  const [height, setHeight] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [targetWeight, setTargetWeight] = useState<number | "">("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fields = {
      name: name.trim(),
      age: Number(age),
      gender,
      height: Number(height),
      starting_weight: Number(weight),
      target_weight: Number(targetWeight)
    };
    const validation = clientNameError(fields.name) ?? clientMetricsError(fields);
    if (validation) {
      setError(validation);
      return;
    }

    setBusy(true);
    try {
      await submitOnboarding(fields);
      onDone(fields.name);
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  const inputClass =
    "w-full bg-[#111111] border border-gray-800 focus:border-[#2ECC71] text-white font-bold px-4 py-3 rounded-xl transition outline-none text-sm";
  const labelClass = "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2";

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center font-sans p-4" id="onboarding-screen">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Dumbbell className="w-10 h-10 text-[#2ECC71] mx-auto" />
          <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
            Transformation • 12-Week Tracker
          </p>
          <h1 className="text-lg font-black uppercase tracking-wider text-white">Tell Us About Yourself</h1>
          <p className="text-xs text-gray-500">
            These numbers are your program baseline — Coach reviews them with your request.
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
            <label htmlFor="ob-name" className={labelClass}>Full Name</label>
            <input
              id="ob-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Richard Hendricks"
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ob-age" className={labelClass}>Age</label>
              <input
                id="ob-age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                min="1"
                max="120"
                className={`${inputClass} font-mono`}
                required
              />
            </div>
            <div>
              <label htmlFor="ob-gender" className={labelClass}>Gender</label>
              <select
                id="ob-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={inputClass}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ob-height" className={labelClass}>Height (cm)</label>
            <input
              id="ob-height"
              type="number"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : "")}
              placeholder="e.g. 170"
              min="50"
              max="250"
              className={`${inputClass} font-mono`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ob-weight" className={labelClass}>Current Weight (kg)</label>
              <input
                id="ob-weight"
                type="number"
                step="0.1"
                min="1"
                value={weight}
                onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : "")}
                className={`${inputClass} font-mono`}
                required
              />
            </div>
            <div>
              <label htmlFor="ob-target" className={labelClass}>Target Weight (kg)</label>
              <input
                id="ob-target"
                type="number"
                step="0.1"
                min="1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value ? Number(e.target.value) : "")}
                className={`${inputClass} font-mono`}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#2ECC71] hover:bg-[#27ae60] text-[#111111] font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ClipboardList className="w-4 h-4" />
            <span>{busy ? "Submitting…" : "Request to Join"}</span>
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
