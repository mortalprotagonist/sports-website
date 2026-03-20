import { MultiSportData, MatchNode } from "@/types/bracket";

// Helper to keep the code compact while allowing full static definitions
const createMatch = (id: string, title: string, team1: string, team2: string, score1?: number, score2?: number, winnerId?: string, nextMatchId?: string, isCompleted = false): MatchNode => ({
  id,
  title,
  teams: [
    { id: `${id}-t1`, name: team1, score: score1 },
    { id: `${id}-t2`, name: team2, score: score2 }
  ],
  stage: id.includes("r16") ? "round16" : id.includes("-q-") ? "quarter" : id.includes("-semi-") ? "semi" : "final",
  status: isCompleted ? "completed" : score1 !== undefined ? "live" : "upcoming",
  winnerId,
  nextMatchId
});

export const mockBracket: MultiSportData = {
  // FOOTBALL
  football: {
    round16: [
      createMatch("foot-r16-1", "Round of 16 - M1", "CSE", "ECE", undefined, undefined, undefined, "foot-q-1"),
      createMatch("foot-r16-2", "Round of 16 - M2", "ME", "CE", undefined, undefined, undefined, "foot-q-1"),
      createMatch("foot-r16-3", "Round of 16 - M3", "EEE", "IT", undefined, undefined, undefined, "foot-q-2"),
      createMatch("foot-r16-4", "Round of 16 - M4", "BT", "AE", undefined, undefined, undefined, "foot-q-2"),
      createMatch("foot-r16-5", "Round of 16 - M5", "CHEM", "AI", undefined, undefined, undefined, "foot-q-3"),
      createMatch("foot-r16-6", "Round of 16 - M6", "DS", "IPE", undefined, undefined, undefined, "foot-q-3"),
      createMatch("foot-r16-7", "Round of 16 - M7", "BS", "MS", undefined, undefined, undefined, "foot-q-4"),
      createMatch("foot-r16-8", "Round of 16 - M8", "MCA", "MBA", undefined, undefined, undefined, "foot-q-4")
    ],
    quarter: [
      createMatch("foot-q-1", "Quarterfinal 1", "Winner M1", "Winner M2", undefined, undefined, undefined, "foot-semi-1"),
      createMatch("foot-q-2", "Quarterfinal 2", "Winner M3", "Winner M4", undefined, undefined, undefined, "foot-semi-1"),
      createMatch("foot-q-3", "Quarterfinal 3", "Winner M5", "Winner M6", undefined, undefined, undefined, "foot-semi-2"),
      createMatch("foot-q-4", "Quarterfinal 4", "Winner M7", "Winner M8", undefined, undefined, undefined, "foot-semi-2")
    ],
    semi: [
      createMatch("foot-semi-1", "Semifinal 1", "Winner Q1", "Winner Q2", undefined, undefined, undefined, "foot-final-1"),
      createMatch("foot-semi-2", "Semifinal 2", "Winner Q3", "Winner Q4", undefined, undefined, undefined, "foot-final-1")
    ],
    final: [
      createMatch("foot-final-1", "Grand Finals", "Winner S1", "Winner S2")
    ]
  },

  // CRICKET
  cricket: {
    round16: [
      createMatch("cri-r16-1", "Round of 16 - M1", "CSE", "ECE", 120, 115, "cri-r16-1-t1", "cri-q-1", true),
      createMatch("cri-r16-2", "Round of 16 - M2", "ME", "CE", 90, 92, "cri-r16-2-t2", "cri-q-1", true),
      createMatch("cri-r16-3", "Round of 16 - M3", "EEE", "IT", 145, 140, "cri-r16-3-t1", "cri-q-2", true),
      createMatch("cri-r16-4", "Round of 16 - M4", "BT", "AE", 80, 78, "cri-r16-4-t1", "cri-q-2", true),
      createMatch("cri-r16-5", "Round of 16 - M5", "CHEM", "AI", 110, 112, "cri-r16-5-t2", "cri-q-3", true),
      createMatch("cri-r16-6", "Round of 16 - M6", "DS", "IPE", 130, 125, "cri-r16-6-t1", "cri-q-3", true),
      createMatch("cri-r16-7", "Round of 16 - M7", "BS", "MS", 95, 100, "cri-r16-7-t2", "cri-q-4", true),
      createMatch("cri-r16-8", "Round of 16 - M8", "MCA", "MBA", 115, 110, "cri-r16-8-t1", "cri-q-4", true)
    ], 
    quarter: [
      createMatch("cri-q-1", "Quarterfinal 1", "CSE", "CE", 112, 108, "cri-q-1-t1", "cri-semi-1", true),
      createMatch("cri-q-2", "Quarterfinal 2", "EEE", "BT", 88, 92, "cri-q-2-t2", "cri-semi-1", true),
      createMatch("cri-q-3", "Quarterfinal 3", "AI", "DS", 140, 142, "cri-q-3-t2", "cri-semi-2", true),
      createMatch("cri-q-4", "Quarterfinal 4", "MS", "MCA", 74, 73, "cri-q-4-t1", "cri-semi-2", true)
    ],
    semi: [
      createMatch("cri-semi-1", "Semifinal 1", "CSE", "BT", 125, 120, "cri-semi-1-t1", "cri-final-1", true),
      createMatch("cri-semi-2", "Semifinal 2", "DS", "MS", 95, 110, "cri-semi-2-t2", "cri-final-1", true)
    ],
    final: [
      createMatch("cri-final-1", "Grand Finals", "CSE", "MS", 150, 148, "cri-final-1-t1", undefined, true)
    ]
  },

  // BADMINTON
  badminton: {
    round16: [
      createMatch("bad-r16-1", "Round of 16 - M1", "CSE", "ECE", 21, 18, "bad-r16-1-t1", "bad-q-1", true),
      createMatch("bad-r16-2", "Round of 16 - M2", "ME", "CE", 15, 21, "bad-r16-2-t2", "bad-q-1", true),
      createMatch("bad-r16-3", "Round of 16 - M3", "EEE", "IT", 21, 19, "bad-r16-3-t1", "bad-q-2", true),
      createMatch("bad-r16-4", "Round of 16 - M4", "BT", "AE", 20, 22, "bad-r16-4-t2", "bad-q-2", true),
      createMatch("bad-r16-5", "Round of 16 - M5", "CHEM", "AI", undefined, undefined, undefined, "bad-q-3"),
      createMatch("bad-r16-6", "Round of 16 - M6", "DS", "IPE", undefined, undefined, undefined, "bad-q-3"),
      createMatch("bad-r16-7", "Round of 16 - M7", "BS", "MS", undefined, undefined, undefined, "bad-q-4"),
      createMatch("bad-r16-8", "Round of 16 - M8", "MCA", "MBA", undefined, undefined, undefined, "bad-q-4")
    ],
    quarter: [
      createMatch("bad-q-1", "Quarterfinal 1", "CSE", "CE", undefined, undefined, undefined, "bad-semi-1"),
      createMatch("bad-q-2", "Quarterfinal 2", "EEE", "AE", undefined, undefined, undefined, "bad-semi-1"),
      createMatch("bad-q-3", "Quarterfinal 3", "Winner M5", "Winner M6", undefined, undefined, undefined, "bad-semi-2"),
      createMatch("bad-q-4", "Quarterfinal 4", "Winner M7", "Winner M8", undefined, undefined, undefined, "bad-semi-2")
    ],
    semi: [
      createMatch("bad-semi-1", "Semifinal 1", "Winner Q1", "Winner Q2", undefined, undefined, undefined, "bad-final-1"),
      createMatch("bad-semi-2", "Semifinal 2", "Winner Q3", "Winner Q4", undefined, undefined, undefined, "bad-final-1")
    ],
    final: [
      createMatch("bad-final-1", "Grand Finals", "Winner S1", "Winner S2")
    ]
  },

  // VOLLEYBALL
  volleyball: {
    round16: [
      createMatch("vol-r16-1", "Round of 16 - M1", "CSE", "ECE", undefined, undefined, undefined, "vol-q-1"),
      createMatch("vol-r16-2", "Round of 16 - M2", "ME", "CE", undefined, undefined, undefined, "vol-q-1"),
      createMatch("vol-r16-3", "Round of 16 - M3", "EEE", "IT", undefined, undefined, undefined, "vol-q-2"),
      createMatch("vol-r16-4", "Round of 16 - M4", "BT", "AE", undefined, undefined, undefined, "vol-q-2"),
      createMatch("vol-r16-5", "Round of 16 - M5", "CHEM", "AI", undefined, undefined, undefined, "vol-q-3"),
      createMatch("vol-r16-6", "Round of 16 - M6", "DS", "IPE", undefined, undefined, undefined, "vol-q-3"),
      createMatch("vol-r16-7", "Round of 16 - M7", "BS", "MS", undefined, undefined, undefined, "vol-q-4"),
      createMatch("vol-r16-8", "Round of 16 - M8", "MCA", "MBA", undefined, undefined, undefined, "vol-q-4")
    ],
    quarter: [
      createMatch("vol-q-1", "Quarterfinal 1", "Winner M1", "Winner M2", undefined, undefined, undefined, "vol-semi-1"),
      createMatch("vol-q-2", "Quarterfinal 2", "Winner M3", "Winner M4", undefined, undefined, undefined, "vol-semi-1"),
      createMatch("vol-q-3", "Quarterfinal 3", "Winner M5", "Winner M6", undefined, undefined, undefined, "vol-semi-2"),
      createMatch("vol-q-4", "Quarterfinal 4", "Winner M7", "Winner M8", undefined, undefined, undefined, "vol-semi-2")
    ],
    semi: [
      createMatch("vol-semi-1", "Semifinal 1", "Winner Q1", "Winner Q2", undefined, undefined, undefined, "vol-final-1"),
      createMatch("vol-semi-2", "Semifinal 2", "Winner Q3", "Winner Q4", undefined, undefined, undefined, "vol-final-1")
    ],
    final: [
      createMatch("vol-final-1", "Volleyball Finals", "Winner S1", "Winner S2")
    ]
  }
};
