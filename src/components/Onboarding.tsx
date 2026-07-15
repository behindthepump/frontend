import React, { useEffect, useState } from "react";
import { clientNameError, authErrorMessage } from "../auth";
import { clientMetricsError, PROGRAM_WEEKS } from "../data";
import { submitOnboarding } from "../store";
import { auth } from "../firebase";
import Expand from "./Expand";
import { ClipboardList, AlertCircle, Flame, TrendingDown, ChevronRight, ChevronDown } from "lucide-react";

interface OnboardingProps {
  onDone: (name: string) => void; // parent flips the session to "pending"
  onLogout: () => void;
}

interface Draft {
  name: string;
  age: number | "";
  gender: string;
  height: number | "";
  weight: number | "";
  targetWeight: number | "";
}

// A refresh lands back on this screen (status stays "new" until submit), so
// the half-filled form survives in localStorage, keyed by uid.
const draftKey = () => `onboarding-draft-${auth.currentUser?.uid ?? "anon"}`;

function readDraft(): Draft | null {
  try {
    return JSON.parse(localStorage.getItem(draftKey()) ?? "null");
  } catch {
    return null;
  }
}

// First screen after a fresh Google signup: the client's own profile
// baseline. The backend computes BMR from it; the coach approves the
// request and sets the program start date + workout frequency. The live
// insight panel mirrors those numbers back as they type.
export default function Onboarding({ onDone, onLogout }: OnboardingProps) {
  const [draft] = useState(readDraft);
  const [name, setName] = useState(draft?.name || (auth.currentUser?.displayName ?? ""));
  const [age, setAge] = useState<number | "">(draft?.age ?? "");
  const [gender, setGender] = useState(draft?.gender ?? "Male");
  const [height, setHeight] = useState<number | "">(draft?.height ?? "");
  const [weight, setWeight] = useState<number | "">(draft?.weight ?? "");
  const [targetWeight, setTargetWeight] = useState<number | "">(draft?.targetWeight ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      draftKey(),
      JSON.stringify({ name, age, gender, height, weight, targetWeight } satisfies Draft)
    );
  }, [name, age, gender, height, weight, targetWeight]);

  // Live preview of the numbers the program runs on. Display-only mirror of
  // the backend's Mifflin-St Jeor computeBmr - the API stays authoritative.
  const bmr =
    age && height && weight
      ? Math.round(
          10 * Number(weight) +
            6.25 * Number(height) -
            5 * Number(age) +
            (gender === "Male" ? 5 : gender === "Female" ? -161 : -78)
        )
      : null;
  const toLose =
    weight && targetWeight && Number(weight) > Number(targetWeight)
      ? parseFloat((Number(weight) - Number(targetWeight)).toFixed(1))
      : null;
  const weeklyPace = toLose ? parseFloat((toLose / PROGRAM_WEEKS).toFixed(1)) : null;
  const aggressive = weeklyPace !== null && weeklyPace > 1;

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
      localStorage.removeItem(draftKey());
      onDone(fields.name);
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  const inputClass =
    "w-full bg-[#111111] border border-gray-800 focus:border-[#FEC63F] text-white font-bold px-4 py-3 rounded-xl transition outline-none text-sm";
  const labelClass = "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2";

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center font-sans p-4" id="onboarding-screen">
      <div className="w-full max-w-sm space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <img src="/brand-logo.png" alt="Behind the Pump" className="h-14 w-auto mx-auto" />
          <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
            Transformation • 12-Week Tracker
          </p>
          <h1 className="text-lg font-black uppercase tracking-wider text-white">Tell Us About Yourself</h1>

          {/* Where am I in the journey? */}
          <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-wider pt-1">
            <span className="text-[#FEC63F]">1 · Your details</span>
            <ChevronRight className="w-3 h-3 text-gray-700" />
            <span className="text-gray-600">2 · Coach review</span>
            <ChevronRight className="w-3 h-3 text-gray-700" />
            <span className="text-gray-600">3 · 12 weeks</span>
          </div>
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
              {/* appearance-none drops the OS select chrome; pl-3.5 (14px)
                  compensates the ~2px intrinsic inset browsers give select
                  text so it lines up with the inputs' px-4 */}
              <div className="relative">
                <select
                  id="ob-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={`${inputClass} appearance-none pl-3.5 pr-10 cursor-pointer`}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
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

          {/* Your numbers, reflected back as you type. The -mt-4/pt-4 pair
              cancels the form's space-y-4 while collapsed (Expand's gap
              prop only compensates space-y-3). */}
          <div className="-mt-4">
            <Expand open={Boolean(bmr || weeklyPace)}>
              <div className="pt-4">
                <div className="bg-[#111111] border border-gray-800 rounded-xl p-4 space-y-2.5 text-xs">
              {bmr && (
                <p className="flex items-center gap-2 text-gray-400">
                  <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span>
                    Your body burns{" "}
                    <span className="font-mono font-bold text-white">≈ {bmr.toLocaleString()} kcal/day</span> at rest
                  </span>
                </p>
              )}
              {weeklyPace !== null && (
                <p className="flex items-center gap-2 text-gray-400">
                  <TrendingDown className="w-3.5 h-3.5 text-[#FEC63F] shrink-0" />
                  <span>
                    −{toLose} kg in {PROGRAM_WEEKS} weeks ≈{" "}
                    <span className={`font-mono font-bold ${aggressive ? "text-orange-300" : "text-white"}`}>
                      {weeklyPace} kg/week
                    </span>
                    {aggressive && " — ambitious; your coach may adjust it"}
                  </span>
                </p>
              )}
                </div>
              </div>
            </Expand>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#FEC63F] hover:bg-[#F0B41E] text-[#111111] font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider transition hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ClipboardList className="w-4 h-4" />
            <span>{busy ? "Submitting…" : "Request to Join"}</span>
          </button>

          <p className="text-center text-[11px] text-gray-500">
            Signed in as <span className="font-bold text-gray-400">{auth.currentUser?.email}</span>
            {" · "}
            <button
              type="button"
              onClick={onLogout}
              className="font-bold text-gray-500 hover:text-white underline transition cursor-pointer"
            >
              Sign out
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
