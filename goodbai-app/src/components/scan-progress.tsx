"use client";

import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScanProgress } from "@/lib/types";

interface ScanProgressBarProps {
  progress: ScanProgress;
  onCancel: () => void;
}

export function ScanProgressBar({ progress, onCancel }: ScanProgressBarProps) {
  const percentage =
    progress.totalTracks > 0
      ? Math.round((progress.processedTracks / progress.totalTracks) * 100)
      : 0;

  const phaseLabel =
    progress.phase === "blocklist"
      ? "Checking against AI artist blocklist..."
      : progress.phase === "audio"
        ? "Analyzing audio with SONICS model..."
        : "Scan complete";

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {progress.phase !== "complete" && (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          <div>
            <p className="font-medium">{phaseLabel}</p>
            {progress.currentTrack && (
              <p className="text-sm text-muted-foreground">
                {progress.currentTrack}
              </p>
            )}
          </div>
        </div>
        {progress.phase !== "complete" && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      <Progress value={percentage} className="mb-2" />

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          {progress.processedTracks} / {progress.totalTracks} tracks
        </span>
        <span>
          {progress.flaggedCount} flagged
        </span>
      </div>
    </div>
  );
}
