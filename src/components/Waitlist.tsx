import { useState } from "react";
import { Hourglass, XCircle, RefreshCw, Check, ChevronRight } from "lucide-react";

interface WaitlistProps {
  status: "pending" | "declined";
  name: string;
  // Re-fetches the session and returns the fresh status; on a change the
  // app re-routes by itself (approved -> straight into the tracker).
  onRefresh: () => Promise<string>;
  onLogout: () => void;
}

// Where a signed-up client waits until the coach approves their request.
// Declined requests stay here with different copy - the coach can still
// approve them later.
export default function Waitlist({ status, name, onRefresh, onLogout }: WaitlistProps) {
  const pending = status === "pending";
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState("");

  const handleCheck = async () => {
    setChecking(true);
    setNote("");
    try {
      const fresh = await onRefresh();
      if (fresh === status) {
        setNote(
          pending
            ? "Still pending — Coach hasn't gotten to it yet. Check back soon."
            : "No change yet — reach out to Coach directly."
        );
      }
    } catch {
      setNote("Couldn't check right now — try again in a moment.");
    }
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center font-sans p-4" id="waitlist-screen">
      <div className="w-full max-w-sm text-center space-y-6 animate-fadeIn">
        {/* Brand block, matching the Login screen */}
        <div className="space-y-2">
          <img src="/brand-logo.png" alt="Behind the Pump" className="h-14 w-auto mx-auto" />
          <h1 className="text-lg font-black uppercase tracking-wider text-white">Transformation</h1>
          <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">12-Week Tracker</p>
        </div>

        {/* The status story lives in one card, separated from the brand */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 space-y-5">
          {/* The same journey the onboarding form promised - this is step 2 */}
          {pending && (
            <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-wider">
              <span className="text-gray-500 flex items-center gap-1">
                <Check className="w-3 h-3 text-[#FEC63F]" />
                Your details
              </span>
              <ChevronRight className="w-3 h-3 text-gray-700" />
              <span className="text-[#FEC63F]">2 · Coach review</span>
              <ChevronRight className="w-3 h-3 text-gray-700" />
              <span className="text-gray-600">3 · 12 weeks</span>
            </div>
          )}

          <div className="space-y-3">
            {pending ? (
              <Hourglass className="w-10 h-10 text-[#FEC63F] mx-auto animate-pulse" />
            ) : (
              <XCircle className="w-10 h-10 text-orange-400 mx-auto" />
            )}
            <h2 className="text-base font-black uppercase tracking-wider text-white">
              {pending ? "You're on the list" : "Request not approved"}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              {pending
                ? `Thanks ${name}! Coach has your request and will set up your 12-week program.`
                : "Your request wasn't approved this time. Reach out to Coach directly if you think this is a mistake."}
            </p>
          </div>

          {note && <p className="text-xs text-gray-500 font-medium">{note}</p>}

          <button
            onClick={() => void handleCheck()}
            disabled={checking}
            className="w-full bg-[#FEC63F] hover:bg-[#F0B41E] text-[#111111] text-xs font-extrabold px-5 py-3 rounded-xl uppercase tracking-wider cursor-pointer transition hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            <span>{checking ? "Checking…" : "Check My Status"}</span>
          </button>
        </div>

        <button
          onClick={onLogout}
          className="w-full bg-[#1a1a1a] border border-gray-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer hover:border-gray-600 transition"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
