"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PlaylistCard } from "@/components/playlist-card";
import { Loader2, RefreshCw, Search, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SpotifyPlaylist } from "@/lib/types";
import { motion, Variants } from "framer-motion";

interface PlaylistSelectorProps {
  onSelectPlaylist: (playlist: SpotifyPlaylist) => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 20 } }
};

export function PlaylistSelector({
  onSelectPlaylist,
}: PlaylistSelectorProps) {
  const { spotifyClient, tokens } = useAuth();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debugInfo, setDebugInfo] = useState<string>("Waiting for client...");

  const loadPlaylists = async () => {
    if (!spotifyClient) {
      setDebugInfo("spotifyClient is null — cannot load");
      return;
    }
    setLoading(true);
    setError(null);
    setDebugInfo("Fetching playlists from Spotify API...");

    try {
      const pl = await spotifyClient.getAllUserPlaylists();
      setDebugInfo(`Loaded ${pl.length} playlists`);
      setPlaylists(pl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load playlists";
      console.error("Playlist load error:", err);
      setDebugInfo(`Error: ${msg}`);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (spotifyClient) {
      setDebugInfo("Client ready — loading playlists...");
      loadPlaylists();
    } else {
      setDebugInfo(
        tokens ? "Tokens exist but client not created yet" : "No tokens available"
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifyClient]);

  const filteredPlaylists = playlists.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!spotifyClient || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Music className="h-10 w-10 text-primary opacity-50" />
        </motion.div>
        <p className="mt-6 text-sm font-medium text-muted-foreground animate-pulse">
          Loading your playlists...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 shadow-sm">
          <p className="text-destructive font-medium">{error}</p>
          <Button variant="outline" onClick={loadPlaylists} className="mt-6 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your Playlists</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select a playlist to scan for AI-generated tracks
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPlaylists} className="w-fit rounded-full hover:bg-primary/10 hover:text-primary transition-colors border-border/50">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </header>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mb-8"
      >
        <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Search playlists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-border/50 bg-card/50 py-4 pl-12 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
        />
      </motion.div>

      {/* Grid */}
      {filteredPlaylists.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="py-16 text-center text-muted-foreground"
        >
          {searchQuery
            ? "No playlists match your search."
            : "No playlists found."}
        </motion.p>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filteredPlaylists.map((playlist) => (
            <motion.article key={playlist.id} variants={itemVariants} whileHover={{ y: -4, transition: { type: "spring", stiffness: 200, damping: 20 } }} transition={{ type: "spring", stiffness: 100, damping: 20 }}>
              <PlaylistCard
                playlist={playlist}
                onClick={onSelectPlaylist}
              />
            </motion.article>
          ))}
        </motion.div>
      )}
    </section>
  );
}
