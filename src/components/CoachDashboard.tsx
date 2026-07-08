import React, { useState, useRef, useEffect } from "react";
import { User, DailyCalorie, WorkoutLog } from "../types";
import { calculateUserStats, mondayOf, todayStr, formatShortDate } from "../data";
import { requestPasswordReset } from "../auth";
import {
  Users,
  UserPlus,
  ArrowRight,
  Sparkles,
  Trash2,
  KeyRound,
  Copy,
  Check,
  MailCheck
} from "lucide-react";

interface CoachDashboardProps {
  users: User[];
  allCalories: DailyCalorie[];
  allWorkouts: WorkoutLog[];
  // Owned by CoachView so navigation doesn't destroy the one-time pair
  newCredentials: { email: string; tempPassword: string } | null;
  onCredentialsChange: (creds: { email: string; tempPassword: string } | null) => void;
  onSelectClient: (clientId: string) => void;
  onCreateClient: (
    newClient: Omit<User, "id">
  ) => Promise<{ email: string; tempPassword: string } | string>;
  onDeleteClient: (clientId: string) => Promise<string | null>;
}

export default function CoachDashboard({
  users,
  allCalories,
  allWorkouts,
  newCredentials,
  onCredentialsChange,
  onSelectClient,
  onCreateClient,
  onDeleteClient,
}: CoachDashboardProps) {
  // Creating User Form inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("Male");
  const [startingWeight, setStartingWeight] = useState<number | "">("");
  const [targetWeight, setTargetWeight] = useState<number | "">("");
  const [bmr, setBmr] = useState<number | "">("");
  // Default program start: Monday of the current week
  const [startDate, setStartDate] = useState(mondayOf(todayStr()));

  const [formErr, setFormErr] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // Per-client action feedback (reset email, delete failures)
  const [resetNotice, setResetNotice] = useState("");
  const [rosterError, setRosterError] = useState("");

  // One shared timeout so rapid notices don't wipe each other early
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const credentialsRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  const showNotice = (message: string) => {
    setRosterError(""); // a fresh action clears any stale error
    setResetNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setResetNotice(""), 5000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !age || !startingWeight || !targetWeight || !bmr || !startDate) {
      setFormErr("Please fill in all fields.");
      return;
    }

    setCreating(true);
    const result = await onCreateClient({
      name,
      email,
      age: Number(age),
      gender,
      starting_weight: Number(startingWeight),
      target_weight: Number(targetWeight),
      bmr: Number(bmr),
      program_start_date: startDate,
    });
    setCreating(false);

    if (typeof result === "string") {
      setFormErr(result);
      return;
    }

    // Reset form; show the credentials pair (once - it is not stored)
    setName("");
    setEmail("");
    setAge("");
    setStartingWeight("");
    setTargetWeight("");
    setBmr("");
    setStartDate(mondayOf(todayStr()));
    setFormErr("");
    setCopied(false);
    setCopyError(false);
    onCredentialsChange(result);
    // On mobile the panel appears above the just-pressed submit button,
    // off-screen; bring the one-time credentials into view.
    requestAnimationFrame(() =>
      credentialsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
  };

  const handleCopyPair = async () => {
    if (!newCredentials) return;
    try {
      await navigator.clipboard.writeText(
        `Email: ${newCredentials.email}\nPassword: ${newCredentials.tempPassword}`
      );
      setCopyError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API is unavailable in non-HTTPS contexts
      setCopyError(true);
    }
  };

  const handleResetPassword = async (client: User) => {
    // Confirm first: this sends a real email to the client.
    if (!window.confirm(`Send a password reset email to ${client.name} (${client.email})?`)) {
      return;
    }
    try {
      await requestPasswordReset(client.email);
      // Neutral phrasing: requestPasswordReset succeeds quietly even if
      // the Auth account was removed outside the app.
      showNotice(`Password reset email sent to ${client.email}.`);
    } catch {
      showNotice(`Could not send the reset email for ${client.name} - try again.`);
    }
  };

  // Clients who are mid-program but haven't logged since this Monday -
  // the coach's most actionable signal.
  const weekStart = mondayOf(todayStr());
  const needAttention = users.filter((c) => {
    const stats = calculateUserStats(c, allCalories, allWorkouts);
    if (stats.programStatus !== "active") return false;
    return !stats.lastLoggedDate || stats.lastLoggedDate < weekStart;
  }).length;

  return (
    <div className="space-y-6 animate-fadeIn" id="coach-dashboard-screen">
      {/* Header Banner */}
      <div className="bg-[#111111] p-6 rounded-2xl text-white border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Coach Dashboard</h1>
          <p className="text-xs text-gray-400 mt-1">
            Add clients, check their progress, and open any client's tracker.
          </p>
        </div>

        {users.length > 0 && (
          <div
            className={`border p-3 rounded-xl font-mono text-center flex flex-col justify-center shrink-0 ${
              needAttention > 0
                ? "bg-orange-500/10 border-orange-500/40"
                : "bg-gray-800/50 border-gray-700"
            }`}
          >
            <span className="text-[10px] text-gray-400 font-sans font-bold uppercase">
              Not Logged This Week
            </span>
            <span
              className={`text-2xl font-black mt-0.5 ${
                needAttention > 0 ? "text-orange-400" : "text-[#2ECC71]"
              }`}
            >
              {needAttention}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="coach-main-grid">
        {/* Client List Grid */}
        <div className="lg:col-span-2 space-y-4" id="coach-clients-col">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#2ECC71]" />
            <span>Your Clients{users.length > 0 ? ` (${users.length})` : ""}</span>
          </h2>

          {resetNotice && (
            <p className="p-3 bg-[#2ECC71]/15 text-[#2ECC71] rounded-xl text-xs font-bold border border-[#2ECC71]/20 flex items-center space-x-2">
              <MailCheck className="w-4 h-4 shrink-0" />
              <span>{resetNotice}</span>
            </p>
          )}

          {rosterError && (
            <p className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
              {rosterError}
            </p>
          )}

          {users.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center space-y-2">
              <Users className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-600">No clients yet</p>
              <p className="text-xs text-gray-400">
                Add your first client with the form to kick off their 12-week program.
              </p>
            </div>
          )}

          <div className="space-y-3" id="coach-clients-list">
            {users.map((client) => {
              const stats = calculateUserStats(client, allCalories, allWorkouts);

              return (
                <div
                  key={client.id}
                  className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-[#2ECC71]/30 transition duration-200 shadow-3xs hover:shadow-2xs space-y-4 relative"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="text-lg font-extrabold text-gray-900 truncate">{client.name}</h3>
                      <p className="text-xs text-gray-400 font-medium truncate">
                        {client.email} • {client.gender} • {client.age} yrs • BMR: {client.bmr} kcal •{" "}
                        {stats.programStatus === "not_started"
                          ? `Starts ${client.program_start_date}`
                          : stats.programStatus === "completed"
                          ? "Completed"
                          : `Week ${stats.currentWeekNum} of 12`}
                      </p>
                      {stats.programStatus !== "not_started" && (
                        <p
                          className={`text-xs font-bold mt-0.5 ${
                            stats.lastLoggedDate ? "text-gray-500" : "text-orange-500"
                          }`}
                        >
                          {stats.lastLoggedDate
                            ? `Last logged: ${formatShortDate(stats.lastLoggedDate)}`
                            : "Never logged"}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onSelectClient(client.id)}
                        className="bg-gray-100 hover:bg-[#111111] hover:text-[#2ECC71] text-gray-800 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Open Tracker</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => void handleResetPassword(client)}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 p-2 rounded-lg transition cursor-pointer"
                        title="Send password reset email"
                        aria-label="Send password reset email"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${client.name}? All their data will be permanently deleted, and ${client.email} cannot be used for a new client. This cannot be undone.`)) {
                            void onDeleteClient(client.id).then((err) => {
                              setResetNotice("");
                              setRosterError(err ?? "");
                            });
                          }
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition cursor-pointer"
                        title="Delete client and all their data"
                        aria-label="Delete client and all their data"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Micro stats strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-gray-50 pt-3 text-xs font-mono font-bold">
                    <div className="bg-gray-50 p-2 rounded-xl text-center">
                      <p className="text-[9px] font-bold text-gray-400 font-sans uppercase">Total Deficit</p>
                      <p className={`mt-0.5 ${stats.totalCalorieDeficit < 0 ? "text-orange-500" : "text-gray-900"}`}>
                        {stats.totalCalorieDeficit.toLocaleString()} kcal
                      </p>
                    </div>

                    <div className="bg-gray-50 p-2 rounded-xl text-center">
                      <p className="text-[9px] font-bold text-gray-400 font-sans uppercase">Est. Weight Lost</p>
                      <p className={`mt-0.5 ${stats.totalWeightLost > 0 ? "text-[#2ECC71]" : "text-gray-900"}`}>
                        {stats.totalWeightLost} kg
                      </p>
                    </div>

                    <div className="bg-gray-50 p-2 rounded-xl text-center">
                      <p className="text-[9px] font-bold text-gray-400 font-sans uppercase">Workouts</p>
                      <p className="text-gray-900 mt-0.5">{stats.workoutCompletionCount} / 36</p>
                    </div>

                    <div className="bg-gray-50 p-2 rounded-xl text-center">
                      <p className="text-[9px] font-bold text-gray-400 font-sans uppercase">Days Not Logged</p>
                      <p className={`mt-0.5 ${stats.missedLoggingDays > 0 ? "text-orange-500" : "text-gray-900"}`}>
                        {stats.missedLoggingDays}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Create Client sidebar form */}
        <div id="coach-create-client-form-holder">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-[#2ECC71]" />
              <span>Add New Client</span>
            </h3>

            {formErr && (
              <p className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
                {formErr}
              </p>
            )}

            {newCredentials && (
              <div ref={credentialsRef} className="p-4 bg-[#2ECC71]/10 rounded-xl border border-[#2ECC71]/30 space-y-3" id="new-client-credentials">
                <p className="text-xs font-bold text-[#111111] flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-[#2ECC71]" />
                  <span>Client added — share this sign-in info now.</span>
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  This password is shown only once. The client must change it on first sign-in.
                </p>
                <div className="bg-white rounded-lg border border-gray-100 p-3 font-mono text-xs text-gray-900 space-y-1">
                  <p>Email: {newCredentials.email}</p>
                  <p>Password: {newCredentials.tempPassword}</p>
                </div>
                {copyError && (
                  <p className="text-[10px] text-red-600 font-bold">
                    Copy failed — select and copy the text above manually.
                  </p>
                )}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyPair()}
                    className="flex-1 bg-[#111111] hover:bg-[#2ECC71] hover:text-[#111111] text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied!" : "Copy Email & Password"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onCredentialsChange(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-bold font-sans">
              <div>
                <label className="block text-gray-400 uppercase mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Richard Hendricks"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 px-3.5 py-2 rounded-xl transition outline-none font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 uppercase mb-2">Email (their sign-in)</label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 px-3.5 py-2 rounded-xl transition outline-none font-bold text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 uppercase mb-2">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 px-3.5 py-2 rounded-xl transition outline-none font-bold text-sm font-mono"
                    min="1"
                    max="120"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 uppercase mb-2">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 px-3.5 py-2 rounded-xl transition outline-none font-bold text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 uppercase mb-2">Starting Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={startingWeight}
                    onChange={(e) => setStartingWeight(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 px-3.5 py-2 rounded-xl transition outline-none font-bold text-sm font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 uppercase mb-2">Target Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 px-3.5 py-2 rounded-xl transition outline-none font-bold text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 uppercase mb-2">BMR (kcal/day)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 1600"
                  value={bmr}
                  onChange={(e) => setBmr(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 px-3.5 py-2 rounded-xl transition outline-none font-bold text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 uppercase mb-2">Program Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 px-3.5 py-2 rounded-xl transition outline-none font-bold text-sm font-mono"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium normal-case">
                  Week 1 begins on the Monday of the selected week.
                </p>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-[#111111] hover:bg-[#2ECC71] hover:text-[#111111] text-white py-3 rounded-xl uppercase font-bold text-xs tracking-wider transition duration-200 cursor-pointer shadow-3xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Adding…" : "Add Client"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
