"use client";

import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/types";

interface AIProbabilityBarProps {
  score: number | null;
  riskLevel: RiskLevel;
  compact?: boolean;
}

export function AIProbabilityBar({
  score,
  riskLevel,
  compact = false,
}: AIProbabilityBarProps) {
  if (score === null && riskLevel !== "high") {
    return (
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {riskLevel === "unknown" ? "NO_DB_PREVIEW" : "NEG"}
      </span>
    );
  }

  const displayScore = score !== null ? Math.round(score * 100) : 100;

  const barColor =
    riskLevel === "high"
      ? "bg-destructive"
      : riskLevel === "medium"
        ? "bg-yellow-500"
        : "bg-primary";

  const textColor =
    riskLevel === "high"
      ? "text-destructive"
      : riskLevel === "medium"
        ? "text-yellow-500"
        : "text-primary";

  return (
    <div
      className={cn("flex flex-col gap-1", compact ? "w-24" : "w-32")}
    >
      <div className="flex justify-between items-center w-full">
        <span className={cn("text-[10px] font-bold font-mono tabular-nums leading-none tracking-tighter", textColor)}>
          {displayScore}%
        </span>
      </div>
      <div
        className={cn(
          "relative overflow-hidden bg-card border border-border flex items-center",
          compact ? "h-1.5" : "h-2"
        )}
      >
        <div
          className={cn("absolute left-0 top-0 h-full", barColor)}
          style={{ width: `${displayScore}%` }}
        />
        {/* Subtle grid over the bar */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0JyBoZWlnaHQ9JzQnPjxyZWN0IHdpZHRoPSc0JyBoZWlnaHQ9JzQnIGZpbGw9J25vbmUnLz48bGluZSB4MT0nMScgeTE9JzAnIHgyPScxJyB5Mj0nNCcgc3Ryb2tlPScjMDAwMDAwJyBzdHJva2Utd2lkdGg9JzEnIG9wYWNpdHk9JzAuMicvPjwvc3ZnPg==')] mix-blend-overlay"></div>
      </div>
    </div>
  );
}
