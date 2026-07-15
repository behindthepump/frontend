import { Info } from "lucide-react";

// Shown on the daily/workout screens before a client's program has begun.
interface NotStartedNoticeProps {
  title: string;
  startDate: string;
  message: string;
}

export default function NotStartedNotice({ title, startDate, message }: NotStartedNoticeProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h1>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-start space-x-3">
        <Info className="w-5 h-5 text-[#A66A00] shrink-0 mt-0.5" />
        <p className="text-sm text-gray-600 font-medium">
          {message} <span className="font-bold font-mono">{startDate}</span> (Week 1).
        </p>
      </div>
    </div>
  );
}
