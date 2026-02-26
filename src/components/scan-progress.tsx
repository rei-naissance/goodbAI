"use client";

import { Loader2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScanProgress } from "@/lib/types";
import { cn } from "@/lib/utils";

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
      ? "CROSS-REFERENCING NEGATIVE DB..."
      : progress.phase === "audio"
        ? "EXECUTING SONICS ANALYSIS..."
        : "SCAN TERMINATED";

  return (
    <div className="rounded-none border-2 border-border bg-card p-6 relative overflow-hidden group">
      {/* Background glitchy lines effect */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity"></div>

      <div className="relative z-10 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {progress.phase !== "complete" && (
            <div className="relative w-8 h-8 flex items-center justify-center">
              <Activity className="h-6 w-6 text-primary animate-pulse absolute" />
              <Loader2 className="h-8 w-8 animate-[spin_3s_linear_infinite] text-primary/50 absolute" />
            </div>
          )}
          <div>
            <p className="font-mono font-bold uppercase tracking-widest text-sm text-foreground">{phaseLabel}</p>
            {progress.currentTrack && (
              <p className="font-mono text-[10px] uppercase text-primary tracking-widest shadow-sm">
                TARGET :: {progress.currentTrack}
              </p>
            )}
          </div>
        </div>
        {progress.phase !== "complete" && (
          <Button variant="outline" size="sm" onClick={onCancel} className="rounded-none border-2 border-border hover:bg-destructive hover:text-black hover:border-destructive transition-colors font-mono uppercase tracking-widest text-xs h-8">
            Abort
          </Button>
        )}
      </div>

      <div className="relative z-10 w-full h-2 bg-muted border border-border overflow-hidden mb-2">
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out relative"
          style={{ width: `${percentage}%` }}
        >
          {/* subtle line effect inside progress bar */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0JyBoZWlnaHQ9JzQnPjxyZWN0IHdpZHRoPSc0JyBoZWlnaHQ9JzQnIGZpbGw9J25vbmUnLz48bGluZSB4MT0nMCcgeTE9JzQnIHgyPSc0JyB5Mj0nMCcgc3Ryb2tlPScjMDAwMDAwJyBzdHJva2Utd2lkdGg9JzEnIG9wYWNpdHk9JzAuMicvPjwvc3ZnPg==')] mix-blend-overlay"></div>
        </div>
      </div>

      <div className="relative z-10 flex justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <span>
          PROCESSED: {progress.processedTracks} / {progress.totalTracks} TRKS
        </span>
        <span className={cn(progress.flaggedCount > 0 && "text-destructive font-bold animate-pulse")}>
          FLAGGED: {progress.flaggedCount}
        </span>
      </div>
    </div>
  );
}
