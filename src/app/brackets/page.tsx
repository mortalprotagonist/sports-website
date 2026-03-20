"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { BracketTree } from "@/components/bracket/bracket-tree";
import { useMatch } from "@/context/match-context";
import { MultiSportData } from "@/types/bracket";

export default function BracketsPage() {
  const { selectedSport, setSelectedSport } = useMatch();

  const sports: (keyof MultiSportData)[] = ["football", "badminton", "cricket", "volleyball"];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 h-full">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Tournament Bracket</h1>
            <p className="text-neutral-400 mt-1">
              Visual pathway for current department progressions. Swipe left/right on mobile.
            </p>
          </div>
          
          {/* Sport Switcher Tabs */}
          <div className="flex bg-neutral-900 border border-white/5 rounded-xl p-1 self-start md:self-center">
            {sports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  selectedSport === sport
                    ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 bg-neutral-900/50 rounded-3xl border border-white/5 overflow-hidden">
          <BracketTree />
        </div>
      </div>
    </DashboardLayout>
  );
}
