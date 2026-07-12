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
import ClientsRoster from "../components/coach/ClientsRoster";
import RequestsQueue from "../components/coach/RequestsQueue";
import { CoachNav, CoachBottomNav, CoachPage } from "../components/coach/CoachNav";
import CoachClientScreens from "../components/coach/CoachClientScreens";
import { ArrowLeft, Loader2 } from "lucide-react";

interface CoachViewProps {
  session: Session;
  onLogout: () => void;
}

// The coach's view owns its own data: a paginated, searchable roster page
// with server-computed stats, the signup requests, and an on-demand load of
// one client's full logs for the drill-in. Nothing is bulk-loaded.
export default function CoachView({ session, onLogout }: CoachViewProps) {
  const [page, setPage] = useState<CoachPage>("clients");
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rosterLoading, setRosterLoading] = useState(true);
  // Set when a drill-in profile edit changes data the roster displays
  const [rosterStale, setRosterStale] = useState(false);
  const [requests, setRequests] = useState<User[]>([]);
  const [loadError, setLoadError] = useState("");

  // Drill-in to one client's tracker (read-only logs + editable profile);
  // lives under the Clients page - the main nav stays put while drilled in.
  const [viewingClient, setViewingClient] = useState<ClientData | null>(null);
  const [viewingLoading, setViewingLoading] = useState(false);

  const loadRoster = useCallback(async (searchTerm: string, cursor: string | null) => {
    setRosterLoading(true);
    setLoadError("");
    try {
      const rosterPage = await fetchClientsPage(searchTerm, cursor);
      // A cursor load appends; a fresh search/reload replaces.
      setClients((prev) => (cursor ? [...prev, ...rosterPage.clients] : rosterPage.clients));
      setNextCursor(rosterPage.nextCursor);
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
    return null;
  };

  // The request becomes a roster row - refresh both lists. Deferred by the
  // queue until the approved card's exit animation finishes.
  const handleApproveSettled = async () => {
    await Promise.all([loadRequests(), loadRoster(search, null)]);
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

  // Deletion lives in the drill-in's Profile danger zone, not on the roster
  // cards - a destructive action should take a deliberate detour.
  const handleDeleteViewing = async (): Promise<string | null> => {
    if (!viewingClient) return null;
    const uid = viewingClient.user.id;
    try {
      await deleteClientData(uid);
    } catch (err) {
      return authErrorMessage(err);
    }
    setClients((prev) => prev.filter((c) => c.user.id !== uid));
    closeClient();
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
    setViewingLoading(true);
    fetchClientData(clientId)
      .then(setViewingClient)
      .catch((err) => setLoadError(authErrorMessage(err)))
      .finally(() => setViewingLoading(false));
  };

  const closeClient = () => {
    setViewingClient(null);
    if (rosterStale) {
      setRosterStale(false);
      void loadRoster(search, null);
    }
  };

  const handleNav = (target: CoachPage) => {
    if (viewingClient) closeClient();
    setPage(target);
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const mobileSubheader = viewingClient ? (
    <div className="flex justify-between items-center text-xs gap-2">
      <button
        onClick={closeClient}
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
      sidebarNav={<CoachNav page={page} pendingCount={pendingCount} onSelect={handleNav} />}
      mobileSubheader={mobileSubheader}
      bottomNav={<CoachBottomNav page={page} pendingCount={pendingCount} onSelect={handleNav} />}
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
        <div className="space-y-4">
          {/* Mobile gets the same affordance in the subheader */}
          <button
            onClick={closeClient}
            className="hidden md:flex items-center space-x-1.5 text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-wider transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Clients</span>
          </button>
          <CoachClientScreens
            user={viewingClient.user}
            allCalories={viewingClient.dailyCalories}
            allWorkouts={viewingClient.workoutLogs}
            onUpdateUser={handleUpdateUser}
            onDelete={handleDeleteViewing}
          />
        </div>
      ) : page === "requests" ? (
        <RequestsQueue
          requests={requests}
          onApproveClient={handleApprove}
          onApproveSettled={handleApproveSettled}
          onDeclineClient={handleDecline}
        />
      ) : (
        <ClientsRoster
          clients={clients}
          nextCursor={nextCursor}
          rosterLoading={rosterLoading}
          onSearch={handleSearch}
          onLoadMore={handleLoadMore}
          onSelectClient={openClient}
        />
      )}
    </AppShell>
  );
}
