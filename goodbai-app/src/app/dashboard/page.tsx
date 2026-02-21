"use client";

import { useState } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { useAuth } from "@/lib/auth-context";
import { useScanner } from "@/hooks/use-scanner";
import { Navbar } from "@/components/navbar";
import { PlaylistSelector } from "@/components/playlist-selector";
import { ScanProgressBar } from "@/components/scan-progress";
import { ResultsTable } from "@/components/results-table";
import { StatsCards } from "@/components/stats-cards";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Music, Settings2 } from "lucide-react";
import { toast } from "sonner";
import type { SpotifyPlaylist } from "@/lib/types";

function DashboardContent() {
  const { isAuthenticated, login } = useAuth();
  const {
    scanState,
    stats,
    selectedCount,
    startScan,
    cancelScan,
    toggleTrackSelection,
    selectAllFlagged,
    deselectAll,
    removeSelected,
  } = useScanner();

  const [enableAudio, setEnableAudio] = useState(true);
  const [enableDeezer, setEnableDeezer] = useState(true);
  const [enablePlayback, setEnablePlayback] = useState(false);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      login();
    }
    return null;
  }

  const handleSelectPlaylist = async (playlist: SpotifyPlaylist) => {
    await startScan(playlist, {
      enableAudio,
      enableDeezerFallback: enableDeezer,
      enablePlaybackCapture: enablePlayback,
    });
  };

  const handleRemoveSelected = async () => {
    try {
      const count = await removeSelected();
      if (count) {
        toast.success(`Removed ${count} track${count !== 1 ? "s" : ""} from playlist`);
      }
    } catch {
      toast.error("Failed to remove tracks. Please try again.");
    }
  };

  const handleBack = () => {
    cancelScan();
    window.location.reload();
  };

  const isScanning =
    scanState?.status === "loading_tracks" ||
    scanState?.status === "scanning";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* No scan yet — show playlist selector */}
        {!scanState && (
          <>
            {/* Scan options */}
            <div className="mb-6 flex flex-wrap items-center justify-end gap-x-6 gap-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={enableAudio}
                  onChange={(e) => setEnableAudio(e.target.checked)}
                  className="rounded"
                />
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                Audio analysis
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={enableDeezer}
                  onChange={(e) => setEnableDeezer(e.target.checked)}
                  className="rounded"
                />
                <Music className="h-4 w-4 text-purple-500" />
                Deezer fallback
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={enablePlayback}
                  onChange={(e) => setEnablePlayback(e.target.checked)}
                  className="rounded"
                />
                <Music className="h-4 w-4 text-green-500" />
                Playback capture (Premium)
              </label>
            </div>

            <PlaylistSelector onSelectPlaylist={handleSelectPlaylist} />
          </>
        )}

        {/* Active scan */}
        {scanState && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                {scanState.playlist.images?.[0] && (
                  <img
                    src={scanState.playlist.images[0].url}
                    alt=""
                    className="h-10 w-10 rounded"
                  />
                )}
                <div>
                  <h2 className="text-xl font-bold">
                    {scanState.playlist.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {scanState.playlist.tracks.total} tracks
                  </p>
                </div>
              </div>
            </div>

            {/* Progress bar (while scanning) */}
            {isScanning && (
              <ScanProgressBar
                progress={scanState.progress}
                onCancel={cancelScan}
              />
            )}

            {/* Stats (when we have results) */}
            {stats && scanState.results.length > 0 && (
              <StatsCards
                total={stats.total}
                high={stats.high}
                medium={stats.medium}
                low={stats.low}
                noPreview={stats.noPreview}
                blocklistMatches={stats.blocklistMatches}
                deezerFallbacks={stats.deezerFallbacks}
              />
            )}

            {/* Results table */}
            {scanState.results.length > 0 && (
              <ResultsTable
                results={scanState.results}
                selectedCount={selectedCount}
                onToggleSelect={toggleTrackSelection}
                onSelectAllFlagged={selectAllFlagged}
                onDeselectAll={deselectAll}
                onRemoveSelected={handleRemoveSelected}
              />
            )}

            {/* Error state */}
            {scanState.status === "error" && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
                <p className="font-medium text-destructive">
                  {scanState.error}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleBack}
                >
                  Go Back
                </Button>
              </div>
            )}

            {/* Empty complete state */}
            {scanState.status === "complete" &&
              scanState.results.length === 0 && (
                <div className="py-16 text-center">
                  <Music className="mx-auto mb-4 h-12 w-12 text-green-500" />
                  <h3 className="text-xl font-semibold">All Clean!</h3>
                  <p className="mt-2 text-muted-foreground">
                    No AI-generated tracks were detected in this playlist.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={handleBack}
                  >
                    Scan Another Playlist
                  </Button>
                </div>
              )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
