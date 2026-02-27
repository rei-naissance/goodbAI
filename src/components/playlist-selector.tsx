"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PlaylistCard } from "@/components/playlist-card";
import { RefreshCw, Search, Music } from "lucide-react";
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
  const { spotifyClient } = useAuth();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const loadPlaylists = async () => {
    if (!spotifyClient) {
      console.log("spotifyClient is null — cannot load");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const pl = await spotifyClient.getAllUserPlaylists();
      setPlaylists(pl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load playlists";
      console.error("Playlist load error:", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (spotifyClient) {
      loadPlaylists();
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
        <div className="rounded-none border-2 border-destructive bg-destructive/10 p-8 shadow-[4px_4px_0_0_var(--color-destructive)]">
          <p className="text-destructive font-mono font-bold uppercase tracking-widest text-sm">SYS_ERROR:: {error}</p>
          <Button variant="outline" onClick={loadPlaylists} className="mt-6 rounded-none border-2 border-destructive text-destructive hover:bg-destructive hover:text-black transition-colors font-mono uppercase tracking-widest text-xs">
            <RefreshCw className="mr-2 h-4 w-4" />
            RETRY_CONNECTION
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b-2 border-primary pb-4">
        <div className="relative">
          <h2 className="text-4xl font-black uppercase tracking-tighter">Your Playlists</h2>
          <p className="text-xs text-primary font-mono mt-1 uppercase tracking-widest opacity-80">
            Select a target for structural scan
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPlaylists} className="w-fit rounded-none border-2 border-primary hover:bg-primary hover:text-black text-primary transition-colors font-mono uppercase tracking-widest text-xs">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </header>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mb-8 group"
      >
        <div className="absolute top-0 left-0 w-2 h-full bg-primary transition-all group-focus-within:w-4"></div>
        <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
        <input
          type="text"
          placeholder="SEARCH PLAYLISTS_ _"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-none border-2 border-border bg-card/50 py-4 pl-14 pr-4 font-mono uppercase text-sm outline-none transition-colors focus:border-primary focus:bg-primary/5 focus:ring-0 shadow-sm"
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
