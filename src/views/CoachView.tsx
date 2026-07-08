import React, { useState } from "react";
import { User, DailyCalorie, WorkoutLog } from "../types";
import { Session } from "../auth";
import AppShell from "../components/AppShell";
import CoachDashboard from "../components/CoachDashboard";
import { TrackerNav, TrackerBottomNav } from "../components/tracker/TrackerNav";
import CoachClientScreens from "../components/coach/CoachClientScreens";
import { Users, ArrowLeft, Eye } from "lucide-react";

interface CoachViewProps {
  session: Session;
  users: User[];
  allCalories: DailyCalorie[];
  allWorkouts: WorkoutLog[];
  onLogout: () => void;
  onCreateClient: (
    newClient: Omit<User, "id">
  ) => Promise<{ email: string; tempPassword: string } | string>;
  onDeleteClient: (clientId: string) => Promise<string | null>;
  onUpdateUser: (updatedUser: User) => Promise<string | null>;
}

// The coach's view: the client roster, plus a drill-in to any client's
// tracker (allowed by the coach's clients:read permission). The coach
// never becomes a client - this is inspection, not role switching.
export default function CoachView({
  session,
  users,
  allCalories,
  allWorkouts,
  onLogout,
  onCreateClient,
  onDeleteClient,
  onUpdateUser,
}: CoachViewProps) {
  const [viewingClientId, setViewingClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // The one-time credentials pair for a just-created client. Lives here
  // (not in CoachDashboard) so drilling into a tracker and back doesn't
  // destroy it before the coach copies it.
  const [newCredentials, setNewCredentials] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);

  const viewingClient = users.find((u) => u.id === viewingClientId) || null;

  // Deleting the just-created client should clear their now-useless
  // one-time credentials panel.
  const handleDeleteClient = (clientId: string) => {
    const deleted = users.find((u) => u.id === clientId);
    if (deleted && newCredentials?.email === deleted.email) {
      setNewCredentials(null);
    }
    return onDeleteClient(clientId);
  };

  const openClient = (clientId: string) => {
    setViewingClientId(clientId);
    setActiveTab("dashboard");
  };

  const backToRoster = () => {
    setViewingClientId(null);
    setActiveTab("dashboard");
  };

  const sidebarNav = (
    <>
      <button
        onClick={backToRoster}
        className={`w-full flex items-center space-x-3 font-semibold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition cursor-pointer ${
          !viewingClient
            ? "bg-[#2ECC71] text-[#111111] font-extrabold shadow-sm"
            : "text-gray-400 hover:text-white hover:bg-gray-900"
        }`}
      >
        <Users className="w-5 h-5 shrink-0" />
        <span>Coach Dashboard</span>
      </button>

      {viewingClient && (
        <>
          <div className="pt-3 pb-1 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">
            Viewing: {viewingClient.name}
          </div>
          <TrackerNav activeTab={activeTab} onSelect={setActiveTab} />
        </>
      )}
    </>
  );

  const mobileSubheader = viewingClient ? (
    <div className="flex justify-between items-center text-xs gap-2">
      <button
        onClick={backToRoster}
        className="flex items-center space-x-1 text-gray-400 hover:text-white font-bold cursor-pointer shrink-0"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>All Clients</span>
      </button>
      <span className="text-[#2ECC71] font-black truncate">{viewingClient.name}</span>
    </div>
  ) : undefined;

  return (
    <AppShell
      session={session}
      onLogout={onLogout}
      sidebarNav={sidebarNav}
      mobileSubheader={mobileSubheader}
      bottomNav={
        viewingClient ? (
          <TrackerBottomNav activeTab={activeTab} onSelect={setActiveTab} />
        ) : undefined
      }
    >
      {viewingClient ? (
        <div className="space-y-4">
          {/* Persistent context: the tracker screens are client-voiced,
              so keep whose data this is visible on every tab. */}
          <div className="flex items-center gap-2 bg-[#111111] text-white px-4 py-2.5 rounded-xl text-xs font-bold">
            <Eye className="w-4 h-4 text-[#2ECC71] shrink-0" />
            <span className="truncate">
              Read-only view of <span className="text-[#2ECC71]">{viewingClient.name}</span>'s logs — you can edit their profile
            </span>
          </div>
          <CoachClientScreens
            user={viewingClient}
            allCalories={allCalories}
            allWorkouts={allWorkouts}
            activeTab={activeTab}
            onNavigate={setActiveTab}
            onUpdateUser={onUpdateUser}
          />
        </div>
      ) : (
        <CoachDashboard
          users={users}
          allCalories={allCalories}
          allWorkouts={allWorkouts}
          newCredentials={newCredentials}
          onCredentialsChange={setNewCredentials}
          onSelectClient={openClient}
          onCreateClient={onCreateClient}
          onDeleteClient={handleDeleteClient}
        />
      )}
    </AppShell>
  );
}
