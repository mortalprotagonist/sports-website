"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { GlassCard } from "@/components/ui/glass-card";
import { useMatch } from "@/context/match-context";
import { useState } from "react";
import { MultiSportData, SportData, MatchNode } from "@/types/bracket";
import * as XLSX from "xlsx";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { mockBracket } from "@/components/bracket/mock-data";

const DEPARTMENTS = [
  "CSE", "ECE", "ME", "CE", "EEE", "IT", "BT", "AE",
  "CHEM", "AI", "DS", "IPE", "BS", "MS", "MCA", "MBA"
];

export default function AdminPage() {
  const { bracketData, updateScore, setWinner, updateTeamName, resetDatabase, isOffline, error } = useMatch();
  
  // States for the form
  const [selectedSport, setSelectedSport] = useState<keyof MultiSportData>("football");
  const [selectedStage, setSelectedStage] = useState<keyof SportData>("round16");
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");

  const sportData = bracketData[selectedSport];
  const matches = sportData ? sportData[selectedStage] : [];
  const selectedMatch = matches.find((m) => m.id === selectedMatchId);

  // Download Template Handler
  const downloadTemplate = () => {
    const headers = ["Sport", "Stage", "MatchID", "MatchTitle", "Team1", "Team2", "Score1", "Score2", "Status", "WinnerId", "NextMatchId"];
    const rows: any[] = [];

    const sports = ["football", "badminton", "cricket", "volleyball"];
    const stages = ["round16", "quarter", "semi", "final"];

    sports.forEach((sport) => {
      stages.forEach((stage) => {
        const numMatches = stage === "round16" ? 8 : stage === "quarter" ? 4 : stage === "semi" ? 2 : 1;

        for (let i = 1; i <= numMatches; i++) {
          const prefix = sport === "football" ? "foot" : sport === "badminton" ? "bad" : sport === "cricket" ? "cri" : "vol";
          const stageCode = stage === "round16" ? "r16" : stage === "quarter" ? "q" : stage === "semi" ? "semi" : "final";
          const matchId = `${prefix}-${stageCode}-${i}`;

          let nextMatchId = "";
          if (stage === "round16") nextMatchId = `${prefix}-q-${Math.ceil(i / 2)}`;
          else if (stage === "quarter") nextMatchId = `${prefix}-semi-${Math.ceil(i / 2)}`;
          else if (stage === "semi") nextMatchId = `${prefix}-final-1`;

          let title = `${stage.replace('round', 'Round of ').toUpperCase()} - Match ${i}`;
          if (stage === "final") title = `${sport.toUpperCase()} FINALS`;

          rows.push([
            sport,
            stage,
            matchId,
            title,
            "", // Team1
            "", // Team2
            "", // Score1
            "", // Score2
            "upcoming",
            "", // WinnerId
            nextMatchId
          ]);
        }
      });
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fixtures");
    XLSX.writeFile(wb, "Tournament_Fixtures_Template.xlsx");
  };

  // Upload Excel Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        // Start by completely cloning the default structural mock bracket
        const newBracket: any = JSON.parse(JSON.stringify(mockBracket));

        // Wipe all existing team data from the clone so we have a pure "TBA" skeleton
        Object.keys(newBracket).forEach((sp) => {
          Object.keys(newBracket[sp]).forEach((st) => {
            newBracket[sp][st].forEach((m: any) => {
              m.teams[0] = { ...m.teams[0], name: "TBA", score: undefined };
              m.teams[1] = { ...m.teams[1], name: "TBA", score: undefined };
              m.winnerId = undefined;
              m.status = "upcoming";
              m.setScores = undefined;
            });
          });
        });

        // Overlay the Excel data perfectly onto the matching skeleton nodes
        data.forEach((row) => {
          let Sport = row.Sport ? String(row.Sport).trim() : undefined;
          let Stage = row.Stage ? String(row.Stage).trim() : undefined;
          let MatchID = row.MatchID ? String(row.MatchID).trim() : undefined;
          let MatchTitle = row.MatchTitle ? String(row.MatchTitle).trim() : undefined;
          let Team1 = row.Team1 ? String(row.Team1).trim() : undefined;
          let Team2 = row.Team2 ? String(row.Team2).trim() : undefined;
          let Status = row.Status ? String(row.Status).trim() : undefined;
          let WinnerId = row.WinnerId ? String(row.WinnerId).trim() : undefined;
          let NextMatchId = row.NextMatchId ? String(row.NextMatchId).trim() : undefined;
          let Score1 = row.Score1;
          let Score2 = row.Score2;

          if (!Sport || !Stage || !MatchID) return;

          // Auto-correct broken prefixes from older spreadsheet templates
          MatchID = MatchID.replace("badm-", "bad-").replace("cric-", "cri-").replace("voll-", "vol-");
          if (WinnerId) WinnerId = WinnerId.replace("badm-", "bad-").replace("cric-", "cri-").replace("voll-", "vol-");
          if (NextMatchId) NextMatchId = NextMatchId.replace("badm-", "bad-").replace("cric-", "cri-").replace("voll-", "vol-");

          if (newBracket[Sport] && newBracket[Sport][Stage]) {
            const matchIndex = newBracket[Sport][Stage].findIndex((m: any) => m.id === MatchID);
            
            if (matchIndex !== -1) {
              const match = newBracket[Sport][Stage][matchIndex];
              if (MatchTitle) match.title = MatchTitle;
              if (Team1) match.teams[0].name = Team1;
              if (Team2) match.teams[1].name = Team2;
              if (Score1 !== undefined && Score1 !== "") match.teams[0].score = Number(Score1);
              if (Score2 !== undefined && Score2 !== "") match.teams[1].score = Number(Score2);
              if (Status) match.status = Status;
              if (WinnerId) match.winnerId = WinnerId;
              if (NextMatchId) match.nextMatchId = NextMatchId;
            } else {
              // Custom node fallback
              newBracket[Sport][Stage].push({
                id: MatchID,
                title: MatchTitle || `Match ${MatchID}`,
                teams: [
                  { id: `${MatchID}-t1`, name: Team1 || "TBA", score: Score1 !== undefined ? Number(Score1) : undefined },
                  { id: `${MatchID}-t2`, name: Team2 || "TBA", score: Score2 !== undefined ? Number(Score2) : undefined }
                ],
                stage: Stage,
                status: Status || "upcoming",
                winnerId: WinnerId || undefined,
                nextMatchId: NextMatchId || undefined
              });
            }
          }
        });

        // Push to Firestore and reload via onSnapshot
        const cleanBracket = JSON.parse(JSON.stringify(newBracket));
        await setDoc(doc(db, "tournaments", "main"), cleanBracket);
        alert("✅ Fixtures uploaded and synced successfully to Cloud!");
      } catch (err: any) {
        alert(`❌ Upload Failed: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-neutral-900/40 p-5 rounded-2xl border border-neutral-800 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Admin Control</h1>
            <p className="text-neutral-400 text-xs mt-1">Manage live scores, advance teams, or upload bulk fixtures.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={downloadTemplate}
              className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            >
              📥 Template
            </button>
            <label className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all">
              📤 Upload Excel
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                onChange={handleFileUpload} 
                onClick={(e) => (e.currentTarget.value = "")}
              />
            </label>
            <button 
              onClick={async () => {
                if (confirm("⚠️ RESET ALL SPORTS DATA?\nThis will erase all live scores and restore initial department matchups!")) {
                  try {
                     await resetDatabase();
                     alert("✅ Reset Successful! Reloading fixtures.");
                  } catch (err: any) {
                     alert(`❌ Reset Failed: ${err.message}`);
                  }
                }
              }}
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            >
              Reset
            </button>
          </div>
        </header>

        {isOffline && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
            ⚠️ Running in **LOCAL MOCK mode**: Your `.env.local` keys were not detected. Updates will be lost on refresh! Please **Restart your Terminal/Server** so Next.js reads your environment variables.
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Match Selector */}
          <GlassCard className="md:col-span-1 border-cyan-500/10 h-fit">
            <h2 className="text-lg font-bold mb-4">Select Match</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Sport</label>
                <select
                  value={selectedSport}
                  onChange={(e) => {
                    setSelectedSport(e.target.value as keyof MultiSportData);
                    setSelectedMatchId(""); // Reset match
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="football">Football</option>
                  <option value="badminton">Badminton</option>
                  <option value="cricket">Cricket</option>
                  <option value="volleyball">Volleyball</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">Stage</label>
                <select
                  value={selectedStage}
                  onChange={(e) => {
                    setSelectedStage(e.target.value as keyof SportData);
                    setSelectedMatchId(""); // Reset match
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="round16">Round of 16</option>
                  <option value="quarter">Quarterfinals</option>
                  <option value="semi">Semifinals</option>
                  <option value="final">Finals</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">Match</label>
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Select a Match --</option>
                  {matches.map((match) => (
                    <option key={match.id} value={match.id}>
                      {match.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </GlassCard>

          {/* Score Updater */}
          <GlassCard className="md:col-span-2 border-emerald-500/10">
            <h2 className="text-lg font-bold mb-4">Update Details</h2>
            {!selectedMatch ? (
              <p className="text-neutral-500 text-sm">Please select a match to view controls.</p>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded font-semibold capitalize">
                    {selectedSport} | {selectedStage.replace('round', 'Round of ')}
                  </p>
                  <p className="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded font-semibold">
                    Status: {selectedMatch.status.toUpperCase()}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedMatch.teams.map((team, idx) => (
                    <div key={team.id || idx} className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-1">
                          Team Name
                        </label>
                        <select
                          value={team.name}
                          onChange={(e) =>
                            updateTeamName(selectedSport, selectedStage, selectedMatch.id, idx as 0 | 1, e.target.value)
                          }
                          className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-1.5 text-white text-sm font-bold focus:outline-none focus:border-cyan-500"
                        >
                          {/* If team name is TBA, Winner M1, etc., render it as an option instead of falling back to CSE */}
                          {!DEPARTMENTS.includes(team.name) && (
                            <option value={team.name}>{team.name}</option>
                          )}
                          
                          {DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-1">
                          Current Score
                        </label>
                        <input
                          type="number"
                          placeholder="Score"
                          value={team.score ?? ""}
                          onChange={(e) =>
                            updateScore(selectedSport, selectedStage, selectedMatch.id, idx as 0 | 1, Number(e.target.value))
                          }
                          className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-1.5 text-white text-lg font-bold font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <button
                        onClick={() => setWinner(selectedSport, selectedStage, selectedMatch.id, team.id)}
                        className={`w-full mt-2 py-2 rounded-xl text-xs font-bold transition-all ${
                          selectedMatch.winnerId === team.id
                            ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                            : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                        }`}
                      >
                        {selectedMatch.winnerId === team.id ? "Winner declared" : "Set as Winner"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
