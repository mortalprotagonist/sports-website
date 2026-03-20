export interface Team {
  id: string;
  name: string;
  score?: number;
  logo?: string; // fallback string
  isWinner?: boolean;
}

export interface MatchNode {
  id: string;
  title: string; // e.g., "Quarterfinal 1"
  teams: [Team, Team];
  winnerId?: string;
  nextMatchId?: string; // id of the parent node (e.g. Semifinals)
  stage: "round16" | "quarter" | "semi" | "final";
  startTime?: string;
  status: "upcoming" | "live" | "completed";
  setScores?: string[]; // Optional breakdown of sets (e.g., ["21-18", "15-21"])
}

export interface SportData {
  round16: MatchNode[];
  quarter: MatchNode[];
  semi: MatchNode[];
  final: MatchNode[];
}

export interface MultiSportData {
  badminton: SportData;
  football: SportData;
  cricket: SportData;
  volleyball: SportData;
}
