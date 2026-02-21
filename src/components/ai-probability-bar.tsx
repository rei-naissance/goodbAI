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
      <span className="text-xs text-muted-foreground">
        {riskLevel === "unknown" ? "No preview" : "–"}
      </span>
    );
  }

  const displayScore = score !== null ? Math.round(score * 100) : 100;

  const barColor =
    riskLevel === "high"
      ? "bg-red-500"
      : riskLevel === "medium"
        ? "bg-yellow-500"
        : "bg-green-500";

  const textColor =
    riskLevel === "high"
      ? "text-red-600 dark:text-red-400"
      : riskLevel === "medium"
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-green-600 dark:text-green-400";

  return (
    <div
      className={cn("flex items-center gap-2", compact ? "w-24" : "w-32")}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-muted",
          compact ? "h-2 flex-1" : "h-3 flex-1"
        )}
      >
        <div
          className={cn("absolute left-0 top-0 h-full rounded-full", barColor)}
          style={{ width: `${displayScore}%` }}
        />
      </div>
      <span className={cn("text-xs font-medium tabular-nums", textColor)}>
        {displayScore}%
      </span>
    </div>
  );
}
