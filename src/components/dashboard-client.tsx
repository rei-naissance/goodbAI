"use client";

import { useState } from "react";
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

export function DashboardContent() {
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
              <div className="mb-8 flex flex-wrap items-center justify-end gap-x-6 gap-y-2 border-b border-border pb-4 font-mono uppercase tracking-wider">
                <label className="flex cursor-pointer items-center gap-2 text-xs hover:text-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={enableAudio}
                    onChange={(e) => setEnableAudio(e.target.checked)}
                    className="appearance-none w-3 h-3 border border-primary checked:bg-primary"
                  />
                  <Settings2 className="h-4 w-4 text-primary" />
                  Structural Analysis
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs hover:text-[#5555ff] transition-colors">
                  <input
                    type="checkbox"
                    checked={enableDeezer}
                    onChange={(e) => setEnableDeezer(e.target.checked)}
                    className="appearance-none w-3 h-3 border border-[#5555ff] checked:bg-[#5555ff]"
                  />
                  <Music className="h-4 w-4 text-[#5555ff]" />
                  Fallback Pipeline
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs hover:text-[#ff3333] transition-colors">
                  <input
                    type="checkbox"
                    checked={enablePlayback}
                    onChange={(e) => setEnablePlayback(e.target.checked)}
                    className="appearance-none w-3 h-3 border border-[#ff3333] checked:bg-[#ff3333]"
                  />
                  <Music className="h-4 w-4 text-[#ff3333]" />
                  Deep Capture (Premium)
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
              <header className="flex items-center gap-4 bg-card border border-border p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-primary/20 to-transparent"></div>
                <Button variant="ghost" size="sm" onClick={handleBack} className="hover:bg-primary hover:text-black rounded-none transition-colors border-2 border-transparent hover:border-primary font-mono font-bold uppercase tracking-wider text-xs px-2">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Abort
                </Button>
                <Separator orientation="vertical" className="h-8 bg-border w-[2px]" />
                <div className="flex items-center gap-4">
                  {scanState.playlist.images?.[0] && (
                    <img
                      src={scanState.playlist.images[0].url}
                      alt={scanState.playlist.name}
                      className="h-14 w-14 border border-primary object-cover"
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter shadow-sm font-sans">
                      {scanState.playlist.name}
                    </h2>
                    <p className="text-xs text-primary font-mono mt-1 tracking-widest uppercase opacity-80">
                      TARGET.TRACKS: {scanState.playlist.tracks.total}
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
                  className="rounded-none border-2 border-destructive bg-destructive/10 p-8 text-center"
                >
                  <p className="font-bold text-destructive text-lg font-mono uppercase tracking-widest">
                    SYSTEM FAILURE: {scanState.error}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-8 rounded-none border-2 border-destructive hover:bg-destructive text-destructive hover:text-black transition-colors font-mono uppercase tracking-widest text-xs"
                    onClick={handleBack}
                  >
                    Reset Protocol
                  </Button>
                </motion.div>
              )}

              {/* Empty complete state */}
              {scanState.status === "complete" &&
                scanState.results.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-24 text-center rounded-none border border-border bg-card relative overflow-hidden group"
                  >
                    {/* A brutalist corner cut effect */}
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/50 group-hover:border-primary transition-colors"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/50 group-hover:border-primary transition-colors"></div>

                    <motion.div
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    >
                      <Music className="mx-auto mb-8 h-16 w-16 text-primary drop-shadow-lg" />
                    </motion.div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">ALL CLEAR</h3>
                    <p className="mt-4 text-primary font-mono max-w-sm mx-auto uppercase tracking-widest text-xs">
                      No synthetic signatures detected within target parameters.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-8 rounded-none border-2 border-primary hover:bg-primary text-primary hover:text-black transition-all font-mono font-bold uppercase tracking-widest text-xs"
                      onClick={handleBack}
                    >
                      Initiate New Scan
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
