import type {
  SpotifyUser,
  SpotifyPlaylist,
  SpotifyPlaylistTrack,
  SpotifyTokens,
  SpotifyTrack,
} from "./types";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

/**
 * Spotify API client. All methods require a valid access token.
 */
export class SpotifyClient {
  private accessToken: string;
  private onTokenRefresh?: (tokens: SpotifyTokens) => void;

  constructor(
    accessToken: string,
    onTokenRefresh?: (tokens: SpotifyTokens) => void
  ) {
    this.accessToken = accessToken;
    this.onTokenRefresh = onTokenRefresh;
  }

  updateToken(accessToken: string) {
    this.accessToken = accessToken;
  }

  private static readonly MAX_RETRIES = 3;
  private static readonly MAX_RETRY_AFTER_SECONDS = 30;

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {},
    currentRetry = 0
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${SPOTIFY_API_BASE}${endpoint}`;

    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (res.status === 401) {
      // Try to refresh the token
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry the request with the new token
        const retryRes = await fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
            ...options.headers,
          },
        });
        if (!retryRes.ok) {
          throw new Error(
            `Spotify API error: ${retryRes.status} ${retryRes.statusText}`
          );
        }
        if (retryRes.status === 204) return undefined as T;
        return retryRes.json();
      }
      throw new Error("Spotify session expired. Please log in again.");
    }

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "5", 10);

      // If Spotify says to wait an unreasonable amount, don't retry
      if (retryAfter > SpotifyClient.MAX_RETRY_AFTER_SECONDS) {
        const minutes = Math.ceil(retryAfter / 60);
        throw new Error(
          `Spotify rate limit: try again in ~${minutes >= 60 ? Math.ceil(minutes / 60) + " hour(s)" : minutes + " minute(s)"}. This can happen after many rapid requests.`
        );
      }

      const nextRetry = currentRetry + 1;
      if (nextRetry > SpotifyClient.MAX_RETRIES) {
        throw new Error("Spotify rate limit: too many retries. Please wait a moment and try again.");
      }

      await new Promise((resolve) =>
        setTimeout(resolve, retryAfter * 1000)
      );

      return this.fetch<T>(endpoint, options, nextRetry);
    }

    if (!res.ok) {
      throw new Error(
        `Spotify API error: ${res.status} ${res.statusText}`
      );
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) return false;
      const tokens: SpotifyTokens = await res.json();
      this.accessToken = tokens.access_token;
      this.onTokenRefresh?.(tokens);
      return true;
    } catch {
      return false;
    }
  }

  // ─── User ──────────────────────────────────────────────────

  async getCurrentUser(): Promise<SpotifyUser> {
    return this.fetch<SpotifyUser>("/me");
  }

  // ─── Playlists ──────────────────────────────────────────────

  async getUserPlaylists(
    limit = 50,
    offset = 0
  ): Promise<{ items: SpotifyPlaylist[]; total: number }> {
    return this.fetch(`/me/playlists?limit=${limit}&offset=${offset}`);
  }

  async getAllUserPlaylists(): Promise<SpotifyPlaylist[]> {
    const playlists: SpotifyPlaylist[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      const page = await this.getUserPlaylists(limit, offset);
      if (page.items) {
        playlists.push(...page.items.filter(Boolean));
      }

      if (playlists.length >= page.total || !page.items || page.items.length < limit) break;
      offset += limit;
    }

    return playlists;
  }

  // ─── Tracks ──────────────────────────────────────────────────

  async getPlaylistTracks(
    playlistId: string,
    limit = 100,
    offset = 0
  ): Promise<{ items: SpotifyPlaylistTrack[]; total: number }> {
    return this.fetch(
      `/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&fields=items(added_at,track(id,name,artists(id,name,uri),album(id,name,images),duration_ms,preview_url,uri,external_urls,external_ids)),total`
    );
  }

  async getAllPlaylistTracks(
    playlistId: string
  ): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const page = await this.getPlaylistTracks(playlistId, limit, offset);
      for (const item of page.items) {
        if (item.track) {
          tracks.push(item.track);
        }
      }
      if (tracks.length >= page.total || page.items.length < limit) break;
      offset += limit;
    }

    return tracks;
  }

  // ─── Remove Tracks ───────────────────────────────────────────

  async removeTracksFromPlaylist(
    playlistId: string,
    trackUris: string[]
  ): Promise<void> {
    // Spotify allows removing max 100 tracks per request
    const batches: string[][] = [];
    for (let i = 0; i < trackUris.length; i += 100) {
      batches.push(trackUris.slice(i, i + 100));
    }

    for (const batch of batches) {
      await this.fetch(`/playlists/${playlistId}/tracks`, {
        method: "DELETE",
        body: JSON.stringify({
          tracks: batch.map((uri) => ({ uri })),
        }),
      });
    }
  }

  // ─── Liked Songs ─────────────────────────────────────────────

  async getLikedSongs(
    limit = 50,
    offset = 0
  ): Promise<{ items: SpotifyPlaylistTrack[]; total: number }> {
    return this.fetch(`/me/tracks?limit=${limit}&offset=${offset}`);
  }

  async removeLikedSongs(trackIds: string[]): Promise<void> {
    const batches: string[][] = [];
    for (let i = 0; i < trackIds.length; i += 50) {
      batches.push(trackIds.slice(i, i + 50));
    }

    for (const batch of batches) {
      await this.fetch("/me/tracks", {
        method: "DELETE",
        body: JSON.stringify({ ids: batch }),
      });
    }
  }
}
