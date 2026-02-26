"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Music, Lock, Activity } from "lucide-react";
import type { SpotifyPlaylist } from "@/lib/types";

interface PlaylistCardProps {
  playlist: SpotifyPlaylist;
  onClick: (playlist: SpotifyPlaylist) => void;
}

export function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      className="group relative cursor-pointer overflow-hidden border-2 border-border bg-card transition-all duration-300 hover:border-primary hover:-translate-y-1 hover:translate-x-1 hover:shadow-[-4px_4px_0_0_#1ed760] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-none"
      onClick={() => onClick(playlist)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(playlist);
        }
      }}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0JyBoZWlnaHQ9JzQnPjxyZWN0IHdpZHRoPSc0JyBoZWlnaHQ9JzQnIGZpbGw9J25vbmUnLz48Y2lyY2xlIGN4PScxJyBjeT0nMScgcj0nMScgZmlsbD0nIzBlZDU1Micgb3BhY2l0eT0nMC4yJy8+PC9zdmc+')] opacity-0 transition-opacity duration-300 group-hover:opacity-100 mix-blend-overlay" />
      <CardContent className="relative flex items-center gap-4 p-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-border shadow-[2px_2px_0_0_var(--color-border)] group-hover:shadow-[2px_2px_0_0_#1ed760] transition-shadow">
          {playlist.images?.[0] ? (
            <img
              src={playlist.images[0].url}
              alt={playlist.name}
              className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:scale-110 group-hover:grayscale-0"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted transition-colors duration-300 group-hover:bg-primary/20">
              <Music className="h-6 w-6 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100">
            <Activity className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-black tracking-tighter uppercase text-foreground transition-colors group-hover:text-primary">
            {playlist.name}
          </h3>
          <p className="mt-1 truncate text-xs font-mono uppercase tracking-widest text-muted-foreground group-hover:text-foreground/80 transition-colors">
            {playlist.tracks.total} TRKS
            {playlist.owner?.display_name && (
              <> // {playlist.owner.display_name}</>
            )}
          </p>
          {(playlist.public === false || playlist.collaborative) && (
            <div className="mt-2 flex items-center gap-2">
              {!playlist.public && (
                <Lock className="h-3 w-3 text-destructive" />
              )}
              {playlist.collaborative && (
                <span className="border border-secondary-foreground/20 px-1 py-0.5 text-[9px] font-mono text-secondary-foreground uppercase tracking-widest bg-secondary/30">
                  Collab
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
