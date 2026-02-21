/**
 * Deezer API client for fetching audio preview URLs as a fallback.
 *
 * Deezer reliably provides 30-second preview URLs for most tracks.
 * We match tracks via ISRC (International Standard Recording Code)
 * which is available from Spotify's track metadata.
 *
 * Deezer's API is free and requires no authentication.
 */

const DEEZER_API_BASE = "https://api.deezer.com";

interface DeezerTrack {
  id: number;
  title: string;
  preview: string; // 30-second MP3 preview URL
  artist: { name: string };
}

interface DeezerSearchResponse {
  data: DeezerTrack[];
  total: number;
}

/**
 * Search Deezer for a track by ISRC and return the preview URL.
 * ISRC is a universal identifier, so this gives exact matches.
 *
 * Returns null if no match or no preview is available.
 */
export async function getDeezerPreviewByISRC(
  isrc: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${DEEZER_API_BASE}/2.0/track/isrc:${encodeURIComponent(isrc)}`
    );

    if (!res.ok) return null;

    const data = await res.json();

    // Deezer returns an error object if not found
    if (data.error) return null;

    // The preview field contains a direct MP3 URL
    if (data.preview && data.preview.length > 0) {
      return data.preview;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fallback: search Deezer by track name + artist name.
 * Less reliable than ISRC but covers tracks without ISRC codes.
 */
export async function getDeezerPreviewBySearch(
  trackName: string,
  artistName: string
): Promise<string | null> {
  try {
    const query = `track:"${trackName}" artist:"${artistName}"`;
    const res = await fetch(
      `${DEEZER_API_BASE}/search?q=${encodeURIComponent(query)}&limit=1`
    );

    if (!res.ok) return null;

    const data: DeezerSearchResponse = await res.json();

    if (data.data && data.data.length > 0 && data.data[0].preview) {
      return data.data[0].preview;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Try to find a Deezer preview for a track.
 * Attempts ISRC first, then falls back to name/artist search.
 */
export async function findDeezerPreview(
  isrc: string | null,
  trackName: string,
  artistName: string
): Promise<string | null> {
  // Try ISRC first (exact match)
  if (isrc) {
    const preview = await getDeezerPreviewByISRC(isrc);
    if (preview) return preview;
  }

  // Fallback to search
  return getDeezerPreviewBySearch(trackName, artistName);
}
