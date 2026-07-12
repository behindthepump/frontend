import { useState, useEffect } from "react";
import { User, DailyCalorie, WorkoutLog, WorkoutName } from "./types";
import { todayStr, getWeekForDate, MAX_WORKOUT_CALORIES, PROGRAM_WEEKS } from "./data";
import { Session, sessionFromFirebaseUser, logout, authErrorMessage } from "./auth";
import { loadAppData, saveCaloriesEntry, saveWorkoutLog } from "./store";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Dumbbell, AlertCircle } from "lucide-react";
import Login from "./components/Login";
import Onboarding from "./components/Onboarding";
import Waitlist from "./components/Waitlist";
import CoachView from "./views/CoachView";
import ClientView from "./views/ClientView";

// App owns the session and the signed-in client's own data, and routes to
// the view the session dictates. The coach's view owns its own paginated
// data (see CoachView). There is no in-app switching between roles.
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

  // Load the signed-in client's own data. The coach loads nothing here -
  // CoachView fetches its roster pages itself. A client who isn't active
  // yet is gated to onboarding/waitlist screens that need no data.
  const userId = session?.userId ?? null;
  const role = session?.role === "client" && session.status === "active" ? "client" : null;
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
    loadAppData()
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
  // any client. UI gating only - the backend is the real gate.
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

  // --- Handlers: write via the API first, then mirror in local state ---

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

  // Complete/Incomplete workouts. Completing requires the client-reported
  // burn; unchecking clears it. Returns an error message or null.
  const handleToggleWorkout = async (
    clientId: string,
    week: number,
    workoutName: WorkoutName,
    caloriesBurned?: number
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
    const nowCompleted = existing ? !existing.completed : true;

    if (nowCompleted) {
      if (
        caloriesBurned === undefined ||
        !Number.isFinite(caloriesBurned) ||
        caloriesBurned < 0 ||
        caloriesBurned > MAX_WORKOUT_CALORIES
      ) {
        return `Calories burned must be between 0 and ${MAX_WORKOUT_CALORIES}.`;
      }
    }

    const updated: WorkoutLog = {
      id: existing?.id ?? `work-${clientId}-w${week}-${workoutName}`,
      user_id: clientId,
      week,
      workout_name: workoutName,
      calories_burned: nowCompleted ? caloriesBurned! : 0,
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

  // A fresh Google signup has no user doc yet - collect the baseline
  // profile, then hold the client on the waitlist until approval. Neither
  // screen needs app data, so they render before the data splash.
  if (session.role === "client" && session.status === "new") {
    return (
      <Onboarding
        onDone={(name) => setSession({ ...session, status: "pending", name })}
        onLogout={handleLogout}
      />
    );
  }

  if (session.role === "client" && (session.status === "pending" || session.status === "declined")) {
    return <Waitlist status={session.status} name={session.name} onLogout={handleLogout} />;
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
    return <CoachView session={session} onLogout={handleLogout} />;
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
    />
  );
}
