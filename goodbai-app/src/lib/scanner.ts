import { checkTrackBlocklist } from "./blocklist";
import {
  fetchAudioWaveform,
  getInferenceEngine,
} from "./inference";
import { findDeezerPreview } from "./deezer";
import type {
  SpotifyTrack,
  ScanResult,
  ScanProgress,
  RiskLevel,
  DetectionMethod,
  AudioSource,
} from "./types";

// ─── Configuration ──────────────────────────────────────────────

/** Threshold above which a track is flagged as AI */
const HIGH_THRESHOLD = 0.75;
const MEDIUM_THRESHOLD = 0.4;

/** Delay between audio analysis requests to avoid rate limiting (ms) */
const ANALYSIS_DELAY_MS = 200;

// ─── Helpers ────────────────────────────────────────────────────

function getRiskLevel(
  audioScore: number | null,
  blocklistMatch: boolean
): RiskLevel {
  if (blocklistMatch) return "high";
  if (audioScore === null) return "unknown";
  if (audioScore >= HIGH_THRESHOLD) return "high";
  if (audioScore >= MEDIUM_THRESHOLD) return "medium";
  return "low";
}

function getDetectionMethod(
  audioScore: number | null,
  blocklistMatch: boolean
): DetectionMethod {
  if (blocklistMatch && audioScore !== null) return "both";
  if (blocklistMatch) return "blocklist";
  return "audio_analysis";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Audio Source Resolution ────────────────────────────────────

interface ResolvedAudio {
  source: AudioSource;
  /** URL to fetch (via proxy) or null for playback capture */
  url: string | null;
}

/**
 * Resolve the best available audio source for a track.
 * Priority: Spotify preview → Deezer preview → none
 *
 * Playback capture (Web Playback SDK) is handled separately since
 * it requires active playback rather than a URL fetch.
 */
async function resolveAudioSource(
  track: SpotifyTrack,
  enableDeezerFallback: boolean
): Promise<ResolvedAudio> {
  // 1. Spotify preview URL (fastest, no extra API call)
  if (track.preview_url) {
    return { source: "spotify_preview", url: track.preview_url };
  }

  // 2. Deezer preview fallback (requires an API lookup)
  if (enableDeezerFallback) {
    const isrc = track.external_ids?.isrc || null;
    const artistName = track.artists[0]?.name || "";
    const deezerUrl = await findDeezerPreview(isrc, track.name, artistName);

    if (deezerUrl) {
      return { source: "deezer_preview", url: deezerUrl };
    }
  }

  // 3. No audio available
  return { source: "none", url: null };
}

// ─── Scanner ────────────────────────────────────────────────────

export interface ScanCallbacks {
  onProgress: (progress: ScanProgress) => void;
  onTrackResult: (result: ScanResult) => void;
}

export interface ScanOptions {
  enableAudioAnalysis?: boolean;
  enableDeezerFallback?: boolean;
  enablePlaybackCapture?: boolean;
  /** Access token for Web Playback SDK (required if enablePlaybackCapture is true) */
  accessToken?: string;
  abortSignal?: AbortSignal;
}

/**
 * Scan a list of tracks for AI-generated content.
 *
 * Phase 1: Blocklist matching (instant)
 * Phase 2: Audio analysis via SONICS ONNX model
 *   - Tries Spotify preview first
 *   - Falls back to Deezer preview (if enabled)
 *   - Falls back to Web Playback SDK capture (if enabled, Premium only)
 */
export async function scanTracks(
  tracks: SpotifyTrack[],
  callbacks: ScanCallbacks,
  options: ScanOptions = {}
): Promise<ScanResult[]> {
  const {
    enableAudioAnalysis = true,
    enableDeezerFallback = true,
    enablePlaybackCapture = false,
    accessToken,
    abortSignal,
  } = options;
  const results: ScanResult[] = [];

  const progress: ScanProgress = {
    phase: "blocklist",
    totalTracks: tracks.length,
    processedTracks: 0,
    flaggedCount: 0,
    currentTrack: null,
  };

  // ── Phase 1: Blocklist Matching ───────────────────────────────

  callbacks.onProgress({ ...progress });

  for (const track of tracks) {
    if (abortSignal?.aborted) break;

    const { matched, matchedNames } = checkTrackBlocklist(track.artists);

    const result: ScanResult = {
      track,
      audioScore: null,
      blocklistMatch: matched,
      matchedArtists: matchedNames,
      detectionMethod: matched ? "blocklist" : "audio_analysis",
      riskLevel: matched ? "high" : "unknown",
      selected: false,
      audioSource: "none",
    };

    results.push(result);
    progress.processedTracks++;

    if (matched) {
      progress.flaggedCount++;
      callbacks.onTrackResult(result);
    }
  }

  progress.phase = "blocklist";
  callbacks.onProgress({ ...progress });

  // ── Phase 2: Audio Analysis ───────────────────────────────────

  if (!enableAudioAnalysis) {
    progress.phase = "complete";
    callbacks.onProgress({ ...progress });
    return results;
  }

  progress.phase = "audio";
  progress.processedTracks = 0;
  progress.totalTracks = results.length;
  callbacks.onProgress({ ...progress });

  const engine = getInferenceEngine();

  // Initialize playback capture if enabled
  let playbackCapture: import("./playback-capture").SpotifyPlaybackCapture | null = null;
  if (enablePlaybackCapture && accessToken) {
    try {
      const { getPlaybackCapture } = await import("./playback-capture");
      playbackCapture = getPlaybackCapture(accessToken);
      await playbackCapture.initialize();
    } catch (err) {
      console.warn("Failed to initialize Web Playback SDK:", err);
      playbackCapture = null;
    }
  }

  for (const result of results) {
    if (abortSignal?.aborted) break;

    progress.currentTrack = `${result.track.artists[0]?.name} – ${result.track.name}`;
    callbacks.onProgress({ ...progress });

    try {
      // Resolve the best audio source for this track
      const audio = await resolveAudioSource(
        result.track,
        enableDeezerFallback
      );

      let waveform: Float32Array | null = null;
      let audioSource: AudioSource = audio.source;

      if (audio.url) {
        // Fetch audio through our proxy to avoid CORS
        const proxyUrl = `/api/proxy/preview?url=${encodeURIComponent(audio.url)}`;
        waveform = await fetchAudioWaveform(proxyUrl);
      } else if (playbackCapture?.isReady()) {
        // Last resort: Web Playback SDK capture
        waveform = await playbackCapture.captureTrackAudio(result.track.uri);
        if (waveform) {
          audioSource = "playback_capture";
        }
      }

      if (waveform) {
        const score = await engine.predict(waveform);

        result.audioScore = score;
        result.audioSource = audioSource;
        result.riskLevel = getRiskLevel(score, result.blocklistMatch);
        result.detectionMethod = getDetectionMethod(
          score,
          result.blocklistMatch
        );

        if (score >= MEDIUM_THRESHOLD) {
          progress.flaggedCount++;
        }
      } else {
        result.audioSource = "none";
      }

      callbacks.onTrackResult(result);
    } catch (err) {
      console.warn(
        `Failed to analyze ${result.track.name}:`,
        err
      );
      // Leave audioScore as null, riskLevel as "unknown"
    }

    progress.processedTracks++;
    callbacks.onProgress({ ...progress });

    // Rate limiting delay
    if (progress.processedTracks < results.length) {
      await sleep(ANALYSIS_DELAY_MS);
    }
  }

  // Clean up playback capture
  if (playbackCapture) {
    const { destroyPlaybackCapture } = await import("./playback-capture");
    destroyPlaybackCapture();
  }

  progress.phase = "complete";
  progress.currentTrack = null;
  callbacks.onProgress({ ...progress });

  return results;
}

/**
 * Get aggregate scan statistics from results.
 */
export function getScanStats(results: ScanResult[]) {
  const total = results.length;
  const high = results.filter((r) => r.riskLevel === "high").length;
  const medium = results.filter((r) => r.riskLevel === "medium").length;
  const low = results.filter((r) => r.riskLevel === "low").length;
  const unknown = results.filter((r) => r.riskLevel === "unknown").length;
  const blocklistMatches = results.filter((r) => r.blocklistMatch).length;
  const noPreview = results.filter(
    (r) => r.audioSource === "none" && !r.blocklistMatch
  ).length;
  const deezerFallbacks = results.filter(
    (r) => r.audioSource === "deezer_preview"
  ).length;
  const playbackCaptures = results.filter(
    (r) => r.audioSource === "playback_capture"
  ).length;

  return {
    total,
    high,
    medium,
    low,
    unknown,
    blocklistMatches,
    noPreview,
    deezerFallbacks,
    playbackCaptures,
    flagged: high + medium,
  };
}
