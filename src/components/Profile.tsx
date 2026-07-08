import React, { useState } from "react";
import { User } from "../types";
import { User as UserIcon, Scale, Heart, Edit3 } from "lucide-react";

interface ProfileProps {
  user: User;
  canEdit: boolean; // baselines are coach-set; clients get a read-only view
  onUpdateUser: (updatedUser: User) => Promise<string | null>;
}

export default function Profile({ user, canEdit, onUpdateUser }: ProfileProps) {
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(user.age);
  const [gender, setGender] = useState(user.gender);
  const [startingWeight, setStartingWeight] = useState(user.starting_weight);
  const [targetWeight, setTargetWeight] = useState(user.target_weight);
  const [bmr, setBmr] = useState(user.bmr);
  
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = await onUpdateUser({
      ...user,
      name,
      age: Number(age),
      gender,
      starting_weight: Number(startingWeight),
      target_weight: Number(targetWeight),
      bmr: Number(bmr),
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
            The baseline numbers your coach uses to estimate your progress.
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-mono font-bold">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase font-sans tracking-wide">Client Name</p>
                <p className="text-gray-900 mt-1">{user.name}</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase font-sans tracking-wide">Sign-in Email</p>
                <p className="text-gray-900 mt-1 break-all">{user.email}</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase font-sans tracking-wide">Age</p>
                <p className="text-gray-900 mt-1">{user.age} Years</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 sm:col-span-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase font-sans tracking-wide">Gender</p>
                <p className="text-gray-900 mt-1">{user.gender}</p>
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
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase font-sans tracking-wide">Starting Weight</p>
                <p className="text-gray-900 mt-1">{user.starting_weight} kg</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase font-sans tracking-wide">Target Weight</p>
                <p className="text-gray-900 mt-1">{user.target_weight} kg</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 sm:col-span-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase font-sans tracking-wide">Program Start (Week 1)</p>
                <p className="text-gray-900 mt-1">{user.program_start_date}</p>
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
    </div>
  );
}
