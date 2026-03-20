"use client";

import { MatchNode } from "@/types/bracket";
import { MatchCard } from "./match-card";
import { useMatch } from "@/context/match-context";
import { useState, useRef, useEffect } from "react";

export function BracketTree() {
  const { bracketData, selectedSport } = useMatch();
  const currentSportData = bracketData[selectedSport];
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<any[]>([]);

  // Function to calculate exact center-right and center-left points for SVG
  const calculateLines = () => {
    if (!containerRef.current) return;
    const parent = containerRef.current.getBoundingClientRect();
    const newLines: any[] = [];

    const currentSportData = bracketData[selectedSport];
    const matchGroups = [currentSportData.round16, currentSportData.quarter, currentSportData.semi, currentSportData.final];

    matchGroups.forEach((group, idx) => {
      if (idx === matchGroups.length - 1) return; // skip final
      const nextGroup = matchGroups[idx + 1];

      group.forEach((node) => {
        const el = document.getElementById(`node-${node.id}`);
        const nextNodeId = node.nextMatchId;
        const nextEl = nextNodeId ? document.getElementById(`node-${nextNodeId}`) : null;

        if (el && nextEl) {
          const rect = el.getBoundingClientRect();
          const nextRect = nextEl.getBoundingClientRect();

          const x1 = rect.right - parent.left;
          const y1 = rect.top + rect.height / 2 - parent.top;
          
          const x2 = nextRect.left - parent.left;
          const y2 = nextRect.top + nextRect.height / 2 - parent.top;

          newLines.push({
            id: `${node.id}-${nextNodeId}`,
            x1, y1, x2, y2,
            isHighlighted: hoveredNode === node.id || hoveredNode === nextNodeId
          });
        }
      });
    });

    setLines(newLines);
  };

  useEffect(() => {
    calculateLines();
    window.addEventListener("resize", calculateLines);
    return () => window.removeEventListener("resize", calculateLines);
  }, [hoveredNode]);

  return (
    <div 
      ref={containerRef}
      className="relative flex gap-12 md:gap-24 p-8 overflow-x-auto w-full h-[calc(100vh-160px)] items-center select-none"
    >
      {/* SVG Container overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {lines.map((line) => (
          <path
            key={line.id}
            d={`M ${line.x1} ${line.y1} C ${(line.x1 + line.x2) / 2} ${line.y1}, ${(line.x1 + line.x2) / 2} ${line.y2}, ${line.x2} ${line.y2}`}
            fill="none"
            stroke={line.isHighlighted ? "#22d3ee" : "#262626"}
            strokeWidth={line.isHighlighted ? 2.5 : 1.5}
            className="transition-all duration-300"
          />
        ))}
      </svg>
      
      {/* R16 */}
      {currentSportData?.round16?.length > 0 && (
        <div className="flex flex-col justify-around h-full gap-4 z-10 flex-shrink-0 w-64">
          {currentSportData.round16.map((node: MatchNode) => (
            <div id={`node-${node.id}`} key={node.id}>
              <MatchCard
                title={node.title}
                teams={node.teams}
                status={node.status}
                winnerId={node.winnerId}
                onHover={(hover) => setHoveredNode(hover ? node.id : null)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Quarterfinals */}
      {currentSportData?.quarter?.length > 0 && (
        <div className="flex flex-col justify-around h-full gap-16 z-10 flex-shrink-0 w-64">
          {currentSportData.quarter.map((node: MatchNode) => (
            <div id={`node-${node.id}`} key={node.id}>
              <MatchCard
                title={node.title}
                teams={node.teams}
                status={node.status}
                winnerId={node.winnerId}
                onHover={(hover) => setHoveredNode(hover ? node.id : null)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Semifinals */}
      {currentSportData?.semi?.length > 0 && (
        <div className="flex flex-col justify-around h-full gap-32 z-10 flex-shrink-0 w-64">
          {currentSportData.semi.map((node: MatchNode) => (
            <div id={`node-${node.id}`} key={node.id}>
              <MatchCard
                title={node.title}
                teams={node.teams}
                status={node.status}
                winnerId={node.winnerId}
                onHover={(hover) => setHoveredNode(hover ? node.id : null)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Finals */}
      {currentSportData?.final?.length > 0 && (
        <div className="flex flex-col justify-center h-full z-10 flex-shrink-0 w-64">
          {currentSportData.final.map((node: MatchNode) => (
            <div id={`node-${node.id}`} key={node.id}>
              <MatchCard
                title={node.title}
                teams={node.teams}
                status={node.status}
                winnerId={node.winnerId}
                onHover={(hover) => setHoveredNode(hover ? node.id : null)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
