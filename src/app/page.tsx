"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { GlassCard } from "@/components/ui/glass-card";
import { ChevronRight, Zap, Trophy, Flame, Calendar } from "lucide-react";
import { useMatch } from "@/context/match-context";

export default function Home() {
  const { bracketData } = useMatch();

  // 1. Extract and Filter Live Matches dynamically across all sports:
  const liveMatches: any[] = [];
  
  Object.entries(bracketData || {}).forEach(([sport, sportData]: [any, any]) => {
    Object.entries(sportData || {}).forEach(([stage, matches]: [any, any]) => {
      if (Array.isArray(matches)) {
        matches.forEach((m) => {
            const team1 = m.teams?.[0]?.name || "TBA";
            const team2 = m.teams?.[1]?.name || "TBA";
            const score1 = m.teams?.[0]?.score ?? 0;
            const score2 = m.teams?.[1]?.score ?? 0;

            if (m.status === "live") {
              liveMatches.push({
                id: m.id,
                sport: sport.charAt(0).toUpperCase() + sport.slice(1),
                teams: `${team1} vs ${team2}`,
                score: m.setScores && m.setScores.length > 0 
                  ? m.setScores.join(" | ") 
                  : `${score1} - ${score2}`,
                status: stage === "round16" ? "Round of 16" : stage.toUpperCase()
              });
            }
        });
      }
    });
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-neutral-400 mt-1">Live scores and tournament status at a glance.</p>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Spotlight Card - Large */}
          <GlassCard className="md:col-span-2 relative overflow-hidden flex flex-col justify-between h-64 border-cyan-500/20 bg-gradient-to-br from-neutral-900 via-black to-cyan-950">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="z-10">
              <span className="inline-flex items-center gap-1 bg-cyan-500/20 text-cyan-400 font-semibold px-3 py-1 rounded-full text-xs">
                <Zap className="h-4 w-4" /> Match of the day
              </span>
              <h2 className="text-2xl font-bold mt-4">Football Finals: ME vs CSE</h2>
              <p className="text-neutral-300 mt-2">Kickoff in 2 hours. Support your departments!</p>
            </div>
            <button className="z-10 mt-4 self-start flex items-center gap-1 bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/30">
              View Bracket <ChevronRight className="h-4 w-4" />
            </button>
          </GlassCard>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 gap-6">
            <GlassCard className="flex items-center justify-between border-emerald-500/20 bg-gradient-to-br from-neutral-900 to-emerald-950">
              <div>
                <span className="text-neutral-400 text-sm">Matches Today</span>
                <p className="text-3xl font-extrabold mt-1">12</p>
              </div>
              <Calendar className="h-10 w-10 text-emerald-500" />
            </GlassCard>
            <GlassCard className="flex items-center justify-between border-amber-500/20 bg-gradient-to-br from-neutral-900 to-amber-950">
              <div>
                <span className="text-neutral-400 text-sm">Tournament Stage</span>
                <p className="text-3xl font-extrabold mt-1">Quarterfinals</p>
              </div>
              <Trophy className="h-10 w-10 text-amber-500" />
            </GlassCard>
          </div>
        </div>

        {/* Live Matches Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-red-500 animate-pulse" />
            <span className="font-bold text-xl">Live Matches</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveMatches.map((match: any) => (
              <GlassCard key={match.id} className="border-red-500/20 bg-gradient-to-r from-neutral-900/40 to-black/60 p-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-md font-semibold">
                      {match.sport}
                    </span>
                    <h3 className="font-bold text-lg mt-2 leading-tight">{match.teams}</h3>
                    <p className="text-xs text-neutral-400 mt-1">{match.status}</p>
                  </div>
                  <div className="font-sans font-black text-xl md:text-3xl tracking-wider text-red-500 md:text-right">
                    {match.score}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
