"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { MultiSportData, SportData, MatchNode } from "@/types/bracket";
import { mockBracket } from "@/components/bracket/mock-data";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";

interface MatchContextType {
  bracketData: MultiSportData;
  error?: string | null;
  isOffline: boolean; 
  selectedSport: keyof MultiSportData;
  setSelectedSport: (sport: keyof MultiSportData) => void;
  updateScore: (sport: keyof MultiSportData, stage: keyof SportData, matchId: string, teamIdx: 0 | 1, score: number) => void;
  setWinner: (sport: keyof MultiSportData, stage: keyof SportData, matchId: string, winnerId: string) => void;
  updateTeamName: (sport: keyof MultiSportData, stage: keyof SportData, matchId: string, teamIdx: 0 | 1, name: string) => void;
  resetDatabase: () => Promise<void>;
  syncUmpireScore: (sport: keyof MultiSportData, stage: keyof SportData, matchId: string, score1: number, score2: number, winnerId?: string, setScores?: string[]) => Promise<void>;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export function MatchProvider({ children }: { children: ReactNode }) {
  const [bracketData, setBracketData] = useState<MultiSportData>(mockBracket);
  const [selectedSport, setSelectedSport] = useState<keyof MultiSportData>("football");
  const [error, setError] = useState<string | null>(null);
  const [isOffline] = useState(!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

  // Firebase Real-time Listener
  useEffect(() => {
    if (isOffline) {
      console.warn("Firebase config missing. Running in LOCAL MOCK mode.");
      return;
    }

    const unsub = onSnapshot(
      doc(db, "tournaments", "main"), 
      (docSnap) => {


        if (docSnap.exists()) {
          const cloudData = docSnap.data() as MultiSportData;
          const merged: MultiSportData = { ...mockBracket };

          ["football", "badminton", "cricket", "volleyball"].forEach((s) => {
            const sport = s as keyof MultiSportData;
            if (cloudData[sport]) {
              merged[sport] = { ...mockBracket[sport] }; // start with mock values

              ["round16", "quarter", "semi", "final"].forEach((st) => {
                const stage = st as keyof SportData;
                const cloudStage = cloudData[sport][stage];
                if (cloudStage && Array.isArray(cloudStage) && cloudStage.length > 0) {
                  merged[sport][stage] = cloudStage as any;
                }
              });
            }
          });

          setBracketData(merged);
          setError(null);
        } else {
          setDoc(doc(db, "tournaments", "main"), mockBracket);
        }
      },
      (err) => {
        console.error("Firestore Listen Error:", err);
        setError(`Firestore Error: ${err.message}`);
      }
    );

    return () => unsub();
  }, [isOffline]);

  const updateScore = async (sport: keyof MultiSportData, stage: keyof SportData, matchId: string, teamIdx: 0 | 1, score: number) => {
    let updatedStage: MatchNode[] = [];
    setBracketData((prev) => {
      const sportData = prev[sport];
      if (!sportData) return prev;
      updatedStage = (sportData[stage] || []).map((match) => {
        if (match.id === matchId) {
          const updatedTeams = [...match.teams] as [any, any];
          updatedTeams[teamIdx] = { ...updatedTeams[teamIdx], score };
          return { ...match, teams: updatedTeams, status: "live" as any };
        }
        return match;
      });
      return { ...prev, [sport]: { ...sportData, [stage]: updatedStage } };
    });

    if (!isOffline) {
      try {
        await updateDoc(doc(db, "tournaments", "main"), {
          [`${sport}.${stage}`]: JSON.parse(JSON.stringify(updatedStage))
        });
      } catch (err: any) {
        setError(`Update Failed: ${err.message}`);
      }
    }
  };

  const setWinner = async (sport: keyof MultiSportData, stage: keyof SportData, matchId: string, winnerId: string) => {
    let updatedStage: MatchNode[] = [];
    let nextStageUpdated: MatchNode[] = [];
    let nextStage: string | undefined;

    setBracketData((prev) => {
      const sportData = { ...prev[sport] };
      if (!sportData[stage]) return prev;

      const currentMatch = sportData[stage].find((m) => m.id === matchId);
      const winnerTeam = currentMatch?.teams.find((t) => t.id === winnerId);
      const winnerName = winnerTeam?.name;
      const nextMatchId = currentMatch?.nextMatchId;

      updatedStage = sportData[stage].map((match) => {
        if (match.id === matchId) return { ...match, winnerId, status: "completed" as any };
        return match;
      });
      sportData[stage] = updatedStage;

      if (nextMatchId && winnerName) {
        nextStage = stage === "round16" ? "quarter" : stage === "quarter" ? "semi" : "final";
        const stageKey = nextStage as keyof SportData;

        if (sportData[stageKey]) {
          const matchNum = parseInt(matchId.split('-').pop() || "1");
          const targetIdx = matchNum % 2 !== 0 ? 0 : 1;

          nextStageUpdated = (sportData[stageKey] as MatchNode[]).map((match) => {
            if (match.id === nextMatchId) {
              const updatedTeams = [...match.teams] as [any, any];
              updatedTeams[targetIdx] = { ...updatedTeams[targetIdx], name: winnerName };
              return { ...match, teams: updatedTeams };
            }
            return match;
          });
          sportData[stageKey] = nextStageUpdated;
        }
      }

      return { ...prev, [sport]: sportData };
    });

    if (!isOffline) {
      try {
        const payload: any = {};
        payload[`${sport}.${stage}`] = JSON.parse(JSON.stringify(updatedStage));
        if (nextStage && nextStageUpdated.length > 0) {
          payload[`${sport}.${nextStage}`] = JSON.parse(JSON.stringify(nextStageUpdated));
        }
        await updateDoc(doc(db, "tournaments", "main"), payload);
      } catch (err: any) {
        setError(`Update Failed: ${err.message}`);
      }
    }
  };

  const updateTeamName = async (sport: keyof MultiSportData, stage: keyof SportData, matchId: string, teamIdx: 0 | 1, name: string) => {
    let updatedStage: MatchNode[] = [];
    setBracketData((prev) => {
      const sportData = prev[sport];
      if (!sportData) return prev;
      updatedStage = (sportData[stage] || []).map((match) => {
        if (match.id === matchId) {
          const updatedTeams = [...match.teams] as [any, any];
          updatedTeams[teamIdx] = { ...updatedTeams[teamIdx], name };
          return { ...match, teams: updatedTeams };
        }
        return match;
      });
      return { ...prev, [sport]: { ...sportData, [stage]: updatedStage } };
    });

    if (!isOffline) {
      try {
        await updateDoc(doc(db, "tournaments", "main"), {
          [`${sport}.${stage}`]: JSON.parse(JSON.stringify(updatedStage))
        });
      } catch (err: any) {
        setError(`Update Failed: ${err.message}`);
      }
    }
  };

  const syncUmpireScore = async (sport: keyof MultiSportData, stage: keyof SportData, matchId: string, score1: number, score2: number, winnerId?: string, setScores?: string[]) => {
    let updatedStage: MatchNode[] = [];
    let nextStageUpdated: MatchNode[] = [];
    let nextStage: string | undefined;

    setBracketData((prev) => {
      const sportData = { ...prev[sport] };
      if (!sportData[stage]) return prev;

      let nextMatchId: string | undefined;
      let winnerName: string | undefined;

      updatedStage = sportData[stage].map((match) => {
        if (match.id === matchId) {
          const updatedTeams = [...match.teams] as [any, any];
          updatedTeams[0] = { ...updatedTeams[0], score: score1 };
          updatedTeams[1] = { ...updatedTeams[1], score: score2 };
          
          nextMatchId = match.nextMatchId;
          const isOdd = parseInt(matchId.split('-').pop() || "1") % 2 !== 0; 
          
          if (winnerId) {
             winnerName = updatedTeams[winnerId.endsWith('-t1') ? 0 : 1]?.name;
          }

          return { 
            ...match, 
            teams: updatedTeams, 
            status: winnerId ? "completed" : "live", 
            winnerId: winnerId || match.winnerId,
            setScores: setScores || match.setScores 
          };
        }
        return match;
      });
      sportData[stage] = updatedStage;

      if (winnerId && nextMatchId && winnerName) {
        nextStage = stage === "round16" ? "quarter" : stage === "quarter" ? "semi" : "final";
        const stageKey = nextStage as keyof SportData;

        if (sportData[stageKey]) {
          const matchNum = parseInt(matchId.split('-').pop() || "1");
          const targetIdx = matchNum % 2 !== 0 ? 0 : 1;

          nextStageUpdated = (sportData[stageKey] as MatchNode[]).map((match) => {
            if (match.id === nextMatchId) {
              const updatedTeams = [...match.teams] as [any, any];
              updatedTeams[targetIdx] = { ...updatedTeams[targetIdx], name: winnerName };
              return { ...match, teams: updatedTeams };
            }
            return match;
          });
          sportData[stageKey] = nextStageUpdated;
        }
      }

      return { ...prev, [sport]: sportData };
    });

    if (!isOffline) {
      try {
        const payload: any = {};
        payload[`${sport}.${stage}`] = JSON.parse(JSON.stringify(updatedStage));
        if (nextStage && nextStageUpdated.length > 0) {
          payload[`${sport}.${nextStage}`] = JSON.parse(JSON.stringify(nextStageUpdated));
        }
        await updateDoc(doc(db, "tournaments", "main"), payload);
      } catch (err: any) {
        setError(`Sync Failed: ${err.message}`);
      }
    }
  };

  const resetDatabase = async () => {
    const cleanData = JSON.parse(JSON.stringify(mockBracket));
    setBracketData(cleanData); // Force re-render with fresh reference
    if (!isOffline) {
      try { 
        await setDoc(doc(db, "tournaments", "main"), cleanData); 
        setError(null); 
      } catch (err: any) { 
        setError(`Reset Failed: ${err.message}`); 
        throw err; 
      }
    }
  };

  return (
    <MatchContext.Provider value={{ bracketData, error, isOffline, selectedSport, setSelectedSport, updateScore, setWinner, updateTeamName, resetDatabase, syncUmpireScore }}>
      {children}
    </MatchContext.Provider>
  );
}

export const useMatch = () => {
  const context = useContext(MatchContext);
  if (!context) throw new Error("useMatch must be used within MatchProvider");
  return context;
};
