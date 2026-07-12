import React, { useState } from "react";
import { User } from "../types";
import RingAvatar from "./coach/RingAvatar";
import { User as UserIcon, Scale, Heart, Edit3, Trash2 } from "lucide-react";

interface ProfileProps {
  user: User;
  canEdit: boolean; // baselines are coach-set; clients get a read-only view
  // Goal progress 0..1 for the identity ring (callers derive it from stats)
  goalProgress?: number;
  onUpdateUser?: (updatedUser: User) => Promise<string | null>; // required when canEdit
  // Coach drill-in only: renders the delete danger zone when provided
  onDelete?: () => Promise<string | null>;
}

export default function Profile({ user, canEdit, goalProgress = 0, onUpdateUser, onDelete }: ProfileProps) {
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(user.age);
  const [gender, setGender] = useState(user.gender);
  const [height, setHeight] = useState(user.height);
  const [startingWeight, setStartingWeight] = useState(user.starting_weight);
  const [targetWeight, setTargetWeight] = useState(user.target_weight);
  const [bmr, setBmr] = useState(user.bmr);
  const [workoutFrequency, setWorkoutFrequency] = useState<2 | 3>(user.workout_frequency);
  
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateUser) return;
    const error = await onUpdateUser({
      ...user,
      name,
      age: Number(age),
      gender,
      height: Number(height),
      starting_weight: Number(startingWeight),
      target_weight: Number(targetWeight),
      bmr: Number(bmr),
      workout_frequency: workoutFrequency,
    });

    if (error) {
      setErrorMsg(error);
      setMessage("");
      return;
    }

    setErrorMsg("");
    setName(name.trim());
    setIsEditing(false);
    setMessage("Profile metrics updated successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="profile-screen">
      {/* Header */}
      <div className="flex justify-between items-center" id="profile-heading-bar">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Personal & Fitness Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            {/* Only the coach can edit, so canEdit doubles as the voice switch */}
            {canEdit
              ? `The baseline numbers behind ${user.name}'s plan.`
              : "The baseline numbers your coach uses to estimate your progress."}
          </p>
        </div>
        
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-[#111111] hover:bg-[#2ECC71] hover:text-[#111111] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer shadow-2xs"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Metrics</span>
          </button>
        )}
        {!canEdit && (
          <span className="text-xs text-gray-400 font-medium">
            Managed by your coach
          </span>
        )}
      </div>

      {message && (
        <div className="p-4 bg-[#2ECC71]/15 text-[#2ECC71] border border-[#2ECC71]/20 font-bold rounded-xl text-xs">
          {message}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 font-bold rounded-xl text-xs">
          {errorMsg}
        </div>
      )}

      {canEdit && isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6" id="profile-edit-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">
                Basic Information
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 font-bold px-4 py-2.5 rounded-xl transition outline-none text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 font-bold px-4 py-2.5 rounded-xl transition outline-none text-sm font-mono"
                    min="1"
                    max="120"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 font-bold px-4 py-2.5 rounded-xl transition outline-none text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="50"
                  max="250"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 font-bold px-4 py-2.5 rounded-xl transition outline-none text-sm font-mono"
                  required
                />
              </div>
            </div>

            {/* Fitness Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">
                Fitness Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">Starting Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={startingWeight}
                    onChange={(e) => setStartingWeight(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 font-bold px-4 py-2.5 rounded-xl transition outline-none text-sm font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 font-mono">Target Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 font-bold px-4 py-2.5 rounded-xl transition outline-none text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">Basal Metabolic Rate (BMR kcal/day)</label>
                <input
                  type="number"
                  min="1"
                  value={bmr}
                  onChange={(e) => setBmr(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 font-bold px-4 py-2.5 rounded-xl transition outline-none text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">Workouts Per Week</label>
                <div className="flex rounded-xl border border-gray-100 overflow-hidden text-sm font-bold">
                  {([2, 3] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setWorkoutFrequency(freq)}
                      className={`flex-1 py-2.5 uppercase tracking-wider transition cursor-pointer ${
                        workoutFrequency === freq
                          ? "bg-[#111111] text-[#2ECC71]"
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {freq}-day
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                  Past weeks keep what was logged; the new split applies from now on.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 pt-4 border-t border-gray-100 justify-end">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setErrorMsg("");
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-5 py-2.5 rounded-xl tracking-wider uppercase transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#2ECC71] hover:bg-[#27ae60] text-[#111111] font-bold text-xs px-5 py-2.5 rounded-xl tracking-wider uppercase transition cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="profile-details-display">
          {/* Basic Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
            <div className="flex items-center space-x-3 border-b border-gray-50 pb-3">
              <UserIcon className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-extrabold text-[#111111]">Basic Information</h3>
            </div>

            {/* Identity header - the ring glyph the rest of the app uses,
                filled to goal progress */}
            <div className="flex items-center gap-3">
              <RingAvatar name={user.name} pct={goalProgress} />
              <div className="min-w-0">
                <p className="text-base font-extrabold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 font-mono font-bold truncate mt-0.5">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm font-mono font-bold">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase font-sans tracking-wide">Age</p>
                <p className="text-gray-900 mt-1">{user.age} Years</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase font-sans tracking-wide">Gender</p>
                <p className="text-gray-900 mt-1">{user.gender}</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase font-sans tracking-wide">Height</p>
                <p className="text-gray-900 mt-1">{user.height} cm</p>
              </div>
            </div>
          </div>

          {/* Fitness baseline card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
            <div className="flex items-center space-x-3 border-b border-gray-50 pb-3">
              <Scale className="w-5 h-5 text-[#2ECC71]" />
              <h3 className="text-base font-extrabold text-[#111111]">Program Baseline</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-mono font-bold">
              {/* The goal as one journey, not two disconnected tiles */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 sm:col-span-2 flex justify-between items-center gap-2">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase font-sans tracking-wide">Goal</p>
                  <p className="text-gray-900 mt-1 text-lg font-black">
                    {user.starting_weight}
                    <span className="text-gray-300 mx-1.5">→</span>
                    {user.target_weight}
                    <span className="text-xs font-bold text-gray-400 ml-1">kg</span>
                  </p>
                </div>
                <span className="text-[10px] font-bold font-mono bg-[#2ECC71]/10 text-emerald-700 px-2 py-1 rounded-md shrink-0">
                  −{parseFloat((user.starting_weight - user.target_weight).toFixed(1))} kg
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase font-sans tracking-wide">Program Start (Week 1)</p>
                <p className="text-gray-900 mt-1">{user.program_start_date}</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase font-sans tracking-wide">Workouts Per Week</p>
                <p className="text-gray-900 mt-1">{user.workout_frequency}-day split</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 sm:col-span-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase font-sans tracking-wide">
                  BMI — starting → target
                </p>
                <p className="text-gray-900 mt-1">
                  {parseFloat((user.starting_weight / ((user.height / 100) ** 2)).toFixed(1))}
                  <span className="text-gray-300 mx-1">→</span>
                  {parseFloat((user.target_weight / ((user.height / 100) ** 2)).toFixed(1))}
                </p>
              </div>

              <div className="bg-[#2ECC71]/10 p-3 rounded-xl border border-[#2ECC71]/10 sm:col-span-2 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase font-sans tracking-wide flex items-center space-x-1">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                    <span>Basal Metabolic Rate</span>
                  </p>
                  <p className="text-gray-900 mt-1 text-lg font-black">{user.bmr} kcal/day</p>
                </div>
                <span className="text-[10.5px] font-sans text-gray-400 font-semibold max-w-[150px] leading-tight text-right">
                  Calories your body burns at rest
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Danger zone - the deliberate two-step home for deletion, away from
          the roster's scan surface */}
      {onDelete && !isEditing && (
        <div className="bg-white p-5 rounded-2xl border border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-gray-900">Delete this client</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Removes {user.name}'s account and every log. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Delete ${user.name}? All their data will be permanently deleted. This cannot be undone.`)) {
                void onDelete().then((err) => setErrorMsg(err ?? ""));
              }
            }}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.97] flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Client</span>
          </button>
        </div>
      )}
    </div>
  );
}
