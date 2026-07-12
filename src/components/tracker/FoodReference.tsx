import { useEffect, useState } from "react";
import { FoodReferenceData, getFoodReference } from "../../foods";
import { authErrorMessage } from "../../auth";
import { BookOpen, ChevronDown, Search, Plus, Info, Loader2 } from "lucide-react";
import Expand from "../Expand";

interface FoodReferenceProps {
  // Adds a food's calories to the day's running count in the log form.
  onAddFood: (calories: number) => void;
}

// Read-only Malaysian food calorie reference on the client's daily log
// page, so logged numbers come from a shared baseline instead of guesses.
// Data loads once per session, lazily on first open.
export default function FoodReference({ onAddFood }: FoodReferenceProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<FoodReferenceData | null>(null);
  const [loadError, setLoadError] = useState("");

  const load = () => {
    setLoadError("");
    getFoodReference()
      .then(setData)
      .catch((err) => setLoadError(authErrorMessage(err)));
  };

  useEffect(() => {
    if (open && !data) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const q = query.trim().toLowerCase();
  const categories = data
    ? q
      ? data.categories
          .map((c) => ({
            ...c,
            items: c.items.filter((i) => i.name.toLowerCase().includes(q))
          }))
          .filter((c) => c.items.length > 0)
      : data.categories
    : [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs" id="food-reference-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full p-6 flex justify-between items-center cursor-pointer"
      >
        <div className="flex items-center space-x-3 text-left">
          <BookOpen className="w-5 h-5 text-[#2ECC71] shrink-0" />
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Food Calorie Reference</h3>
            <p className="text-xs text-gray-400 font-medium">
              Common Malaysian foods — tap + to add one to today's count
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <Expand open={open}>
        <div className="px-6 pb-6 space-y-4">
          {!data && !loadError && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#2ECC71] animate-spin" />
            </div>
          )}

          {loadError && (
            <div className="text-center py-6 space-y-3">
              <p className="text-xs text-red-600 font-bold">{loadError}</p>
              <button
                type="button"
                onClick={load}
                className="bg-[#111111] hover:bg-[#2ECC71] hover:text-[#111111] text-white text-xs font-bold px-5 py-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {data && (
            <>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Search foods, e.g. nasi lemak…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 focus:border-[#2ECC71] focus:bg-white text-gray-900 font-bold text-sm pl-10 pr-4 py-2.5 rounded-xl transition outline-none"
            />
          </div>

          {categories.length === 0 && (
            <p className="text-xs text-gray-400 font-medium text-center py-4">
              No foods match "{query.trim()}".
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {categories.map((category) => (
              <div key={category.name}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {category.name}
                </p>
                <ul className="space-y-1">
                  {category.items.map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      <span className="text-xs font-medium text-gray-700 min-w-0">{item.name}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold font-mono text-gray-900">
                          {item.calories} kcal
                        </span>
                        <button
                          type="button"
                          onClick={() => onAddFood(item.calories)}
                          title={`Add ${item.calories} kcal to today's count`}
                          aria-label={`Add ${item.name} (${item.calories} kcal) to today's count`}
                          className="p-1 rounded-md bg-[#2ECC71]/10 text-[#2ECC71] hover:bg-[#2ECC71] hover:text-[#111111] transition hover:scale-110 active:scale-90 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 rounded-xl p-4 text-xs text-amber-800 border border-amber-100 flex items-start space-x-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{data.disclaimer}</p>
          </div>
            </>
          )}
        </div>
      </Expand>
    </div>
  );
}
