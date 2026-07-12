import React, { useState } from "react";
import { User } from "../../types";
import { mondayOf, todayStr, formatShortDate, PROGRAM_WEEKS } from "../../data";
import Expand from "../Expand";
import RingAvatar from "./RingAvatar";
import { Check, X, CalendarCheck, ChevronDown, CheckCircle2 } from "lucide-react";

// "Today" / "3d ago" reads faster than a date; fall back to the date once
// it's a week old.
function requestedAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return formatShortDate(iso.slice(0, 10));
}

interface RequestsQueueProps {
  requests: User[]; // pending + declined signups
  onApproveClient: (
    clientId: string,
    programStartDate: string,
    workoutFrequency: 2 | 3
  ) => Promise<string | null>;
  // Called after the approved card's exit animation - refreshes the lists
  onApproveSettled: () => Promise<void>;
  onDeclineClient: (clientId: string) => Promise<string | null>;
}

// How long an approved card takes to collapse out of the queue (matches the
// Expand transition) before the lists refresh underneath it.
const EXIT_MS = 340;

// The signup queue as a decision inbox: one centered column, one card = one
// decision. Declined requests sit below the queue and stay approvable.
export default function RequestsQueue({
  requests,
  onApproveClient,
  onApproveSettled,
  onDeclineClient
}: RequestsQueueProps) {
  const [error, setError] = useState("");
  // The request whose inline approve form (start date + frequency) is open
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveDate, setApproveDate] = useState(mondayOf(todayStr()));
  const [approveFreq, setApproveFreq] = useState<2 | 3>(3);
  const [busyId, setBusyId] = useState<string | null>(null);
  // The request whose secondary details (age/height/BMR/email) are open
  const [detailsId, setDetailsId] = useState<string | null>(null);
  // An approved card collapsing out of the queue
  const [exitingId, setExitingId] = useState<string | null>(null);

  const pending = requests.filter((r) => r.status === "pending");
  const declined = requests.filter((r) => r.status === "declined");

  const openApprove = (uid: string) => {
    setApprovingId(uid);
    setApproveDate(mondayOf(todayStr()));
    setApproveFreq(3);
    setError("");
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingId) return;
    const uid = approvingId;
    setBusyId(uid);
    const err = await onApproveClient(uid, approveDate, approveFreq);
    setBusyId(null);
    if (err) {
      setError(err);
      return;
    }
    setApprovingId(null);
    setError("");
    // A decision should feel like clearing an item: collapse the card out,
    // then let the refetched lists land where it used to be.
    setExitingId(uid);
    setTimeout(() => {
      void onApproveSettled().then(() => setExitingId(null));
    }, EXIT_MS);
  };

  const handleDecline = async (uid: string) => {
    setBusyId(uid);
    const err = await onDeclineClient(uid);
    setBusyId(null);
    setError(err ?? "");
    if (approvingId === uid) setApprovingId(null);
  };

  const requestCard = (request: User, index: number) => {
    const isApproving = approvingId === request.id;
    const isBusy = busyId === request.id;
    const isDeclined = request.status === "declined";
    const detailsOpen = detailsId === request.id;
    // The decision-relevant numbers, precomputed: how much they want to
    // lose, the weekly pace 12 weeks implies, and where the journey sits on
    // the BMI scale (is this target sensible for this body?).
    const toLose = parseFloat((request.starting_weight - request.target_weight).toFixed(1));
    const weeklyPace = parseFloat((toLose / PROGRAM_WEEKS).toFixed(1));
    const aggressive = weeklyPace > 1;
    const heightM = request.height / 100;
    const bmiNow = parseFloat((request.starting_weight / (heightM * heightM)).toFixed(1));
    const bmiTarget = parseFloat((request.target_weight / (heightM * heightM)).toFixed(1));
    const bmiCategory =
      bmiNow < 18.5 ? "underweight" : bmiNow < 25 ? "healthy" : bmiNow < 30 ? "overweight" : "obese";

    return (
      <div
        className={`bg-white p-5 rounded-2xl border space-y-3 animate-fadeIn transition-opacity ${
          isDeclined ? "border-gray-200 opacity-80" : "border-gray-100 shadow-3xs"
        } ${isBusy ? "opacity-50 pointer-events-none" : ""}`}
        style={{ animationDelay: `${Math.min(index, 7) * 45}ms`, animationFillMode: "backwards" }}
      >
        {/* Who + when: the empty ring is honest - their journey hasn't
            started; email rides the subline since Google display names can
            be ambiguous */}
        <div className="flex items-center gap-3">
          <RingAvatar name={request.name} pct={0} />
          <div className="min-w-0 flex-1">
            <div className="flex justify-between items-start gap-2">
              <p className="text-base font-extrabold text-gray-900 truncate">{request.name}</p>
              {isDeclined ? (
                <span className="text-[9px] text-gray-500 font-extrabold bg-gray-200 px-2 py-0.5 rounded uppercase shrink-0">
                  Declined
                </span>
              ) : (
                request.requested_at && (
                  <span
                    className="text-[9px] text-gray-400 font-bold uppercase shrink-0"
                    title={request.requested_at.slice(0, 10)}
                  >
                    {requestedAgo(request.requested_at)}
                  </span>
                )
              )}
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5 truncate font-mono">{request.email}</p>
          </div>
        </div>

        {/* The goal - the one thing the decision hinges on */}
        <div className="flex items-center justify-between gap-2 bg-gray-50 rounded-xl border border-gray-100 px-3.5 py-3">
          <span className="font-mono text-xl leading-none font-black text-gray-900">
            {request.starting_weight}
            <span className="text-gray-300 mx-1.5 text-base">→</span>
            {request.target_weight}
            <span className="text-[11px] font-bold text-gray-400 ml-1">kg</span>
          </span>
          <span
            className={`text-[10px] font-bold font-mono px-2 py-1 rounded-md shrink-0 ${
              aggressive ? "bg-amber-100 text-amber-800" : "bg-[#2ECC71]/10 text-emerald-700"
            }`}
            title={`Losing ${toLose} kg in ${PROGRAM_WEEKS} weeks means ~${weeklyPace} kg per week${
              aggressive ? " - an aggressive pace" : ""
            }`}
          >
            −{toLose} kg · ~{weeklyPace}/wk
          </span>
        </div>

        {/* Everything else on demand */}
        <button
          type="button"
          onClick={() => setDetailsId(detailsOpen ? null : request.id)}
          className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider transition cursor-pointer flex items-center gap-1"
        >
          Details
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${detailsOpen ? "rotate-180" : ""}`}
          />
        </button>

        <Expand open={detailsOpen} gap>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {[
              ["Age", `${request.age} yrs`],
              ["Gender", request.gender],
              ["Height", `${request.height} cm`],
              ["BMR", `${request.bmr} kcal`]
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-50 rounded-lg border border-gray-100 px-2.5 py-1.5">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="font-mono font-bold text-gray-900 mt-0.5">{value}</p>
              </div>
            ))}
            <div className="bg-gray-50 rounded-lg border border-gray-100 px-2.5 py-1.5 col-span-2">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                BMI — now → target
              </p>
              <p className="font-mono font-bold text-gray-900 mt-0.5">
                {bmiNow}
                <span className="text-gray-300 mx-1">→</span>
                {bmiTarget}
                <span className="font-sans font-semibold text-gray-400 ml-1.5">
                  ({bmiCategory} now)
                </span>
              </p>
            </div>
          </div>
        </Expand>

        <Expand open={isApproving} gap>
          <form onSubmit={handleApprove} className="space-y-3 text-xs font-bold">
            <div>
              <label className="block text-gray-400 uppercase mb-1.5 text-[10px]">Program Start Date</label>
              <input
                type="date"
                value={approveDate}
                onChange={(e) => setApproveDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-[#2ECC71] text-gray-900 px-3 py-2 rounded-xl transition outline-none font-mono"
                required
              />
              <p className="text-[10px] text-gray-400 mt-1 font-medium normal-case">
                Week 1 begins on the Monday of the selected week.
              </p>
            </div>
            <div>
              <label className="block text-gray-400 uppercase mb-1.5 text-[10px]">Workouts Per Week</label>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                {([2, 3] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setApproveFreq(freq)}
                    className={`flex-1 py-2 uppercase tracking-wider transition cursor-pointer ${
                      approveFreq === freq
                        ? "bg-[#111111] text-[#2ECC71]"
                        : "bg-white text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {freq}-day
                  </button>
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 bg-[#2ECC71] hover:bg-[#27ae60] text-[#111111] py-2 rounded-xl uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.97] flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Start Program</span>
              </button>
              <button
                type="button"
                onClick={() => setApprovingId(null)}
                className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 px-4 py-2 rounded-xl uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </Expand>

        <Expand open={!isApproving} gap>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => openApprove(request.id)}
              className="flex-1 bg-[#111111] hover:bg-[#2ECC71] hover:text-[#111111] text-white py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.97] flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve</span>
            </button>
            {!isDeclined && (
              <button
                type="button"
                onClick={() => void handleDecline(request.id)}
                className="bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.97] flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Decline</span>
              </button>
            )}
          </div>
        </Expand>
      </div>
    );
  };

  // Cards live inside an Expand so an approved one can collapse out of the
  // queue; spacing comes from the inner pb so it collapses with the card.
  const queuedCard = (request: User, index: number) => (
    <Expand key={request.id} open={exitingId !== request.id}>
      <div className="pb-3">{requestCard(request, index)}</div>
    </Expand>
  );

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fadeIn" id="coach-requests-screen">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Requests</h1>
        <p className="text-xs text-gray-400 font-medium mt-1">
          {pending.length === 0
            ? "New Google signups land here for your decision."
            : `${pending.length} ${pending.length === 1 ? "client" : "clients"} waiting on you.`}
        </p>
      </div>

      {error && (
        <p className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
          {error}
        </p>
      )}

      {/* Inbox zero - the screen the trainer wants to see. With nothing
          else on the page it centers in the free viewport space; with a
          declined section below it stays compact. */}
      {pending.length === 0 && (
        <div className={declined.length === 0 ? "min-h-[50vh] flex items-center" : undefined}>
          <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center space-y-3 w-full">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#2ECC71]/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-[#2ECC71] animate-pop" />
            </div>
            <p className="text-sm font-extrabold text-gray-900">All caught up</p>
            <p className="text-xs text-gray-400">
              No one is waiting. New signups appear here the moment a client
              finishes onboarding.
            </p>
          </div>
        </div>
      )}

      <div>{pending.map(queuedCard)}</div>

      {declined.length > 0 && (
        <div className="pt-2">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Declined — can still be approved
          </h2>
          {declined.map(queuedCard)}
        </div>
      )}
    </div>
  );
}
