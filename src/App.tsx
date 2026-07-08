import React, { useState, useEffect } from "react";
import { User, DailyCalorie, WorkoutLog } from "./types";
import {
  todayStr,
  mondayOf,
  getWeekForDate,
  clientMetricsError,
  WORKOUT_DEFINITIONS,
  PROGRAM_WEEKS
} from "./data";
import { Session, sessionFromFirebaseUser, logout, clientNameError, authErrorMessage } from "./auth";
import {
  loadAppData,
  saveCaloriesEntry,
  saveWorkoutLog,
  saveProfile,
  createClient,
  deleteClientData
} from "./store";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Dumbbell, AlertCircle } from "lucide-react";
import Login from "./components/Login";
import ChangePassword from "./components/ChangePassword";
import CoachView from "./views/CoachView";
import ClientView from "./views/ClientView";

// App owns the session and the Firestore-backed data, and routes to the
// view the session dictates. The views themselves are separate
// components - there is no in-app switching between them.
export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [dailyCalories, setDailyCalories] = useState<DailyCalorie[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

  // Session follows Firebase's auth state; null while signed out,
  // authLoading until Firebase resolves the persisted sign-in on load.
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState(""); // shown on Login after a forced sign-out
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);
  // Escape hatch when the splash takes suspiciously long
  const [splashSlow, setSplashSlow] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setSession(null);
        setAuthLoading(false);
        return;
      }
      try {
        const built = await sessionFromFirebaseUser(firebaseUser);
        // Discard stale async results: the user may have signed out (or
        // switched) while the doc read was in flight, and login() already
        // set a fresher session for this uid (e.g. flag cleared locally).
        if (auth.currentUser?.uid === firebaseUser.uid) {
          setSession((prev) => (prev && prev.userId === built.userId ? prev : built));
        }
      } catch {
        // Can't build a session (Firestore unreachable etc.) - sign out
        // rather than hanging on the splash screen, and say why.
        void logout();
        setSession(null);
        setAuthNotice("Could not load your account - check your connection and sign in again.");
      } finally {
        setAuthLoading(false);
      }
    });
  }, []);

  // Load this session's data from Firestore (coach: everyone; client: own)
  const userId = session?.userId ?? null;
  const role = session?.role ?? null;
  useEffect(() => {
    if (!userId || !role) {
      setUsers([]);
      setDailyCalories([]);
      setWorkoutLogs([]);
      return;
    }
    let cancelled = false;
    setDataLoading(true);
    setDataError("");
    loadAppData({ userId, role })
      .then((data) => {
        if (cancelled) return;
        setUsers(data.users);
        setDailyCalories(data.dailyCalories);
        setWorkoutLogs(data.workoutLogs);
      })
      .catch((err) => {
        if (!cancelled) setDataError(authErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, role, reloadTick]);

  // Offer an escape hatch if either loading phase drags on
  const showSplash = authLoading || (Boolean(session) && dataLoading);
  useEffect(() => {
    if (!showSplash) {
      setSplashSlow(false);
      return;
    }
    const timer = setTimeout(() => setSplashSlow(true), 8000);
    return () => clearTimeout(timer);
  }, [showSplash]);

  const can = (permission: string) => session?.permissions.includes(permission) ?? false;

  // A client may only ever write their own data; the coach may write for
  // any client. Mirrors the Firestore rules, which are the real gate.
  const canWriteFor = (clientId: string) => {
    if (!session || !can("logs:write")) return false;
    if (session.role === "client") return session.userId === clientId;
    return true;
  };

  const handleLogin = (s: Session) => {
    setAuthNotice("");
    setSession(s);
  };

  const handleLogout = () => {
    void logout(); // the auth listener also clears the session
    setSession(null);
  };

  const writeErrorMessage = (err: unknown) => authErrorMessage(err);

  // --- Handlers: write to Firestore first, then mirror in local state ---

  // Update Client profile detail (coach only - baselines drive all the
  // deficit math). Returns an error message or null.
  const handleUpdateUserProfile = async (updatedUser: User): Promise<string | null> => {
    if (!can("profile:write")) return "Only your coach can update profile metrics.";

    const nameError = clientNameError(updatedUser.name);
    if (nameError) return nameError;

    const metricsError = clientMetricsError(updatedUser);
    if (metricsError) return metricsError;

    const cleaned = { ...updatedUser, name: updatedUser.name.trim() };
    try {
      await saveProfile(cleaned);
    } catch (err) {
      return writeErrorMessage(err);
    }
    setUsers((prev) => prev.map((u) => (u.id === cleaned.id ? cleaned : u)));
    return null;
  };

  // Add/Update daily calorie entries. Returns an error message or null.
  const handleSaveCalories = async (
    clientId: string,
    dateStr: string,
    calories: number,
    notes: string
  ): Promise<string | null> => {
    if (!canWriteFor(clientId)) return "Not allowed.";
    if (dateStr > todayStr()) return "That day hasn't happened yet — you can log it when it does.";
    if (!Number.isFinite(calories) || calories < 0 || calories > 10000) {
      return "Calories must be between 0 and 10000.";
    }

    // Only days inside the client's 12-week program can be logged
    const client = users.find((u) => u.id === clientId);
    if (!client) return "Client not found.";
    const weekOfDate = getWeekForDate(dateStr, client.program_start_date);
    if (weekOfDate < 1 || weekOfDate > PROGRAM_WEEKS) {
      return "That day is outside the 12-week program.";
    }

    try {
      await saveCaloriesEntry(clientId, dateStr, calories, notes);
    } catch (err) {
      return writeErrorMessage(err);
    }

    setDailyCalories((prev) => {
      const existingIdx = prev.findIndex((c) => c.user_id === clientId && c.date === dateStr);
      const entry: DailyCalorie = {
        id: `cal-${clientId}-${dateStr}`,
        user_id: clientId,
        date: dateStr,
        calories,
        notes: notes || undefined
      };
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = entry;
        return copy;
      }
      return [...prev, entry];
    });
    return null;
  };

  // Complete/Incomplete workouts. Returns an error message or null.
  const handleToggleWorkout = async (
    clientId: string,
    week: number,
    workoutName: "Lower Body" | "Upper Body Push" | "Upper Body Pull"
  ): Promise<string | null> => {
    if (!canWriteFor(clientId)) return "Not allowed.";

    const client = users.find((u) => u.id === clientId);
    if (!client) return "Client not found.";
    // Only current or past weeks can be toggled. The raw (unclamped) week
    // also locks everything before the program starts.
    if (week > getWeekForDate(todayStr(), client.program_start_date)) {
      return "Future weeks unlock as you reach them.";
    }

    const existing = workoutLogs.find(
      (w) => w.user_id === clientId && w.week === week && w.workout_name === workoutName
    );
    const def = WORKOUT_DEFINITIONS.find((d) => d.name === workoutName)!;
    const nowCompleted = existing ? !existing.completed : true;

    const updated: WorkoutLog = {
      id: existing?.id ?? `work-${clientId}-w${week}-${workoutName}`,
      user_id: clientId,
      week,
      workout_name: workoutName,
      calories_burned: existing?.calories_burned ?? def.calories,
      completed: nowCompleted,
      completed_at: nowCompleted ? todayStr() : null
    };

    try {
      await saveWorkoutLog(clientId, updated);
    } catch (err) {
      return writeErrorMessage(err); // local state untouched on a failed write
    }

    setWorkoutLogs((prev) => {
      const idx = prev.findIndex(
        (w) => w.user_id === clientId && w.week === week && w.workout_name === workoutName
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });
    return null;
  };

  // Register New Client (Coach Flow). Returns the one-time credentials
  // pair on success, or an error message.
  const handleCreateClient = async (
    newClientFields: Omit<User, "id">
  ): Promise<{ email: string; tempPassword: string } | string> => {
    if (!can("clients:create")) return "You are not allowed to create clients.";

    const nameError = clientNameError(newClientFields.name);
    if (nameError) return nameError;

    const metricsError = clientMetricsError(newClientFields);
    if (metricsError) return metricsError;

    const fields: Omit<User, "id"> = {
      ...newClientFields,
      name: newClientFields.name.trim(),
      email: newClientFields.email.trim().toLowerCase(),
      // Week 1 is always anchored to a Monday
      program_start_date: mondayOf(newClientFields.program_start_date)
    };

    try {
      const result = await createClient(fields);
      setUsers((prev) => [...prev, result.user]);
      setWorkoutLogs((prev) => [...prev, ...result.workoutLogs]);
      return { email: result.user.email, tempPassword: result.tempPassword };
    } catch (err) {
      return writeErrorMessage(err);
    }
  };

  // Delete client (Coach Flow)
  const handleDeleteClient = async (clientId: string): Promise<string | null> => {
    if (!can("clients:delete")) return "You are not allowed to delete clients.";

    try {
      await deleteClientData(clientId);
    } catch (err) {
      return writeErrorMessage(err);
    }
    setUsers((prev) => prev.filter((u) => u.id !== clientId));
    setDailyCalories((prev) => prev.filter((c) => c.user_id !== clientId));
    setWorkoutLogs((prev) => prev.filter((w) => w.user_id !== clientId));
    return null;
  };

  // --- Route to the view the session dictates ---

  const splash = (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center space-y-4">
      <Dumbbell className="w-10 h-10 text-[#2ECC71] animate-pulse" />
      {splashSlow && (
        <div className="text-center space-y-3">
          <p className="text-xs text-gray-500">Taking longer than expected…</p>
          <button
            onClick={handleLogout}
            className="text-[11px] text-gray-500 hover:text-white font-bold underline cursor-pointer"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );

  if (authLoading) {
    return splash;
  }

  if (!session) {
    return <Login onLogin={handleLogin} notice={authNotice} />;
  }

  // A temporary password must be replaced before anything else - this
  // gate doesn't need app data, so it renders before the data splash.
  if (session.mustChangePassword) {
    return (
      <ChangePassword
        onDone={() => setSession({ ...session, mustChangePassword: false })}
        onLogout={handleLogout}
      />
    );
  }

  if (dataLoading) {
    return splash;
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center font-sans">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-sm font-bold text-gray-300">Could not load your data. {dataError}</p>
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setReloadTick((t) => t + 1)}
              className="bg-[#2ECC71] text-[#111111] text-xs font-bold px-5 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer"
            >
              Try Again
            </button>
            <button
              onClick={handleLogout}
              className="bg-[#1a1a1a] border border-gray-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (session.role === "coach") {
    return (
      <CoachView
        session={session}
        users={users}
        allCalories={dailyCalories}
        allWorkouts={workoutLogs}
        onLogout={handleLogout}
        onCreateClient={handleCreateClient}
        onDeleteClient={handleDeleteClient}
        onUpdateUser={handleUpdateUserProfile}
      />
    );
  }

  return (
    <ClientView
      session={session}
      users={users}
      allCalories={dailyCalories}
      allWorkouts={workoutLogs}
      onLogout={handleLogout}
      onSaveCalories={handleSaveCalories}
      onToggleWorkout={handleToggleWorkout}
      onUpdateUser={handleUpdateUserProfile}
    />
  );
}
