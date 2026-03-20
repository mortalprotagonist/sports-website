"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { GlassCard } from "@/components/ui/glass-card";
import { useState, useEffect } from "react";
import { Trophy, RefreshCw, Undo, ShieldAlert, CloudLightning } from "lucide-react";
import { useMatch } from "@/context/match-context";
import { SportData } from "@/types/bracket";

type TieKey = "S1" | "D" | "S2";

export default function BadmintonScoreboard() {
  const { bracketData, syncUmpireScore } = useMatch();

  // 1. Selector States
  const [selectedStage, setSelectedStage] = useState<keyof SportData>("round16");
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");

  const matches = bracketData.badminton?.[selectedStage] || [];
  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  // 2. Tie and Scoreboard States
  const [teamA, setTeamA] = useState("Team A");
  const [teamB, setTeamB] = useState("Team B");
  const [activeTie, setActiveTie] = useState<TieKey>("S1");
  const [targetPoints, setTargetPoints] = useState<15 | 21>(21);

  const [scores, setScores] = useState<Record<TieKey, { scoreA: number; scoreB: number; sets: { a: number; b: number }[] }>>({
    S1: { scoreA: 0, scoreB: 0, sets: [] },
    D:  { scoreA: 0, scoreB: 0, sets: [] },
    S2: { scoreA: 0, scoreB: 0, sets: [] }
  });

  const [serving, setServing] = useState<"A" | "B">("A");
  const [history, setHistory] = useState<{ activeTie: TieKey; scores: any; serving: "A" | "B" }[]>([]);

  // Update names if match is selected
  useEffect(() => {
    if (selectedMatch) {
      setTeamA(selectedMatch.teams?.[0]?.name || "TBA");
      setTeamB(selectedMatch.teams?.[1]?.name || "TBA");
      
      setScores({ S1: { scoreA: 0, scoreB: 0, sets: [] }, D: { scoreA: 0, scoreB: 0, sets: [] }, S2: { scoreA: 0, scoreB: 0, sets: [] } });
      setHistory([]);
    }
  }, [selectedMatchId]);

  const currentTie = scores[activeTie];
  const scoreA = currentTie.scoreA;
  const scoreB = currentTie.scoreB;

  // Calculate tie wins
  const s1WonA = scores.S1.sets.filter(s => s.a > s.b).length >= 2;
  const s1WonB = scores.S1.sets.filter(s => s.b > s.a).length >= 2;

  const dWonA = scores.D.sets.filter(s => s.a > s.b).length >= 2;
  const dWonB = scores.D.sets.filter(s => s.b > s.a).length >= 2;

  const s2WonA = scores.S2.sets.filter(s => s.a > s.b).length >= 2;
  const s2WonB = scores.S2.sets.filter(s => s.b > s.a).length >= 2;

  const tiesWonA = (s1WonA ? 1 : 0) + (dWonA ? 1 : 0) + (s2WonA ? 1 : 0);
  const tiesWonB = (s1WonB ? 1 : 0) + (dWonB ? 1 : 0) + (s2WonB ? 1 : 0);

  const matchWinner = tiesWonA >= 2 ? "A" : tiesWonB >= 2 ? "B" : null;

  const isGamePoint = (scoreA >= targetPoints - 1 || scoreB >= targetPoints - 1) && Math.abs(scoreA - scoreB) >= 1;
  const isDeuce = scoreA >= targetPoints - 1 && scoreB >= targetPoints - 1 && scoreA === scoreB;

  // Sync to database internally or manually
  const pushToFirestore = async (overrideScores?: typeof scores) => {
    if (!selectedMatchId) return;

    const useScores = overrideScores || scores;
    const finalS1WonA = useScores.S1.sets.filter(s => s.a > s.b).length >= 2;
    const finalS1WonB = useScores.S1.sets.filter(s => s.b > s.a).length >= 2;
    
    const finalDWonA = useScores.D.sets.filter(s => s.a > s.b).length >= 2;
    const finalDWonB = useScores.D.sets.filter(s => s.b > s.a).length >= 2;
    
    const finalS2WonA = useScores.S2.sets.filter(s => s.a > s.b).length >= 2;
    const finalS2WonB = useScores.S2.sets.filter(s => s.b > s.a).length >= 2;

    const currentTiesWonA = (finalS1WonA ? 1 : 0) + (finalDWonA ? 1 : 0) + (finalS2WonA ? 1 : 0);
    const currentTiesWonB = (finalS1WonB ? 1 : 0) + (finalDWonB ? 1 : 0) + (finalS2WonB ? 1 : 0);
    const currentWinnerId = currentTiesWonA >= 2 ? `${selectedMatchId}-t1` : currentTiesWonB >= 2 ? `${selectedMatchId}-t2` : undefined;

    const setStrings: string[] = [];
    if (useScores.S1.sets.length > 0) setStrings.push(`S1: ${useScores.S1.sets.map(s => `${s.a}-${s.b}`).join(', ')}`);
    if (useScores.D.sets.length > 0) setStrings.push(`D: ${useScores.D.sets.map(s => `${s.a}-${s.b}`).join(', ')}`);
    if (useScores.S2.sets.length > 0) setStrings.push(`S2: ${useScores.S2.sets.map(s => `${s.a}-${s.b}`).join(', ')}`);

    try {
      await syncUmpireScore("badminton", selectedStage, selectedMatchId, currentTiesWonA, currentTiesWonB, currentWinnerId, setStrings);
    } catch (err) {
      console.error("AutoSync Failed", err);
    }
  };

  const addPoint = async (player: "A" | "B") => {
    if (matchWinner) return; // Overall Over!

    const tieWinner = scores[activeTie].sets.filter(s => s.a > s.b).length >= 2 || scores[activeTie].sets.filter(s => s.b > s.a).length >= 2;
    if (tieWinner) return; // Sub format over!

    setHistory([...history, { activeTie, scores: JSON.parse(JSON.stringify(scores)), serving }]);

    const nextScoreA = player === "A" ? scoreA + 1 : scoreA;
    const nextScoreB = player === "B" ? scoreB + 1 : scoreB;

    let updatedSets = [...scores[activeTie].sets];
    let finalScoreA = nextScoreA;
    let finalScoreB = nextScoreB;

    if (player === "A") {
      setServing("A");
      if ((nextScoreA >= targetPoints && nextScoreA - scoreB >= 2) || nextScoreA === 30) {
        updatedSets.push({ a: nextScoreA, b: scoreB });
        finalScoreA = 0; finalScoreB = 0;
      }
    } else {
      setServing("B");
      if ((nextScoreB >= targetPoints && nextScoreB - scoreA >= 2) || nextScoreB === 30) {
        updatedSets.push({ a: scoreA, b: nextScoreB });
        finalScoreA = 0; finalScoreB = 0;
      }
    }

    const updatedScores = {
      ...scores,
      [activeTie]: { scoreA: finalScoreA, scoreB: finalScoreB, sets: updatedSets }
    };

    setScores(updatedScores);
    await pushToFirestore(updatedScores); // Auto Push
  };

  const undo = async () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setScores(last.scores);
    setServing(last.serving);
    setActiveTie(last.activeTie);
    setHistory(history.slice(0, -1));
    await pushToFirestore(last.scores); // Auto Push for Undo layout fixes too
  };

  const serverScore = serving === "A" ? scoreA : scoreB;
  const serveSide = serverScore % 2 === 0 ? "RIGHT" : "LEFT";

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto h-full">
        {/* Match Selector Bar */}
        <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2 items-center">
            <select 
              value={selectedStage} 
              onChange={(e) => { setSelectedStage(e.target.value as any); setSelectedMatchId(""); }}
              className="bg-black border border-neutral-800 rounded-xl px-3 py-1.5 text-white text-xs font-bold"
            >
              <option value="round16">Round of 16</option>
              <option value="quarter">Quarterfinals</option>
              <option value="semi">Semifinals</option>
              <option value="final">Finals</option>
            </select>
            <select 
              value={selectedMatchId} 
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="bg-black border border-neutral-800 rounded-xl px-3 py-1.5 text-white text-xs font-bold min-w-[200px]"
            >
              <option value="">-- Select Match --</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.teams?.[0]?.name || "TBA"} vs {m.teams?.[1]?.name || "TBA"}) {m.status === "completed" ? "✅ [FINISHED]" : ""}
                </option>
              ))}
            </select>

            <select 
              value={targetPoints} 
              onChange={(e) => setTargetPoints(Number(e.target.value) as 15 | 21)}
              className="bg-black border border-neutral-800 rounded-xl px-3 py-1.5 text-white text-xs font-bold"
            >
              <option value="21">21 Pts</option>
              <option value="15">15 Pts</option>
            </select>
          </div>

          {/* Sub-Match Toggle Bar */}
          <div className="flex gap-1 bg-neutral-950 border border-neutral-800 p-1 rounded-xl">
            {(["S1", "D", "S2"] as TieKey[]).map((tie) => {
              const tieWon = scores[tie].sets.filter(s => s.a > s.b).length >= 2 || scores[tie].sets.filter(s => s.b > s.a).length >= 2;
              return (
                <button 
                  key={tie}
                  onClick={() => setActiveTie(tie)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${activeTie === tie ? "bg-cyan-500 text-black shadow-lg" : "text-neutral-500 hover:text-white"} ${tieWon ? "line-through opacity-70" : ""}`}
                >
                  {tie === "S1" ? "Singles 1" : tie === "D" ? "Doubles" : "Singles 2"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Header toolbar */}
        <header className="flex justify-between items-center bg-neutral-900/40 p-4 rounded-2xl border border-neutral-800">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-cyan-500" />
            <div>
              <h1 className="text-sm font-extrabold tracking-tight uppercase">Scoreboard</h1>
              <p className="text-[10px] text-neutral-400">Point-by-point live sync enableds</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={undo} disabled={history.length === 0} className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white p-2 rounded-xl border border-white/5">
              <Undo className="h-4 w-4" />
            </button>
            <button onClick={() => { setScores({ S1: { scoreA: 0, scoreB: 0, sets: [] }, D: { scoreA: 0, scoreB: 0, sets: [] }, S2: { scoreA: 0, scoreB: 0, sets: [] } }); setHistory([]); }} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 p-2 rounded-xl">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Overall Matches Won Tie Break layout */}
        <GlassCard className="border-neutral-800 p-4 h-fit flex flex-col items-center justify-center gap-2">
          <div className="flex gap-4 items-center">
            <span className="text-neutral-400 text-xs font-bold uppercase">Matches Won:</span>
            <span className="text-3xl font-black font-mono text-cyan-400">{tiesWonA}</span>
            <span className="text-xl font-black font-mono text-neutral-500">-</span>
            <span className="text-3xl font-black font-mono text-emerald-400">{tiesWonB}</span>
          </div>
          {matchWinner && (
            <div className="text-xs font-extrabold uppercase bg-cyan-500 text-black px-4 py-1 rounded-full animate-bounce mt-1">
              🏆 {matchWinner === "A" ? teamA : teamB} WINS TEAM TIE!
            </div>
          )}
          
          {/* Sets Breakdown representing ties */}
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {(["S1", "D", "S2"] as TieKey[]).map((tie) => (
              scores[tie].sets.length > 0 && (
                <div key={tie} className="bg-black/40 border border-neutral-800 px-3 py-1 rounded-xl font-mono text-[10px] flex items-center gap-1">
                  <span className="text-neutral-500">{tie}:</span>
                  {scores[tie].sets.map((set, i) => (
                    <span key={i} className={`${set.a > set.b ? "text-cyan-400" : "text-emerald-400"}`}>
                      {set.a}-{set.b}{i < scores[tie].sets.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
              )
            ))}
          </div>
        </GlassCard>

        {/* Scoreboard Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 h-full items-stretch">
          {/* Team A */}
          <div className={`relative flex flex-col justify-center items-center rounded-3xl border ${serving === "A" ? "border-cyan-500 bg-cyan-500/5" : "border-neutral-900 bg-neutral-900/30"} p-8 transition-all`}>
            <span className="text-center text-xl font-bold text-white mb-6">{teamA}</span>
            <button onClick={() => addPoint("A")} disabled={!!matchWinner} className="group flex flex-col items-center justify-center w-full flex-1 touch-manipulation disabled:opacity-40">
              <span className="text-7xl md:text-9xl font-extrabold font-mono text-cyan-400 group-active:scale-95 transition-transform duration-100">
                {scoreA}
              </span>
              {!matchWinner && <span className="text-xs text-neutral-500 mt-4 group-hover:text-cyan-300">Tap to add point</span>}
            </button>
            {serving === "A" && !matchWinner && (
              <div className="absolute inset-x-0 bottom-4 flex justify-center">
                <span className="bg-cyan-500 text-black text-xs font-extrabold px-3 py-1 rounded-full animate-pulse">SERVING ({serveSide} COURT)</span>
              </div>
            )}
          </div>

          {/* Team B */}
          <div className={`relative flex flex-col justify-center items-center rounded-3xl border ${serving === "B" ? "border-emerald-500 bg-emerald-500/5" : "border-neutral-900 bg-neutral-900/30"} p-8 transition-all`}>
            <span className="text-center text-xl font-bold text-white mb-6">{teamB}</span>
            <button onClick={() => addPoint("B")} disabled={!!matchWinner} className="group flex flex-col items-center justify-center w-full flex-1 touch-manipulation disabled:opacity-40">
              <span className="text-7xl md:text-9xl font-extrabold font-mono text-emerald-400 group-active:scale-95 transition-transform duration-100">
                {scoreB}
              </span>
              {!matchWinner && <span className="text-xs text-neutral-500 mt-4 group-hover:text-emerald-300">Tap to add point</span>}
            </button>
            {serving === "B" && !matchWinner && (
              <div className="absolute inset-x-0 bottom-4 flex justify-center">
                <span className="bg-emerald-500 text-black text-xs font-extrabold px-3 py-1 rounded-full animate-pulse">SERVING ({serveSide} COURT)</span>
              </div>
            )}
          </div>
        </div>

        {/* deuce prompts layout bottom overlay */}
        {isGamePoint && !isDeuce && !matchWinner && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-center py-2 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2">
            <ShieldAlert className="h-4 w-4" /> GAME POINT
          </div>
        )}
        {isDeuce && !matchWinner && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-center py-2 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2">
            <ShieldAlert className="h-4 w-4" /> DEUCE - MUST WIN BY 2
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
