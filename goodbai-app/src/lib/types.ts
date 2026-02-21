// ─── Spotify API Types ─────────────────────────────────────────

export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp in ms
}

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyUser {
  id: string;
  display_name: string | null;
  images: SpotifyImage[];
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  owner: { display_name: string | null; id: string };
  tracks: { total: number };
  public: boolean;
  collaborative: boolean;
  snapshot_id: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  preview_url: string | null;
  uri: string;
  external_urls: { spotify: string };
  /** ISRC code for cross-platform matching (e.g. Deezer fallback) */
  external_ids?: { isrc?: string };
}

export interface SpotifyPlaylistTrack {
  added_at: string;
  track: SpotifyTrack | null; // null for local files or deleted tracks
}

// ─── Scanner Types ─────────────────────────────────────────────

export type DetectionMethod = "blocklist" | "audio_analysis" | "both";

export type RiskLevel = "high" | "medium" | "low" | "unknown";

export type AudioSource = "spotify_preview" | "deezer_preview" | "playback_capture" | "none";

export interface ScanResult {
  track: SpotifyTrack;
  /** AI probability from SONICS model (0–1), null if no preview available */
  audioScore: number | null;
  /** Whether the artist matched the blocklist */
  blocklistMatch: boolean;
  /** Which specific blocklist artist names matched */
  matchedArtists: string[];
  /** Combined detection method used */
  detectionMethod: DetectionMethod;
  /** Overall risk level */
  riskLevel: RiskLevel;
  /** Whether user has selected this track for removal */
  selected: boolean;
  /** Where the audio for analysis came from */
  audioSource: AudioSource;
}

export interface ScanProgress {
  phase: "blocklist" | "audio" | "complete";
  totalTracks: number;
  processedTracks: number;
  /** Number of tracks flagged as AI so far */
  flaggedCount: number;
  /** Current track being analyzed */
  currentTrack: string | null;
}

export interface PlaylistScanState {
  playlist: SpotifyPlaylist;
  status: "idle" | "loading_tracks" | "scanning" | "complete" | "error";
  progress: ScanProgress;
  results: ScanResult[];
  error: string | null;
}

// ─── App State ─────────────────────────────────────────────────

export interface AuthState {
  isAuthenticated: boolean;
  user: SpotifyUser | null;
  tokens: SpotifyTokens | null;
}
