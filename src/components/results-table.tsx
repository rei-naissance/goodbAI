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
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ScanResult, RiskLevel, AudioSource } from "@/lib/types";

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
      return <Badge variant="outline" className="text-[10px] text-green-600">Spotify</Badge>;
    case "deezer_preview":
      return <Badge variant="outline" className="text-[10px] text-purple-600">Deezer</Badge>;
    case "playback_capture":
      return <Badge variant="outline" className="text-[10px] text-blue-600">Playback</Badge>;
    case "none":
      return <span className="text-[10px] text-muted-foreground">—</span>;
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
    <div>
      {/* Actions bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Risk filter tabs */}
        <div className="flex gap-1 rounded-lg border bg-muted p-1">
          {(["all", "high", "medium", "low", "unknown"] as const).map(
            (level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  filter === level
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {level === "all"
                  ? `All (${results.length})`
                  : `${level.charAt(0).toUpperCase() + level.slice(1)} (${results.filter((r) => r.riskLevel === level).length})`}
              </button>
            )
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAllFlagged}>
            Select All Flagged
          </Button>
          <Button variant="outline" size="sm" onClick={onDeselectAll}>
            Deselect All
          </Button>
          {selectedCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={removing}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {removing
                ? "Removing..."
                : `Remove ${selectedCount} track${selectedCount !== 1 ? "s" : ""}`}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="w-12">
                <button onClick={() => toggleSort("risk")}>
                  Risk
                  <SortIcon field="risk" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("name")}>
                  Track
                  <SortIcon field="name" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("artist")}>
                  Artist
                  <SortIcon field="artist" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("score")}>
                  AI Score
                  <SortIcon field="score" />
                </button>
              </TableHead>
              <TableHead>Detection</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-muted-foreground"
                >
                  No tracks match the current filter
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSorted.map((result) => (
                <TableRow
                  key={result.track.id}
                  className={
                    result.selected ? "bg-destructive/5" : undefined
                  }
                >
                  <TableCell>
                    <Checkbox
                      checked={result.selected}
                      onCheckedChange={() =>
                        onToggleSelect(result.track.id)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <RiskIcon level={result.riskLevel} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {result.track.album.images?.[0] && (
                        <img
                          src={
                            result.track.album.images[
                              result.track.album.images.length - 1
                            ]?.url || result.track.album.images[0].url
                          }
                          alt=""
                          className="h-10 w-10 rounded"
                        />
                      )}
                      <span className="max-w-[200px] truncate font-medium">
                        {result.track.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="max-w-[150px] truncate text-sm text-muted-foreground">
                      {result.track.artists
                        .map((a) => a.name)
                        .join(", ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <AIProbabilityBar
                      score={result.audioScore}
                      riskLevel={result.riskLevel}
                      compact
                    />
                  </TableCell>
                  <TableCell>
                    {result.blocklistMatch && (
                      <Badge variant="destructive" className="text-xs">
                        Blocklist
                      </Badge>
                    )}
                    {result.audioScore !== null &&
                      result.audioScore >= 0.4 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          Audio
                        </Badge>
                      )}
                  </TableCell>
                  <TableCell>
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
