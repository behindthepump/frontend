import React, { useState, useEffect } from "react";
import { User, DailyCalorie } from "../../types";
import { todayStr as getTodayStr } from "../../data";
import { Calendar, Save, Sparkles, AlertCircle } from "lucide-react";

interface CalorieLogFormProps {
  user: User;
  selectedDate: string;
  existing?: DailyCalorie;
  // Food-reference "+" clicks: each seq bump adds amount to the input.
  foodAdd?: { amount: number; seq: number } | null;
  onSave: (calories: number, notes: string) => Promise<string | null>;
}

// The client's "Log Your Day" form. Client-only — the coach never sees it.
export default function CalorieLogForm({ user, selectedDate, existing, foodAdd, onSave }: CalorieLogFormProps) {
  const todayStr = getTodayStr();
  const [caloriesInput, setCaloriesInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Load the selected day's existing entry (if any) into the form.
  useEffect(() => {
    setCaloriesInput(existing ? existing.calories.toString() : "");
    setNotesInput(existing?.notes || "");
    setSuccessMsg("");
    setErrorMsg("");
  }, [selectedDate, existing]);

  // Add a food-reference pick to the running count.
  useEffect(() => {
    if (!foodAdd) return;
    setCaloriesInput((prev) => String((Number(prev) || 0) + foodAdd.amount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodAdd?.seq]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caloriesInput || isNaN(Number(caloriesInput))) return;
    if (selectedDate > todayStr) return;

    setSaving(true);
    const error = await onSave(Number(caloriesInput), notesInput);
    setSaving(false);

    if (error) {
      setErrorMsg(error);
      setSuccessMsg("");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("Logged — nice work. Every day counts!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs lg:col-span-3" id="calorie-form-holder">
      <h3 className="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3">Log Your Day</h3>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Logging For</label>
          <div className="bg-gray-50 text-gray-800 px-4 py-3 rounded-xl border border-gray-100 font-mono text-sm font-bold flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#2ECC71]" />
            <span>{selectedDate === todayStr ? `Today (${selectedDate})` : selectedDate}</span>
          </div>
        </div>

        <div>
          <label htmlFor="calories" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Calories Consumed (kcal)
          </label>
          <div className="relative">
            <input
              id="calories"
              type="number"
              placeholder="e.g. 1800"
              value={caloriesInput}
              onChange={(e) => setCaloriesInput(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 font-bold font-mono py-3 pl-4 pr-12 rounded-xl transition outline-none"
              min="0"
              max="10000"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">
              kcal
            </span>
          </div>
          {caloriesInput && !isNaN(Number(caloriesInput)) && (
            <p className="text-[11px] text-gray-400 font-medium mt-1.5">
              {user.bmr - Number(caloriesInput) >= 0 ? (
                <>
                  Nice —{" "}
                  <span className="font-bold font-mono text-[#2ECC71]">
                    {(user.bmr - Number(caloriesInput)).toLocaleString()} kcal
                  </span>{" "}
                  under your daily target of {user.bmr}.
                </>
              ) : (
                <>
                  <span className="font-bold font-mono text-orange-500">
                    {(Number(caloriesInput) - user.bmr).toLocaleString()} kcal
                  </span>{" "}
                  over your daily target of {user.bmr} — a workout can help balance it out.
                </>
              )}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="notes" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Notes / Meal Info (Optional)
          </label>
          <textarea
            id="notes"
            placeholder="e.g. Lunch out, high protein meal"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 font-medium py-3 px-4 rounded-xl transition outline-none resize-none h-20 text-sm"
          />
        </div>

        {successMsg && (
          <div className="flex items-center space-x-2 text-xs text-[#2ECC71] font-bold bg-[#2ECC71]/10 px-4 py-3 rounded-xl border border-[#2ECC71]/20">
            <Sparkles className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center space-x-2 text-xs text-red-600 font-bold bg-red-50 px-4 py-3 rounded-xl border border-red-100">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#111111] hover:bg-[#2ECC71] hover:text-[#111111] text-white font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving…" : existing ? "Update Entry" : "Save Entry"}</span>
        </button>
      </form>
    </div>
  );
}
