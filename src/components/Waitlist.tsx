import { Hourglass, XCircle } from "lucide-react";

interface WaitlistProps {
  status: "pending" | "declined";
  name: string;
  onLogout: () => void;
}

// Where a signed-up client waits until the coach approves their request.
// Declined requests stay here with different copy - the coach can still
// approve them later.
export default function Waitlist({ status, name, onLogout }: WaitlistProps) {
  const pending = status === "pending";

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center font-sans p-4" id="waitlist-screen">
      <div className="w-full max-w-sm text-center space-y-4">
        {pending ? (
          <Hourglass className="w-10 h-10 text-[#2ECC71] mx-auto" />
        ) : (
          <XCircle className="w-10 h-10 text-orange-400 mx-auto" />
        )}
        <h1 className="text-lg font-black uppercase tracking-wider text-white">
          {pending ? "You're on the list" : "Request not approved"}
        </h1>
        <p className="text-sm text-gray-400">
          {pending
            ? `Thanks ${name}! Coach has your request and will set up your 12-week program. Check back soon.`
            : "Your request wasn't approved this time. Reach out to Coach directly if you think this is a mistake."}
        </p>
        <button
          onClick={onLogout}
          className="bg-[#1a1a1a] border border-gray-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer hover:border-gray-600 transition"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
