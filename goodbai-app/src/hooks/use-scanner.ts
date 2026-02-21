"use client";

import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { scanTracks, getScanStats } from "@/lib/scanner";
import type {
  SpotifyPlaylist,
  SpotifyTrack,
  ScanResult,
  ScanProgress,
  PlaylistScanState,
} from "@/lib/types";

export interface ScannerOptions {
  enableAudio?: boolean;
  enableDeezerFallback?: boolean;
  enablePlaybackCapture?: boolean;
}

export function useScanner() {
  const { spotifyClient, tokens } = useAuth();
  const [scanState, setScanState] = useState<PlaylistScanState | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startScan = useCallback(
    async (playlist: SpotifyPlaylist, scannerOptions: ScannerOptions = {}) => {
      const {
        enableAudio = true,
        enableDeezerFallback = true,
        enablePlaybackCapture = false,
      } = scannerOptions;
      if (!spotifyClient) return;

      // Abort any existing scan
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      setScanState({
        playlist,
        status: "loading_tracks",
        progress: {
          phase: "blocklist",
          totalTracks: playlist.tracks.total,
          processedTracks: 0,
          flaggedCount: 0,
          currentTrack: null,
        },
        results: [],
        error: null,
      });

      try {
        // Load all tracks from the playlist
        const tracks: SpotifyTrack[] =
          await spotifyClient.getAllPlaylistTracks(playlist.id);

        if (abortController.signal.aborted) return;

        setScanState((prev) =>
          prev
            ? {
                ...prev,
                status: "scanning",
                progress: {
                  ...prev.progress,
                  totalTracks: tracks.length,
                },
              }
            : null
        );

        // Run the scan
        const results = await scanTracks(tracks, {
          onProgress: (progress: ScanProgress) => {
            setScanState((prev) =>
              prev ? { ...prev, progress } : null
            );
          },
          onTrackResult: (result: ScanResult) => {
            setScanState((prev) => {
              if (!prev) return null;
              const existingIdx = prev.results.findIndex(
                (r) => r.track.id === result.track.id
              );
              const updatedResults =
                existingIdx >= 0
                  ? prev.results.map((r, i) =>
                      i === existingIdx ? result : r
                    )
                  : [...prev.results, result];
              return { ...prev, results: updatedResults };
            });
          },
        }, {
          enableAudioAnalysis: enableAudio,
          enableDeezerFallback,
          enablePlaybackCapture,
          accessToken: tokens?.access_token,
          abortSignal: abortController.signal,
        });

        if (abortController.signal.aborted) return;

        setScanState((prev) =>
          prev
            ? {
                ...prev,
                status: "complete",
                results,
              }
            : null
        );
      } catch (err) {
        if (abortController.signal.aborted) return;

        setScanState((prev) =>
          prev
            ? {
                ...prev,
                status: "error",
                error:
                  err instanceof Error
                    ? err.message
                    : "An unexpected error occurred",
              }
            : null
        );
      }
    },
    [spotifyClient, tokens]
  );

  const cancelScan = useCallback(() => {
    abortRef.current?.abort();
    setScanState((prev) =>
      prev ? { ...prev, status: "complete" } : null
    );
  }, []);

  const toggleTrackSelection = useCallback(
    (trackId: string) => {
      setScanState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          results: prev.results.map((r) =>
            r.track.id === trackId ? { ...r, selected: !r.selected } : r
          ),
        };
      });
    },
    []
  );

  const selectAllFlagged = useCallback(() => {
    setScanState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        results: prev.results.map((r) => ({
          ...r,
          selected:
            r.riskLevel === "high" || r.riskLevel === "medium"
              ? true
              : r.selected,
        })),
      };
    });
  }, []);

  const deselectAll = useCallback(() => {
    setScanState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        results: prev.results.map((r) => ({ ...r, selected: false })),
      };
    });
  }, []);

  const removeSelected = useCallback(async () => {
    if (!spotifyClient || !scanState) return;

    const selectedUris = scanState.results
      .filter((r) => r.selected)
      .map((r) => r.track.uri);

    if (selectedUris.length === 0) return;

    try {
      await spotifyClient.removeTracksFromPlaylist(
        scanState.playlist.id,
        selectedUris
      );

      // Remove from results
      setScanState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          results: prev.results.filter((r) => !r.selected),
        };
      });

      return selectedUris.length;
    } catch (err) {
      throw err;
    }
  }, [spotifyClient, scanState]);

  const stats = scanState ? getScanStats(scanState.results) : null;
  const selectedCount =
    scanState?.results.filter((r) => r.selected).length ?? 0;

  return {
    scanState,
    stats,
    selectedCount,
    startScan,
    cancelScan,
    toggleTrackSelection,
    selectAllFlagged,
    deselectAll,
    removeSelected,
  };
}
