import { Team } from "@/types/bracket";
import { GlassCard } from "@/components/ui/glass-card";
import { Trophy } from "lucide-react";

interface MatchCardProps {
  title: string;
  teams: [Team, Team];
  status: "upcoming" | "live" | "completed";
  winnerId?: string;
  onClick?: () => void;
  onHover?: (isHovered: boolean) => void;
}

export function MatchCard({
  title,
  teams,
  status,
  winnerId,
  onClick,
  onHover,
}: MatchCardProps) {
  return (
    <GlassCard
      className={`p-4 w-64 border-neutral-800 backdrop-blur-md cursor-pointer transition-all duration-300 ${
        status === "live" ? "border-cyan-500/30 ring-1 ring-cyan-500/20" : ""
      }`}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onClick={onClick}
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
        <span className="text-xs text-neutral-400 font-semibold tracking-wider">
          {title.toUpperCase()}
        </span>
        {status === "live" && (
          <span className="flex items-center gap-1 text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold animate-pulse">
            LIVE
          </span>
        )}
      </div>

      <div className="space-y-2">
        {teams.map((team, idx) => {
          if (!team) return null; // Safeguard against empty sets
          const isWinner = winnerId === team.id;
          return (
            <div
              key={team.id || idx}
              className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-all ${
                isWinner ? "bg-neutral-800/60 text-cyan-400" : "text-neutral-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isWinner ? "bg-cyan-500" : "bg-neutral-600"}`} />
                <span className={`font-medium ${isWinner ? "font-bold text-white" : ""}`}>
                  {team.name}
                </span>
              </div>
              {team.score !== undefined && (
                <span className={`font-mono font-bold ${isWinner ? "text-cyan-400" : "text-neutral-400"}`}>
                  {team.score}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
