"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PlaylistCard } from "@/components/playlist-card";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SpotifyPlaylist } from "@/lib/types";

interface PlaylistSelectorProps {
  onSelectPlaylist: (playlist: SpotifyPlaylist) => void;
}

export function PlaylistSelector({
  onSelectPlaylist,
}: PlaylistSelectorProps) {
  const { spotifyClient } = useAuth();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadPlaylists = async () => {
    if (!spotifyClient) return;
    setLoading(true);
    setError(null);

    try {
      const pl = await spotifyClient.getAllUserPlaylists();
      setPlaylists(pl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load playlists"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifyClient]);

  const filteredPlaylists = playlists.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          Loading your playlists...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={loadPlaylists} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Playlists</h2>
          <p className="text-sm text-muted-foreground">
            Select a playlist to scan for AI-generated tracks
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPlaylists}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search playlists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Grid */}
      {filteredPlaylists.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          {searchQuery
            ? "No playlists match your search"
            : "No playlists found"}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlaylists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onClick={onSelectPlaylist}
            />
          ))}
        </div>
      )}
    </div>
  );
}
