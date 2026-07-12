import React, { useCallback, useEffect, useState } from "react";
import { User } from "../types";
import { Session, authErrorMessage, clientNameError } from "../auth";
import { clientMetricsError } from "../data";
import {
  ClientSummary,
  ClientData,
  fetchClientsPage,
  fetchRequests,
  fetchClientData,
  approveClient,
  declineClient,
  deleteClientData,
  saveProfile
} from "../store";
import AppShell from "../components/AppShell";
import CoachDashboard from "../components/CoachDashboard";
import { TrackerNav, TrackerBottomNav } from "../components/tracker/TrackerNav";
import CoachClientScreens, { COACH_CLIENT_TABS } from "../components/coach/CoachClientScreens";
import { Users, ArrowLeft, Loader2 } from "lucide-react";

interface CoachViewProps {
  session: Session;
  onLogout: () => void;
}

// The coach's view owns its own data: a paginated, searchable roster page
// with server-computed stats, the signup requests, and an on-demand load of
// one client's full logs for the drill-in. Nothing is bulk-loaded.
export default function CoachView({ session, onLogout }: CoachViewProps) {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rosterLoading, setRosterLoading] = useState(true);
  // Set when a drill-in profile edit changes data the roster displays
  const [rosterStale, setRosterStale] = useState(false);
  const [requests, setRequests] = useState<User[]>([]);
  const [loadError, setLoadError] = useState("");

  // Drill-in to one client's tracker (read-only logs + editable profile)
  const [viewingClient, setViewingClient] = useState<ClientData | null>(null);
  const [viewingLoading, setViewingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("report");

  const loadRoster = useCallback(async (searchTerm: string, cursor: string | null) => {
    setRosterLoading(true);
    setLoadError("");
    try {
      const page = await fetchClientsPage(searchTerm, cursor);
      // A cursor load appends; a fresh search/reload replaces.
      setClients((prev) => (cursor ? [...prev, ...page.clients] : page.clients));
      setNextCursor(page.nextCursor);
    } catch (err) {
      setLoadError(authErrorMessage(err));
    } finally {
      setRosterLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      setRequests(await fetchRequests());
    } catch (err) {
      setLoadError(authErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void loadRoster("", null);
    void loadRequests();
  }, [loadRoster, loadRequests]);

  const handleSearch = (term: string) => {
    setSearch(term);
    void loadRoster(term, null);
  };

  const handleLoadMore = () => {
    if (nextCursor && !rosterLoading) void loadRoster(search, nextCursor);
  };

  // --- Mutations: call the API, then refresh what the coach is looking at ---

  const handleApprove = async (
    uid: string,
    programStartDate: string,
    workoutFrequency: 2 | 3
  ): Promise<string | null> => {
    try {
      await approveClient(uid, programStartDate, workoutFrequency);
    } catch (err) {
      return authErrorMessage(err);
    }
    // The request becomes a roster row - refresh both lists.
    await Promise.all([loadRequests(), loadRoster(search, null)]);
    return null;
  };

  const handleDecline = async (uid: string): Promise<string | null> => {
    try {
      await declineClient(uid);
    } catch (err) {
      return authErrorMessage(err);
    }
    setRequests((prev) => prev.map((r) => (r.id === uid ? { ...r, status: "declined" } : r)));
    return null;
  };

  const handleDelete = async (uid: string): Promise<string | null> => {
    try {
      await deleteClientData(uid);
    } catch (err) {
      return authErrorMessage(err);
    }
    setClients((prev) => prev.filter((c) => c.user.id !== uid));
    return null;
  };

  // Profile edit from the drill-in. Roster stats/name may now be stale -
  // refetched when the coach navigates back.
  const handleUpdateUser = async (updatedUser: User): Promise<string | null> => {
    const nameError = clientNameError(updatedUser.name);
    if (nameError) return nameError;
    const metricsError = clientMetricsError(updatedUser);
    if (metricsError) return metricsError;

    const cleaned = { ...updatedUser, name: updatedUser.name.trim() };
    try {
      await saveProfile(cleaned);
    } catch (err) {
      return authErrorMessage(err);
    }
    setViewingClient((prev) => (prev && prev.user.id === cleaned.id ? { ...prev, user: cleaned } : prev));
    setRosterStale(true);
    return null;
  };

  const openClient = (clientId: string) => {
    setActiveTab("report");
    setViewingLoading(true);
    fetchClientData(clientId)
      .then(setViewingClient)
      .catch((err) => setLoadError(authErrorMessage(err)))
      .finally(() => setViewingLoading(false));
  };

  const backToRoster = () => {
    setViewingClient(null);
    setActiveTab("report");
    if (rosterStale) {
      setRosterStale(false);
      void loadRoster(search, null);
    }
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
            Viewing: {viewingClient.user.name}
          </div>
          <TrackerNav activeTab={activeTab} onSelect={setActiveTab} tabs={COACH_CLIENT_TABS} />
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
      <span className="text-[#2ECC71] font-black truncate">{viewingClient.user.name}</span>
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
          <TrackerBottomNav activeTab={activeTab} onSelect={setActiveTab} tabs={COACH_CLIENT_TABS} />
        ) : undefined
      }
    >
      {loadError && (
        <p className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
          {loadError}
        </p>
      )}

      {viewingLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-[#2ECC71] animate-spin" />
        </div>
      ) : viewingClient ? (
        <CoachClientScreens
          user={viewingClient.user}
          allCalories={viewingClient.dailyCalories}
          allWorkouts={viewingClient.workoutLogs}
          activeTab={activeTab}
          onUpdateUser={handleUpdateUser}
        />
      ) : (
        <CoachDashboard
          clients={clients}
          requests={requests}
          nextCursor={nextCursor}
          rosterLoading={rosterLoading}
          onSearch={handleSearch}
          onLoadMore={handleLoadMore}
          onSelectClient={openClient}
          onApproveClient={handleApprove}
          onDeclineClient={handleDecline}
          onDeleteClient={handleDelete}
        />
      )}
    </AppShell>
  );
}
