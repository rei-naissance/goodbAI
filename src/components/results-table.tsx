"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AIProbabilityBar } from "@/components/ai-probability-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HelpCircle, AlertTriangle, CheckCircle2, ArrowDown, ArrowUp, Trash2, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import type { ScanResult, RiskLevel, AudioSource } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

const MotionTableRow = motion.create ? motion.create(TableRow) : motion(TableRow as any);

interface ResultsTableProps {
  results: ScanResult[];
  selectedCount: number;
  onToggleSelect: (trackId: string) => void;
  onSelectAllFlagged: () => void;
  onDeselectAll: () => void;
  onRemoveSelected: () => Promise<void>;
}

type SortField = "risk" | "score" | "name" | "artist";
type SortDirection = "asc" | "desc";

const riskOrder: Record<RiskLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
  unknown: 3,
};

function RiskIcon({ level }: { level: RiskLevel }) {
  switch (level) {
    case "high":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "medium":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "low":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "unknown":
      return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
  }
}

function AudioSourceBadge({ source }: { source: AudioSource }) {
  switch (source) {
    case "spotify_preview":
      return <span className="border border-primary px-1 font-mono text-[9px] uppercase tracking-widest text-primary bg-primary/10">SP_PRVW</span>;
    case "deezer_preview":
      return <span className="border border-[#5555ff] px-1 font-mono text-[9px] uppercase tracking-widest text-[#5555ff] bg-[#5555ff]/10">DZ_PRVW</span>;
    case "playback_capture":
      return <span className="border border-destructive px-1 font-mono text-[9px] uppercase tracking-widest text-destructive bg-destructive/10">PB_CAP</span>;
    case "none":
      return <span className="text-[10px] text-muted-foreground font-mono">—</span>;
  }
}

export function ResultsTable({
  results,
  selectedCount,
  onToggleSelect,
  onSelectAllFlagged,
  onDeselectAll,
  onRemoveSelected,
}: ResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>("risk");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [filter, setFilter] = useState<RiskLevel | "all">("all");
  const [removing, setRemoving] = useState(false);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  };

  const filteredAndSorted = useMemo(() => {
    let filtered =
      filter === "all"
        ? results
        : results.filter((r) => r.riskLevel === filter);

    const dir = sortDir === "asc" ? 1 : -1;

    return [...filtered].sort((a, b) => {
      switch (sortField) {
        case "risk":
          return (riskOrder[a.riskLevel] - riskOrder[b.riskLevel]) * dir;
        case "score":
          return ((a.audioScore ?? -1) - (b.audioScore ?? -1)) * -dir;
        case "name":
          return a.track.name.localeCompare(b.track.name) * dir;
        case "artist":
          return (
            (a.track.artists[0]?.name || "").localeCompare(
              b.track.artists[0]?.name || ""
            ) * dir
          );
        default:
          return 0;
      }
    });
  }, [results, filter, sortField, sortDir]);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemoveSelected();
    } finally {
      setRemoving(false);
    }
  };

  return (
    <section>
      {/* Actions bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        {/* Risk filter tabs */}
        <nav aria-label="Risk Filters" className="flex gap-px bg-border border-2 border-border p-px">
          {(["all", "high", "medium", "low", "unknown"] as const).map(
            (level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors ${filter === level
                  ? "bg-primary text-black"
                  : "bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
              >
                {level === "all"
                  ? `ALL_FTR (${results.length})`
                  : `${level.toUpperCase().substring(0, 3)} (${results.filter((r) => r.riskLevel === level).length})`}
              </button>
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAllFlagged} className="rounded-none border-2 border-border hover:bg-muted font-mono text-[10px] uppercase tracking-widest px-3 h-8">
            Select_Flagged
          </Button>
          <Button variant="outline" size="sm" onClick={onDeselectAll} className="rounded-none border-2 border-border hover:bg-muted font-mono text-[10px] uppercase tracking-widest px-3 h-8">
            Deselect_All
          </Button>
          {selectedCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={removing}
              className="rounded-none font-mono text-[10px] uppercase tracking-widest px-3 h-8"
            >
              <Trash2 className="mr-2 h-3 w-3" />
              {removing
                ? "Terminating..."
                : `Terminate [${selectedCount}]`}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border-2 border-border bg-card">
        <Table>
          <TableHeader className="bg-muted border-b-2 border-border hover:bg-muted">
            <TableRow className="hover:bg-muted border-none">
              <TableHead className="w-12 border-r border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground"></TableHead>
              <TableHead className="w-12 border-r border-border font-mono text-[10px] uppercase tracking-widest text-primary">
                <button onClick={() => toggleSort("risk")} className="hover:text-primary transition-colors flex items-center justify-between w-full">
                  RSK
                  <SortIcon field="risk" />
                </button>
              </TableHead>
              <TableHead className="border-r border-border font-mono text-[10px] uppercase tracking-widest text-primary">
                <button onClick={() => toggleSort("name")} className="hover:text-primary transition-colors flex items-center justify-between w-full">
                  TRK_NAME
                  <SortIcon field="name" />
                </button>
              </TableHead>
              <TableHead className="border-r border-border font-mono text-[10px] uppercase tracking-widest text-primary">
                <button onClick={() => toggleSort("artist")} className="hover:text-primary transition-colors flex items-center justify-between w-full">
                  ARTIST
                  <SortIcon field="artist" />
                </button>
              </TableHead>
              <TableHead className="border-r border-border font-mono text-[10px] uppercase tracking-widest text-primary">
                <button onClick={() => toggleSort("score")} className="hover:text-primary transition-colors flex items-center justify-between w-full">
                  AI_SCORE
                  <SortIcon field="score" />
                </button>
              </TableHead>
              <TableHead className="border-r border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">DETECTION</TableHead>
              <TableHead className="border-r border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">SOURCE</TableHead>
              <TableHead className="w-12 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {filteredAndSorted.length === 0 ? (
                <MotionTableRow
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-muted-foreground font-medium"
                  >
                    No tracks match the current filter
                  </TableCell>
                </MotionTableRow>
              ) : (
                filteredAndSorted.map((result, i) => (
                  <MotionTableRow
                    key={result.track.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 100, damping: 20 }}
                    className={`border-b border-border transition-colors hover:bg-primary/5 ${result.selected ? "bg-destructive/10" : ""
                      }`}
                  >
                    <TableCell className="border-r border-border/50">
                      <Checkbox
                        checked={result.selected}
                        onCheckedChange={() =>
                          onToggleSelect(result.track.id)
                        }
                        className="rounded-none border-border"
                      />
                    </TableCell>
                    <TableCell className="border-r border-border/50">
                      <div className="flex justify-center">
                        <RiskIcon level={result.riskLevel} />
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-border/50">
                      <div className="flex items-center gap-3">
                        {result.track.album.images?.[0] && (
                          <img
                            src={
                              result.track.album.images[
                                result.track.album.images.length - 1
                              ]?.url || result.track.album.images[0].url
                            }
                            alt=""
                            className="h-8 w-8 grayscale"
                          />
                        )}
                        <span className="max-w-[200px] truncate font-sans font-bold uppercase tracking-tight text-foreground">
                          {result.track.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-border/50">
                      <span className="max-w-[150px] truncate text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        {result.track.artists
                          .map((a) => a.name)
                          .join(", ")}
                      </span>
                    </TableCell>
                    <TableCell className="border-r border-border/50 pt-3">
                      <AIProbabilityBar
                        score={result.audioScore}
                        riskLevel={result.riskLevel}
                        compact
                      />
                    </TableCell>
                    <TableCell className="border-r border-border/50">
                      <div className="flex gap-1">
                        {result.blocklistMatch && (
                          <span className="border border-destructive px-1 font-mono text-[9px] uppercase tracking-widest text-destructive bg-destructive/10">
                            BLK_LST
                          </span>
                        )}
                        {result.audioScore !== null &&
                          result.audioScore >= 0.4 && (
                            <span className="border border-primary px-1 font-mono text-[9px] uppercase tracking-widest text-primary bg-primary/10">
                              AUDIO
                            </span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-border/50">
                      <AudioSourceBadge source={result.audioSource} />
                    </TableCell>
                    <TableCell>
                      <a
                        href={result.track.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </TableCell>
                  </MotionTableRow>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </section >
  );
}
