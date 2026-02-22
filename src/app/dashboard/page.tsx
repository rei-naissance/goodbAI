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
import { motion, AnimatePresence } from "framer-motion";

function DashboardContent() {
  const { isAuthenticated, isLoading, login } = useAuth();
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

  // Wait for auth context to finish initializing
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-muted-foreground flex flex-col items-center gap-4"
        >
          <Music className="h-8 w-8 animate-pulse text-primary" />
          <p className="font-medium tracking-wide">Connecting to Spotify...</p>
        </motion.div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-transparent selection:bg-primary/30">
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-7xl px-4 py-8 sm:px-8"
      >
        <AnimatePresence mode="wait">
          {!scanState ? (
            <motion.section
              key="playlist-selector"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Scan options */}
              <div className="mb-8 flex flex-wrap items-center justify-end gap-x-6 gap-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm hover:text-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={enableAudio}
                    onChange={(e) => setEnableAudio(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <Settings2 className="h-4 w-4 text-primary/70" />
                  Audio analysis
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm hover:text-purple-400 transition-colors">
                  <input
                    type="checkbox"
                    checked={enableDeezer}
                    onChange={(e) => setEnableDeezer(e.target.checked)}
                    className="rounded text-purple-500 focus:ring-purple-500"
                  />
                  <Music className="h-4 w-4 text-purple-500" />
                  Deezer fallback
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm hover:text-green-400 transition-colors">
                  <input
                    type="checkbox"
                    checked={enablePlayback}
                    onChange={(e) => setEnablePlayback(e.target.checked)}
                    className="rounded text-green-500 focus:ring-green-500"
                  />
                  <Music className="h-4 w-4 text-green-500" />
                  Playback capture (Premium)
                </label>
              </div>

              <PlaylistSelector onSelectPlaylist={handleSelectPlaylist} />
            </motion.section>
          ) : (
            <motion.section
              key="scan-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {/* Header */}
              <header className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={handleBack} className="hover:bg-primary/10 hover:text-primary transition-colors">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Separator orientation="vertical" className="h-6 bg-border/50" />
                <div className="flex items-center gap-4">
                  {scanState.playlist.images?.[0] && (
                    <img
                      src={scanState.playlist.images[0].url}
                      alt={scanState.playlist.name}
                      className="h-12 w-12 rounded-lg shadow-sm border border-border/50 object-cover"
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">
                      {scanState.playlist.name}
                    </h2>
                    <p className="text-sm text-muted-foreground font-medium mt-1">
                      {scanState.playlist.tracks.total} tracks
                    </p>
                  </div>
                </div>
              </header>

              {/* Progress bar (while scanning) */}
              {isScanning && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                  <ScanProgressBar
                    progress={scanState.progress}
                    onCancel={cancelScan}
                  />
                </motion.div>
              )}

              {/* Stats (when we have results) */}
              {stats && scanState.results.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <StatsCards
                    total={stats.total}
                    high={stats.high}
                    medium={stats.medium}
                    low={stats.low}
                    noPreview={stats.noPreview}
                    blocklistMatches={stats.blocklistMatches}
                    deezerFallbacks={stats.deezerFallbacks}
                  />
                </motion.div>
              )}

              {/* Results table */}
              {scanState.results.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <ResultsTable
                    results={scanState.results}
                    selectedCount={selectedCount}
                    onToggleSelect={toggleTrackSelection}
                    onSelectAllFlagged={selectAllFlagged}
                    onDeselectAll={deselectAll}
                    onRemoveSelected={handleRemoveSelected}
                  />
                </motion.div>
              )}

              {/* Error state */}
              {scanState.status === "error" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center shadow-sm"
                >
                  <p className="font-semibold text-destructive text-lg">
                    {scanState.error}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-8 border-destructive/20 hover:bg-destructive text-destructive hover:text-destructive-foreground transition-colors"
                    onClick={handleBack}
                  >
                    Go Back
                  </Button>
                </motion.div>
              )}

              {/* Empty complete state */}
              {scanState.status === "complete" &&
                scanState.results.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-24 text-center rounded-2xl border border-border/50 bg-card/50"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    >
                      <Music className="mx-auto mb-8 h-16 w-16 text-primary drop-shadow-lg" />
                    </motion.div>
                    <h3 className="text-2xl font-bold tracking-tight">All Clean!</h3>
                    <p className="mt-4 text-muted-foreground max-w-sm mx-auto">
                      No AI-generated tracks were detected in this playlist. You have great taste!
                    </p>
                    <Button
                      variant="outline"
                      className="mt-8 rounded-full border-primary/30 hover:bg-primary/10 text-primary transition-all hover:scale-105"
                      onClick={handleBack}
                    >
                      Scan Another Playlist
                    </Button>
                  </motion.div>
                )}
            </motion.section>
          )}
        </AnimatePresence>
      </motion.main>
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
